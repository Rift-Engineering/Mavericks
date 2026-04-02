import type { TransportMode } from "@prisma/client";

export type ParsedRsvpBody =
  | { attending: false }
  | {
      attending: true;
      carpoolMode: "driver" | "rider" | "own";
      needsCarpool: boolean;
      isDriver: boolean;
      transportMode: TransportMode | null;
      pickupStation: string | null;
      pickupLat: number | null;
      pickupLng: number | null;
      availableSeats: number | null;
      startLocation: string | null;
      startLat: number | null;
      startLng: number | null;
    };

export function parseRsvpBody(
  body: unknown,
): { ok: true; data: ParsedRsvpBody } | { ok: false; error: string } {
  const b = body as Record<string, unknown>;
  const attending = Boolean(b.attending);

  if (!attending) {
    return { ok: true, data: { attending: false } };
  }

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
  let carpoolMode: "driver" | "rider" | "own";

  const mode = b.carpoolMode as string | undefined;
  if (mode === "driver") {
    carpoolMode = "driver";
    isDriver = true;
    needsCarpool = false;
    pickupStation = typeof b.pickupStation === "string" ? b.pickupStation : "";
    pickupLat = b.pickupLat != null ? Number(b.pickupLat) : null;
    pickupLng = b.pickupLng != null ? Number(b.pickupLng) : null;
    availableSeats = b.availableSeats != null ? Number(b.availableSeats) : null;
    startLocation = typeof b.startLocation === "string" ? b.startLocation : "";
    startLat = b.startLat != null ? Number(b.startLat) : null;
    startLng = b.startLng != null ? Number(b.startLng) : null;
    if (!pickupStation || !Number.isFinite(pickupLat) || !Number.isFinite(pickupLng)) {
      return { ok: false, error: "Pickup station and coordinates required for drivers" };
    }
    if (!startLocation || !Number.isFinite(startLat) || !Number.isFinite(startLng)) {
      return { ok: false, error: "Where you drive from (start location) is required for drivers" };
    }
    if (availableSeats == null || !Number.isFinite(availableSeats) || availableSeats < 1) {
      return { ok: false, error: "At least one seat required" };
    }
  } else if (mode === "rider") {
    carpoolMode = "rider";
    needsCarpool = true;
    isDriver = false;
    startLocation = typeof b.startLocation === "string" ? b.startLocation : "";
    startLat = b.startLat != null ? Number(b.startLat) : null;
    startLng = b.startLng != null ? Number(b.startLng) : null;
    if (!startLocation || !Number.isFinite(startLat) || !Number.isFinite(startLng)) {
      return { ok: false, error: "Start location required" };
    }
  } else if (mode === "own") {
    carpoolMode = "own";
    needsCarpool = false;
    isDriver = false;
    const tm = b.transportMode as string | undefined;
    if (tm === "DRIVING" || tm === "PUBLIC_TRANSPORT" || tm === "WALKING") {
      transportMode = tm;
    } else {
      return { ok: false, error: "Transport mode required" };
    }
    startLocation = typeof b.startLocation === "string" ? b.startLocation : "";
    startLat = b.startLat != null ? Number(b.startLat) : null;
    startLng = b.startLng != null ? Number(b.startLng) : null;
    if (!startLocation || !Number.isFinite(startLat) || !Number.isFinite(startLng)) {
      return { ok: false, error: "Start location required" };
    }
  } else {
    return { ok: false, error: "Carpool preference required when attending" };
  }

  return {
    ok: true,
    data: {
      attending: true,
      carpoolMode,
      needsCarpool,
      isDriver,
      transportMode,
      pickupStation,
      pickupLat,
      pickupLng,
      availableSeats,
      startLocation,
      startLat,
      startLng,
    },
  };
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

/** Maps parsed body to Prisma RSVP fields (same rules as the player RSVP POST). */
export function parsedRsvpToPrismaWrite(parsed: ParsedRsvpBody) {
  if (!parsed.attending) {
    return {
      attending: false,
      needsCarpool: false,
      isDriver: false,
      ...cleared,
    };
  }

  const needsStart =
    parsed.needsCarpool || parsed.carpoolMode === "own" || parsed.isDriver;
  return {
    attending: true as const,
    needsCarpool: parsed.needsCarpool,
    isDriver: parsed.isDriver,
    transportMode: parsed.transportMode,
    pickupStation: parsed.isDriver ? parsed.pickupStation : null,
    pickupLat: parsed.isDriver ? parsed.pickupLat : null,
    pickupLng: parsed.isDriver ? parsed.pickupLng : null,
    availableSeats: parsed.isDriver ? parsed.availableSeats : null,
    startLocation: needsStart ? parsed.startLocation : null,
    startLat: needsStart ? parsed.startLat : null,
    startLng: needsStart ? parsed.startLng : null,
  };
}
