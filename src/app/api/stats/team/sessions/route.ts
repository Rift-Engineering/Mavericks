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
  const sessionDateFilter = sessionDateFilterFromSearchParams(url);

  const grouped = await prisma.rSVP.groupBy({
    by: ["sessionId"],
    where: {
      attending: true,
      travelTimeMin: { not: null },
      session: { date: sessionDateFilter },
    },
    _sum: { travelTimeMin: true },
  });

  if (grouped.length === 0) {
    return NextResponse.json({ teamTotalMin: 0, bySession: [] as const });
  }

  const sessionIds = grouped.map((g) => g.sessionId);
  const sessions = await prisma.session.findMany({
    where: { id: { in: sessionIds } },
    select: { id: true, name: true, date: true },
  });
  const sessionMap = new Map(sessions.map((s) => [s.id, s]));

  const bySession = grouped
    .map((g) => {
      const s = sessionMap.get(g.sessionId);
      return {
        sessionId: g.sessionId,
        name: s?.name ?? "",
        date: s?.date.toISOString() ?? "",
        teamTravelMin: g._sum.travelTimeMin ?? 0,
      };
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const teamTotalMin = bySession.reduce((acc, row) => acc + row.teamTravelMin, 0);

  return NextResponse.json({ teamTotalMin, bySession });
}
