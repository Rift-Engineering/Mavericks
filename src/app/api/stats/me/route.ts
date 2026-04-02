import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { sessionDateFilterFromSearchParams } from "@/lib/stats-session-date-filter";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const dateFilter = sessionDateFilterFromSearchParams(url);

  const rsvps = await prisma.rSVP.findMany({
    where: {
      userId: session.sub,
      attending: true,
      travelTimeMin: { not: null },
      session: {
        date: dateFilter,
      },
    },
    include: { session: { select: { date: true, name: true } } },
    orderBy: { session: { date: "asc" } },
  });

  const totalMin = rsvps.reduce((s, r) => s + (r.travelTimeMin ?? 0), 0);

  const bySession = rsvps.map((r) => ({
    sessionId: r.sessionId,
    name: r.session.name,
    date: r.session.date.toISOString(),
    travelTimeMin: r.travelTimeMin,
  }));

  return NextResponse.json({ totalMin, bySession });
}
