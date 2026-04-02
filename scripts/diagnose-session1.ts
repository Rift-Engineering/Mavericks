/**
 * One-off: why does greedy assign get zero pairs for seed-session-1?
 * Run: node --env-file=.env ./node_modules/tsx/dist/cli.mjs scripts/diagnose-session1.ts
 */
import { PrismaClient } from "@prisma/client";
import { collectInputsFromRsvps, mergeRiderPickupMatrices } from "../src/lib/optimise";
import { distanceMatrix } from "../src/lib/maps";

const SESSION_ID = "seed-session-1";

function msMinusMinutes(ms: number, min: number) {
  return ms - min * 60 * 1000;
}

async function main() {
  const prisma = new PrismaClient();
  const raw = await prisma.session.findUnique({
    where: { id: SESSION_ID },
    include: { rsvps: true },
  });
  if (!raw) {
    console.error("Session not found. Run: npx prisma db seed");
    process.exit(1);
  }

  const { drivers, riders } = collectInputsFromRsvps(raw.rsvps);
  console.log("Drivers:", drivers.length, "Riders:", riders.length);
  if (!process.env.GOOGLE_MAPS_API_KEY) {
    console.error("GOOGLE_MAPS_API_KEY missing");
    process.exit(1);
  }

  const sessionStart = raw.date.getTime();
  const step2Departure = new Date(msMinusMinutes(sessionStart, 210));

  const riderPoints = riders.map((r) => r.start);
  const pickupPoints = drivers.map((d) => d.pickup);

  console.log("Transit matrix departure (UTC):", step2Departure.toISOString());

  const [step2Transit, step2Driving] = await Promise.all([
    distanceMatrix(riderPoints, pickupPoints, "transit", step2Departure),
    distanceMatrix(riderPoints, pickupPoints, "driving", step2Departure),
  ]);
  const step2Merged = mergeRiderPickupMatrices(step2Transit, step2Driving);

  function summarize(label: string, rows: typeof step2Merged) {
    let ok = 0;
    let nullDur = 0;
    const statuses = new Map<string, number>();
    for (const row of rows) {
      for (const el of row.elements ?? []) {
        const st = el?.status ?? "?";
        statuses.set(st, (statuses.get(st) ?? 0) + 1);
        if (el?.durationSec != null && Number.isFinite(el.durationSec)) ok++;
        else nullDur++;
      }
    }
    console.log(`\n--- ${label} ---`);
    console.log("Element status counts:", Object.fromEntries(statuses));
    console.log("Cells with numeric duration:", ok, "without:", nullDur);
  }

  console.log("\nSample row transit (rider 0):");
  step2Transit[0]?.elements.forEach((el, di) => {
    console.log(`  driver[${di}]: ${el.status} durationSec=${el.durationSec}`);
  });
  console.log("\nSample row merged (transit preferred, else driving):");
  step2Merged[0]?.elements.forEach((el, di) => {
    console.log(`  driver[${di}]: ${el.status} durationSec=${el.durationSec}`);
  });

  summarize("Transit only", step2Transit);
  summarize("Merged (production behaviour)", step2Merged);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
