import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession, requireAdmin } from "@/lib/auth";
import { syncSessionStatus } from "@/lib/sync-session-status";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const sessions = await prisma.session.findMany({
    where: { date: { gte: now } },
    orderBy: { date: "asc" },
    include: {
      rsvps: {
        where: { userId: session.sub },
        take: 1,
      },
    },
  });

  const out = [];
  for (const s of sessions) {
    const synced = await syncSessionStatus(s);
    out.push({ ...s, ...synced, rsvps: s.rsvps });
  }

  return NextResponse.json({ sessions: out });
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = await request.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const locationName = typeof body.locationName === "string" ? body.locationName.trim() : "";
    const locationLat = Number(body.locationLat);
    const locationLng = Number(body.locationLng);
    const date = body.date ? new Date(body.date) : null;
    const rsvpDeadline = body.rsvpDeadline ? new Date(body.rsvpDeadline) : null;

    if (!name || !locationName || !Number.isFinite(locationLat) || !Number.isFinite(locationLng) || !date || !rsvpDeadline) {
      return NextResponse.json({ error: "Invalid session payload" }, { status: 400 });
    }

    const created = await prisma.session.create({
      data: {
        name,
        date,
        locationName,
        locationLat,
        locationLng,
        rsvpDeadline,
        status: "OPEN",
      },
    });
    return NextResponse.json({ session: created }, { status: 201 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error";
    if (msg === "Unauthorized" || msg === "Forbidden") {
      return NextResponse.json({ error: msg }, { status: msg === "Forbidden" ? 403 : 401 });
    }
    return NextResponse.json({ error: "Failed to create session" }, { status: 500 });
  }
}
