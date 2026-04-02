import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { syncSessionStatus } from "@/lib/sync-session-status";
import type { TransportMode } from "@prisma/client";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: sessionId } = await context.params;
  const found = await prisma.session.findUnique({ where: { id: sessionId } });
  if (!found) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const s = await syncSessionStatus(found);
  if (s.status !== "OPEN" || Date.now() >= s.rsvpDeadline.getTime()) {
    return NextResponse.json({ error: "RSVP is closed for this session" }, { status: 403 });
  }

  const body = await request.json();
  const attending = Boolean(body.attending);

  let needsCarpool = false;
  let isDriver = false;
  let transportMode: TransportMode | null = null;
  let pickupStation: string | null = null;
  let pickupLat: number | null = null;
  let pickupLng: number | null = null;
  let availableSeats: number | null = null;
  let startLocation: string | null = null;
  let startLat: number | null = null;
  let startLng: number | null = null;

  if (attending) {
    const mode = body.carpoolMode as string | undefined;
    if (mode === "driver") {
      isDriver = true;
      needsCarpool = false;
      pickupStation = typeof body.pickupStation === "string" ? body.pickupStation : "";
      pickupLat = body.pickupLat != null ? Number(body.pickupLat) : null;
      pickupLng = body.pickupLng != null ? Number(body.pickupLng) : null;
      availableSeats = body.availableSeats != null ? Number(body.availableSeats) : null;
      if (!pickupStation || !Number.isFinite(pickupLat) || !Number.isFinite(pickupLng)) {
        return NextResponse.json({ error: "Pickup station and coordinates required for drivers" }, { status: 400 });
      }
      if (
        availableSeats == null ||
        !Number.isFinite(availableSeats) ||
        availableSeats < 1
      ) {
        return NextResponse.json({ error: "At least one seat required" }, { status: 400 });
      }
    } else if (mode === "rider") {
      needsCarpool = true;
      isDriver = false;
      startLocation = typeof body.startLocation === "string" ? body.startLocation : "";
      startLat = body.startLat != null ? Number(body.startLat) : null;
      startLng = body.startLng != null ? Number(body.startLng) : null;
      if (!startLocation || !Number.isFinite(startLat) || !Number.isFinite(startLng)) {
        return NextResponse.json({ error: "Start location required" }, { status: 400 });
      }
    } else if (mode === "own") {
      needsCarpool = false;
      isDriver = false;
      const tm = body.transportMode as string | undefined;
      if (tm === "DRIVING" || tm === "PUBLIC_TRANSPORT" || tm === "WALKING") {
        transportMode = tm;
      } else {
        return NextResponse.json({ error: "Transport mode required" }, { status: 400 });
      }
      startLocation = typeof body.startLocation === "string" ? body.startLocation : "";
      startLat = body.startLat != null ? Number(body.startLat) : null;
      startLng = body.startLng != null ? Number(body.startLng) : null;
      if (!startLocation || !Number.isFinite(startLat) || !Number.isFinite(startLng)) {
        return NextResponse.json({ error: "Start location required" }, { status: 400 });
      }
    } else {
      return NextResponse.json({ error: "Carpool preference required when attending" }, { status: 400 });
    }
  } else {
    needsCarpool = false;
    isDriver = false;
  }

  const cleared = {
    transportMode: null as TransportMode | null,
    pickupStation: null as string | null,
    pickupLat: null as number | null,
    pickupLng: null as number | null,
    availableSeats: null as number | null,
    startLocation: null as string | null,
    startLat: null as number | null,
    startLng: null as number | null,
  };

  const rsvp = await prisma.rSVP.upsert({
    where: {
      userId_sessionId: { userId: session.sub, sessionId },
    },
    create: {
      userId: session.sub,
      sessionId,
      attending,
      needsCarpool: attending ? needsCarpool : false,
      isDriver: attending ? isDriver : false,
      transportMode: attending ? transportMode : null,
      pickupStation: attending && isDriver ? pickupStation : null,
      pickupLat: attending && isDriver ? pickupLat : null,
      pickupLng: attending && isDriver ? pickupLng : null,
      availableSeats: attending && isDriver ? availableSeats : null,
      startLocation:
        attending && (needsCarpool || body.carpoolMode === "own") ? startLocation : null,
      startLat: attending && (needsCarpool || body.carpoolMode === "own") ? startLat : null,
      startLng: attending && (needsCarpool || body.carpoolMode === "own") ? startLng : null,
    },
    update: attending
      ? {
          attending: true,
          needsCarpool,
          isDriver,
          transportMode,
          pickupStation: isDriver ? pickupStation : null,
          pickupLat: isDriver ? pickupLat : null,
          pickupLng: isDriver ? pickupLng : null,
          availableSeats: isDriver ? availableSeats : null,
          startLocation: needsCarpool || body.carpoolMode === "own" ? startLocation : null,
          startLat: needsCarpool || body.carpoolMode === "own" ? startLat : null,
          startLng: needsCarpool || body.carpoolMode === "own" ? startLng : null,
        }
      : {
          attending: false,
          needsCarpool: false,
          isDriver: false,
          ...cleared,
        },
  });

  return NextResponse.json({ rsvp });
}
