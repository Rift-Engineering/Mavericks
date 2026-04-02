import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { syncSessionStatus } from "@/lib/sync-session-status";
import { collectInputsFromRsvps, runOptimisation } from "@/lib/optimise";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!process.env.GOOGLE_MAPS_API_KEY) {
    return NextResponse.json(
      { error: "Server GOOGLE_MAPS_API_KEY is not configured" },
      { status: 500 },
    );
  }

  const { id } = await context.params;
  const url = new URL(request.url);
  const refresh = url.searchParams.get("refresh") === "1";

  const raw = await prisma.session.findUnique({
    where: { id },
    include: { rsvps: true },
  });
  if (!raw) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const synced = await syncSessionStatus(raw);
  const sessionForRun = { ...raw, ...synced };

  if (sessionForRun.status === "OPEN") {
    return NextResponse.json(
      { error: "RSVP deadline has not passed yet" },
      { status: 400 },
    );
  }

  if (sessionForRun.status === "PUBLISHED") {
    return NextResponse.json(
      { error: "Unpublish before re-optimising" },
      { status: 400 },
    );
  }

  const { drivers, riders, ownWay } = collectInputsFromRsvps(raw.rsvps);

  try {
    await runOptimisation(sessionForRun, drivers, riders, ownWay, {
      refreshMatrices: refresh,
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Optimisation failed" },
      { status: 500 },
    );
  }
}
