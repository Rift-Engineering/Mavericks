/**
 * Server-side Distance Matrix helpers. Uses GOOGLE_MAPS_API_KEY (secret).
 */

export type LatLng = { lat: number; lng: number };

export type MatrixRow = {
  originIndex: number;
  elements: {
    destinationIndex: number;
    durationSec: number | null;
    status: string;
  }[];
};

function buildUrl(
  origins: LatLng[],
  destinations: LatLng[],
  mode: "driving" | "transit" | "walking",
  departureTime: Date | undefined,
) {
  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (!key) throw new Error("GOOGLE_MAPS_API_KEY is not set");

  const o = origins.map((p) => `${p.lat},${p.lng}`).join("|");
  const d = destinations.map((p) => `${p.lat},${p.lng}`).join("|");
  const params = new URLSearchParams({
    origins: o,
    destinations: d,
    mode,
    key,
    region: "jp",
    language: "en",
  });
  if (departureTime && (mode === "driving" || mode === "transit")) {
    params.set("departure_time", String(Math.floor(departureTime.getTime() / 1000)));
  }
  return `https://maps.googleapis.com/maps/api/distancematrix/json?${params.toString()}`;
}

export async function distanceMatrix(
  origins: LatLng[],
  destinations: LatLng[],
  mode: "driving" | "transit" | "walking",
  departureTime?: Date,
): Promise<MatrixRow[]> {
  if (origins.length === 0 || destinations.length === 0) return [];

  const url = buildUrl(origins, destinations, mode, departureTime);
  let res: Response;
  try {
    res = await fetch(url);
  } catch (err) {
    console.error("Distance Matrix fetch failed", err);
    throw new Error("Distance Matrix request failed");
  }
  if (!res.ok) throw new Error(`Distance Matrix HTTP ${res.status}`);
  const data = (await res.json()) as {
    status: string;
    rows?: {
      elements: { status: string; duration?: { value: number } }[];
    }[];
  };

  if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
    throw new Error(`Distance Matrix: ${data.status}`);
  }

  const rows: MatrixRow[] = [];
  data.rows?.forEach((row, oi) => {
    const elements =
      row.elements?.map((el, di) => ({
        destinationIndex: di,
        durationSec: el.duration?.value ?? null,
        status: el.status,
      })) ?? [];
    rows.push({ originIndex: oi, elements });
  });
  return rows;
}
