import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { parseRsvpBody, parsedRsvpToPrismaWrite } from "@/lib/parse-rsvp-body";
import { clearCarpoolAssignmentsForRsvp } from "@/lib/carpool-rsvp-cleanup";

const optimisationReset = {
  calcDepartureTime: null as Date | null,
  calcDriveToVenueMin: null as number | null,
  travelTimeMin: null as number | null,
  transitToPickupMin: null as number | null,
  carpoolGroupId: null as string | null,
};

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string; userId: string }> },
) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id: sessionId, userId } = await context.params;

  const sessionRow = await prisma.session.findUnique({ where: { id: sessionId } });
  if (!sessionRow) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const targetUser = await prisma.user.findUnique({ where: { id: userId } });
  if (!targetUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const body = await request.json();
  const parsed = parseRsvpBody(body);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const write = parsedRsvpToPrismaWrite(parsed.data);

  const rsvp = await prisma.$transaction(async (tx) => {
    const existing = await tx.rSVP.findUnique({
      where: { userId_sessionId: { userId, sessionId } },
    });
    if (existing) {
      await clearCarpoolAssignmentsForRsvp(tx, existing.id);
    }

    return tx.rSVP.upsert({
      where: { userId_sessionId: { userId, sessionId } },
      create: {
        userId,
        sessionId,
        ...write,
        ...optimisationReset,
      },
      update: {
        ...write,
        ...optimisationReset,
      },
    });
  });

  return NextResponse.json({ rsvp });
}
