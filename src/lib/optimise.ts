import { prisma } from "@/lib/db";
import { distanceMatrix, type LatLng, type MatrixRow } from "@/lib/maps";
import type { RSVP, Session } from "@prisma/client";

export const DRIVER_BUFFER_MIN = 10;

export type DriverInput = {
  rsvp: RSVP;
  pickup: LatLng;
  /** Home / departure point; when set, travel time includes start→pickup + pickup→venue. */
  start: LatLng | null;
};

type RiderInput = {
  rsvp: RSVP;
  start: LatLng;
};

export type OptimisationSnapshotData = {
  step1: MatrixRow[];
  step2: MatrixRow[];
  step3ByRsvpId: Record<string, number | null>;
  meta: {
    sessionStartMs: number;
    venue: LatLng;
  };
};

function msMinusMinutes(ms: number, min: number) {
  return ms - min * 60 * 1000;
}

/** Driving minutes from each driver's start to their pickup (diagonal of the matrix). */
export async function computeDriverStartToPickupMinutes(
  drivers: DriverInput[],
  departure: Date,
): Promise<Map<string, number>> {
  const out = new Map<string, number>();
  const paired = drivers.filter((d) => d.start != null);
  if (paired.length === 0) return out;

  const origins = paired.map((d) => d.start!);
  const destinations = paired.map((d) => d.pickup);
  const rows = await distanceMatrix(origins, destinations, "driving", departure);
  paired.forEach((d, i) => {
    const sec = rows[i]?.elements[i]?.durationSec;
    if (sec != null && Number.isFinite(sec)) {
      out.set(d.rsvp.id, Math.ceil(sec / 60));
    }
  });
  return out;
}

export function driverTotalTravelMinutes(
  pickupToVenueMin: number,
  startToPickupMin: number | undefined,
): number {
  return (startToPickupMin ?? 0) + pickupToVenueMin;
}

function mapTransportMode(
  tm: string | null | undefined,
): "driving" | "transit" | "walking" | null {
  if (tm === "DRIVING") return "driving";
  if (tm === "PUBLIC_TRANSPORT") return "transit";
  if (tm === "WALKING") return "walking";
  return null;
}

/** Prefer transit durations; use driving when transit has no duration (common API limitation). */
export function mergeRiderPickupMatrices(
  transit: MatrixRow[],
  driving: MatrixRow[],
): MatrixRow[] {
  const n = Math.max(transit.length, driving.length);
  const out: MatrixRow[] = [];
  for (let ri = 0; ri < n; ri++) {
    const tEls = transit[ri]?.elements ?? [];
    const dEls = driving[ri]?.elements ?? [];
    const m = Math.max(tEls.length, dEls.length);
    const elements: MatrixRow["elements"] = [];
    for (let di = 0; di < m; di++) {
      const t = tEls[di];
      const d = dEls[di];
      const useTransit =
        t?.durationSec != null && Number.isFinite(t.durationSec);
      const useDriving =
        d?.durationSec != null && Number.isFinite(d.durationSec);
      const durationSec = useTransit ? t!.durationSec : useDriving ? d!.durationSec : null;
      const status = useTransit ? t!.status : useDriving ? d!.status : "ZERO_RESULTS";
      elements.push({ destinationIndex: di, durationSec, status });
    }
    out.push({ originIndex: ri, elements });
  }
  return out;
}

/** JSON from DB may deserialize numbers oddly; keep assignment math reliable. */
export function durationSecFromElement(
  el: MatrixRow["elements"][number] | undefined,
): number | null {
  if (!el) return null;
  const v = el.durationSec as unknown;
  if (v == null) return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

function step2HasUsableDurations(step2: MatrixRow[]): boolean {
  for (const row of step2) {
    for (const el of row.elements ?? []) {
      if (durationSecFromElement(el) != null) return true;
    }
  }
  return false;
}

async function buildMergedRiderPickupMatrix(
  riderPoints: LatLng[],
  pickupPoints: LatLng[],
  departure: Date,
): Promise<MatrixRow[]> {
  if (riderPoints.length === 0 || pickupPoints.length === 0) return [];
  const [transit, driving] = await Promise.all([
    distanceMatrix(riderPoints, pickupPoints, "transit", departure),
    distanceMatrix(riderPoints, pickupPoints, "driving", departure),
  ]);
  return mergeRiderPickupMatrices(transit, driving);
}

/** Greedy: sort rider–driver pairs by travel time (sec); assign if seat available. */
export function greedyAssign(
  riderIds: string[],
  driverIds: string[],
  capacity: Map<string, number>,
  transitSec: (riderIdx: number, driverIdx: number) => number | null,
): Map<string, string> {
  const assignment = new Map<string, string>();
  const pairs: { r: number; d: number; sec: number }[] = [];
  for (let ri = 0; ri < riderIds.length; ri++) {
    for (let di = 0; di < driverIds.length; di++) {
      const sec = transitSec(ri, di);
      if (sec != null && Number.isFinite(sec)) {
        pairs.push({ r: ri, d: di, sec });
      }
    }
  }
  pairs.sort((a, b) => a.sec - b.sec);

  const seatsLeft = new Map(capacity);
  const assignedRider = new Set<number>();

  for (const p of pairs) {
    if (assignedRider.has(p.r)) continue;
    const did = driverIds[p.d];
    const left = seatsLeft.get(did) ?? 0;
    if (left <= 0) continue;
    seatsLeft.set(did, left - 1);
    assignedRider.add(p.r);
    assignment.set(riderIds[p.r], did);
  }

  return assignment;
}

export async function runOptimisation(
  session: Session,
  drivers: DriverInput[],
  riders: RiderInput[],
  ownWay: {
    rsvp: RSVP;
    start: LatLng;
    mode: "driving" | "transit" | "walking";
  }[],
  options: { refreshMatrices: boolean },
): Promise<OptimisationSnapshotData> {
  const venue: LatLng = { lat: session.locationLat, lng: session.locationLng };
  const sessionStart = session.date.getTime();
  const step1Departure = new Date(msMinusMinutes(sessionStart, 120));
  const step2Departure = new Date(msMinusMinutes(sessionStart, 210));
  const step3Departure = step1Departure;

  let step1: MatrixRow[] = [];
  let step2: MatrixRow[] = [];
  let step3ByRsvpId: Record<string, number | null> = {};

  const existing = await prisma.optimisationSnapshot.findUnique({
    where: { sessionId: session.id },
  });

  const useCache =
    existing &&
    !options.refreshMatrices &&
    existing.step1Json != null &&
    existing.step2Json != null;

  if (useCache) {
    step1 = existing!.step1Json as unknown as MatrixRow[];
    step2 = existing!.step2Json as unknown as MatrixRow[];
    step3ByRsvpId = (existing!.step3Json as unknown as Record<string, number | null>) ?? {};
  } else {
    const driverPoints = drivers.map((d) => d.pickup);
    step1 =
      driverPoints.length > 0
        ? await distanceMatrix(driverPoints, [venue], "driving", step1Departure)
        : [];

    const riderPoints = riders.map((r) => r.start);
    const pickupPoints = drivers.map((d) => d.pickup);
    step2 =
      riderPoints.length > 0 && pickupPoints.length > 0
        ? await buildMergedRiderPickupMatrix(riderPoints, pickupPoints, step2Departure)
        : [];

    step3ByRsvpId = {};
    for (const mode of ["driving", "transit", "walking"] as const) {
      const list = ownWay.filter((o) => o.mode === mode);
      if (list.length === 0) continue;
      const origins = list.map((o) => o.start);
      const m = await distanceMatrix(origins, [venue], mode, step3Departure);
      m.forEach((row, i) => {
        const sec = row.elements[0]?.durationSec ?? null;
        step3ByRsvpId[list[i].rsvp.id] = sec;
      });
    }

    await prisma.optimisationSnapshot.upsert({
      where: { sessionId: session.id },
      create: {
        sessionId: session.id,
        step1Json: step1 as object,
        step2Json: step2 as object,
        step3Json: step3ByRsvpId as object,
      },
      update: {
        step1Json: step1 as object,
        step2Json: step2 as object,
        step3Json: step3ByRsvpId as object,
      },
    });
  }

  // Stale snapshots (e.g. transit-only with all ZERO_RESULTS) must not yield empty assignments.
  const riderPoints = riders.map((r) => r.start);
  const pickupPoints = drivers.map((d) => d.pickup);
  if (
    riderPoints.length > 0 &&
    pickupPoints.length > 0 &&
    !step2HasUsableDurations(step2)
  ) {
    step2 = await buildMergedRiderPickupMatrix(riderPoints, pickupPoints, step2Departure);
    await prisma.optimisationSnapshot.upsert({
      where: { sessionId: session.id },
      create: {
        sessionId: session.id,
        step1Json: step1 as object,
        step2Json: step2 as object,
        step3Json: step3ByRsvpId as object,
      },
      update: { step2Json: step2 as object },
    });
  }

  const driverDepartures = new Map<string, number>();
  const driveToVenueMin = new Map<string, number>();

  drivers.forEach((d, i) => {
    const el = step1[i]?.elements[0];
    const durSec = el?.durationSec;
    if (durSec == null) return;
    const driveMin = Math.ceil(durSec / 60);
    driveToVenueMin.set(d.rsvp.id, driveMin);
    const depMs = msMinusMinutes(sessionStart, driveMin + DRIVER_BUFFER_MIN);
    driverDepartures.set(d.rsvp.id, depMs);
  });

  const driveStartToPickupMin = await computeDriverStartToPickupMinutes(
    drivers,
    step1Departure,
  );

  const riderIds = riders.map((r) => r.rsvp.id);
  const driverIds = drivers.map((d) => d.rsvp.id);
  const capacity = new Map<string, number>();
  drivers.forEach((d) => capacity.set(d.rsvp.id, d.rsvp.availableSeats ?? 0));

  const matrixSec = (ri: number, di: number): number | null => {
    return durationSecFromElement(step2[ri]?.elements[di]);
  };

  const assign =
    riderIds.length > 0 && driverIds.length > 0
      ? greedyAssign(riderIds, driverIds, capacity, matrixSec)
      : new Map<string, string>();

  await prisma.$transaction(async (tx) => {
    await tx.carpoolGroup.deleteMany({ where: { sessionId: session.id } });

    await tx.rSVP.updateMany({
      where: { sessionId: session.id },
      data: {
        carpoolGroupId: null,
        calcDepartureTime: null,
        calcDriveToVenueMin: null,
        transitToPickupMin: null,
        travelTimeMin: null,
      },
    });

    for (const d of drivers) {
      const depMs = driverDepartures.get(d.rsvp.id);
      const dm = driveToVenueMin.get(d.rsvp.id) ?? 0;
      const sm = driveStartToPickupMin.get(d.rsvp.id);
      const travelMin = driverTotalTravelMinutes(dm, sm);
      await tx.rSVP.update({
        where: { id: d.rsvp.id },
        data: {
          calcDepartureTime: depMs != null ? new Date(depMs) : null,
          calcDriveToVenueMin: dm > 0 ? dm : null,
          travelTimeMin: dm > 0 || (sm ?? 0) > 0 ? travelMin : null,
        },
      });

      const group = await tx.carpoolGroup.create({
        data: {
          sessionId: session.id,
          driverRsvpId: d.rsvp.id,
        },
      });

      const myRiders = [...assign.entries()]
        .filter(([, drId]) => drId === d.rsvp.id)
        .map(([rid]) => rid);

      for (const rid of myRiders) {
        const ri = riderIds.indexOf(rid);
        const di = driverIds.indexOf(d.rsvp.id);
        const tSec = matrixSec(ri, di);
        const transitMin = tSec != null ? Math.ceil(tSec / 60) : null;
        const depDriver = driverDepartures.get(d.rsvp.id);
        const riderDepMs =
          depDriver != null && tSec != null ? depDriver - tSec * 1000 : null;
        const driveM = driveToVenueMin.get(d.rsvp.id) ?? 0;

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

    for (const o of ownWay) {
      const durationSec = step3ByRsvpId[o.rsvp.id];
      const travelMin = durationSec != null ? Math.ceil(durationSec / 60) : null;
      const depMs =
        travelMin != null ? msMinusMinutes(sessionStart, travelMin) : null;
      await tx.rSVP.update({
        where: { id: o.rsvp.id },
        data: {
          travelTimeMin: travelMin,
          calcDepartureTime: depMs != null ? new Date(depMs) : null,
        },
      });
    }
  });

  await prisma.session.update({
    where: { id: session.id },
    data: { status: "OPTIMISED" },
  });

  return {
    step1,
    step2,
    step3ByRsvpId,
    meta: { sessionStartMs: sessionStart, venue },
  };
}

export function collectInputsFromRsvps(rsvps: RSVP[]) {
  const drivers: DriverInput[] = [];
  const riders: RiderInput[] = [];
  const ownWay: { rsvp: RSVP; start: LatLng; mode: "driving" | "transit" | "walking" }[] = [];

  for (const r of rsvps) {
    if (!r.attending) continue;
    if (r.isDriver && r.pickupLat != null && r.pickupLng != null) {
      drivers.push({
        rsvp: r,
        pickup: { lat: r.pickupLat, lng: r.pickupLng },
        start:
          r.startLat != null && r.startLng != null
            ? { lat: r.startLat, lng: r.startLng }
            : null,
      });
    } else if (r.needsCarpool && !r.isDriver && r.startLat != null && r.startLng != null) {
      riders.push({
        rsvp: r,
        start: { lat: r.startLat, lng: r.startLng },
      });
    } else if (!r.needsCarpool && !r.isDriver && r.startLat != null && r.startLng != null) {
      const m = mapTransportMode(r.transportMode);
      if (m) {
        ownWay.push({ rsvp: r, start: { lat: r.startLat, lng: r.startLng }, mode: m });
      }
    }
  }

  drivers.sort((a, b) => a.rsvp.id.localeCompare(b.rsvp.id));
  riders.sort((a, b) => a.rsvp.id.localeCompare(b.rsvp.id));

  return { drivers, riders, ownWay };
}
