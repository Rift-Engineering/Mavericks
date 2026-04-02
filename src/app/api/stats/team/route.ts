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
  const sessionFilter = sessionDateFilterFromSearchParams(url);

  const rsvps = await prisma.rSVP.findMany({
    where: {
      attending: true,
      travelTimeMin: { not: null },
      session: { date: sessionFilter },
    },
    include: { user: { select: { id: true, name: true } } },
  });

  const totals = new Map<string, { name: string; totalMin: number }>();
  for (const r of rsvps) {
    const id = r.userId;
    const cur = totals.get(id) ?? { name: r.user.name, totalMin: 0 };
    cur.totalMin += r.travelTimeMin ?? 0;
    totals.set(id, cur);
  }

  const leaderboard = [...totals.values()].sort((a, b) => b.totalMin - a.totalMin);

  return NextResponse.json({ leaderboard });
}
