import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession, requireAdmin } from "@/lib/auth";
import { syncSessionStatus } from "@/lib/sync-session-status";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const found = await prisma.session.findUnique({
    where: { id },
    include: {
      rsvps: {
        include: { user: { select: { id: true, name: true, email: true } } },
      },
      carpoolGroups: {
        include: {
          driverRsvp: {
            include: { user: { select: { id: true, name: true } } },
          },
          riders: {
            include: { user: { select: { id: true, name: true } } },
          },
        },
      },
    },
  });

  if (!found) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const synced = await syncSessionStatus(found);
  const merged = { ...found, ...synced };

  return NextResponse.json({ session: merged });
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();
    const { id } = await context.params;
    const body = await request.json();

    const data: Record<string, unknown> = {};
    if (typeof body.name === "string") data.name = body.name.trim();
    if (typeof body.locationName === "string") data.locationName = body.locationName.trim();
    if (body.locationLat != null) data.locationLat = Number(body.locationLat);
    if (body.locationLng != null) data.locationLng = Number(body.locationLng);
    if (body.date) data.date = new Date(body.date);
    if (body.rsvpDeadline) data.rsvpDeadline = new Date(body.rsvpDeadline);
    if (typeof body.status === "string") {
      const allowed = ["OPEN", "CLOSED", "OPTIMISED", "PUBLISHED"] as const;
      if (allowed.includes(body.status as (typeof allowed)[number])) {
        data.status = body.status;
      }
    }

    const updated = await prisma.session.update({
      where: { id },
      data,
    });
    return NextResponse.json({ session: updated });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error";
    if (msg === "Unauthorized" || msg === "Forbidden") {
      return NextResponse.json({ error: msg }, { status: msg === "Forbidden" ? 403 : 401 });
    }
    return NextResponse.json({ error: "Failed to update session" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();
    const { id } = await context.params;
    await prisma.session.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error";
    if (msg === "Unauthorized" || msg === "Forbidden") {
      return NextResponse.json({ error: msg }, { status: msg === "Forbidden" ? 403 : 401 });
    }
    return NextResponse.json({ error: "Failed to delete session" }, { status: 500 });
  }
}
