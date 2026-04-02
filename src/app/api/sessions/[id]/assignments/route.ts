import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import {
  collectInputsFromRsvps,
  computeDriverStartToPickupMinutes,
  durationSecFromElement,
  driverTotalTravelMinutes,
} from "@/lib/optimise";
import type { MatrixRow } from "@/lib/maps";
import type { RSVP } from "@prisma/client";

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id: sessionId } = await context.params;
  const body = await request.json();
  const groups = body.groups as { driverRsvpId: string; riderRsvpIds: string[] }[] | undefined;
  if (!groups || !Array.isArray(groups)) {
    return NextResponse.json({ error: "Invalid body: groups[]" }, { status: 400 });
  }

  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: { rsvps: true },
  });

  if (!session) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (session.status === "PUBLISHED") {
    return NextResponse.json({ error: "Cannot edit published assignments" }, { status: 400 });
  }

  const snap = await prisma.optimisationSnapshot.findUnique({
    where: { sessionId },
  });
  if (!snap?.step2Json) {
    return NextResponse.json(
      { error: "Run optimisation first to build distance matrices" },
      { status: 400 },
    );
  }

  const step2 = snap.step2Json as unknown as MatrixRow[];
  const { drivers, riders } = collectInputsFromRsvps(session.rsvps as RSVP[]);
  const riderIds = riders.map((r) => r.rsvp.id);
  const driverIds = drivers.map((d) => d.rsvp.id);

  const matrixSec = (riderRsvpId: string, driverRsvpId: string): number | null => {
    const ri = riderIds.indexOf(riderRsvpId);
    const di = driverIds.indexOf(driverRsvpId);
    if (ri < 0 || di < 0) return null;
    return durationSecFromElement(step2[ri]?.elements[di]);
  };

  const driverDepartures = new Map<string, number>();
  const driveToVenueMin = new Map<string, number>();
  for (const d of drivers) {
    const dep = d.rsvp.calcDepartureTime?.getTime();
    const dm = d.rsvp.calcDriveToVenueMin;
    if (dep != null) driverDepartures.set(d.rsvp.id, dep);
    if (dm != null) driveToVenueMin.set(d.rsvp.id, dm);
  }

  const sessionStart = session.date.getTime();
  const step1Departure = new Date(sessionStart - 120 * 60 * 1000);
  const driveStartToPickupMin = await computeDriverStartToPickupMinutes(drivers, step1Departure);

  await prisma.$transaction(async (tx) => {
    await tx.carpoolGroup.deleteMany({ where: { sessionId } });

    await tx.rSVP.updateMany({
      where: { sessionId },
      data: {
        carpoolGroupId: null,
        transitToPickupMin: null,
      },
    });

    for (const g of groups) {
      const driverRsvp = await tx.rSVP.findUnique({ where: { id: g.driverRsvpId } });
      if (!driverRsvp?.isDriver || driverRsvp.sessionId !== sessionId) continue;

      const group = await tx.carpoolGroup.create({
        data: {
          sessionId,
          driverRsvpId: g.driverRsvpId,
        },
      });

      const depMs = driverDepartures.get(g.driverRsvpId);
      const driveM = driveToVenueMin.get(g.driverRsvpId) ?? 0;

      for (const rid of g.riderRsvpIds) {
        const tSec = matrixSec(rid, g.driverRsvpId);
        const transitMin = tSec != null ? Math.ceil(tSec / 60) : null;
        const riderDepMs =
          depMs != null && tSec != null ? depMs - tSec * 1000 : null;

        await tx.rSVP.update({
          where: { id: rid },
          data: {
            carpoolGroupId: group.id,
            transitToPickupMin: transitMin,
            calcDepartureTime: riderDepMs != null ? new Date(riderDepMs) : null,
            travelTimeMin: transitMin != null ? transitMin + driveM : null,
          },
        });
      }
    }

    for (const d of drivers) {
      const dm = d.rsvp.calcDriveToVenueMin ?? 0;
      const sm = driveStartToPickupMin.get(d.rsvp.id);
      const travelMin = driverTotalTravelMinutes(dm, sm);
      await tx.rSVP.update({
        where: { id: d.rsvp.id },
        data: {
          travelTimeMin: dm > 0 || (sm ?? 0) > 0 ? travelMin : null,
        },
      });
    }
  });

  return NextResponse.json({ ok: true });
}
