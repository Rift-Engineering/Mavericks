import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const year = url.searchParams.get("year");
  const month = url.searchParams.get("month");

  const sessionFilter: { gte: Date; lte?: Date } = { gte: new Date(0) };
  if (year && month) {
    const y = Number(year);
    const m = Number(month) - 1;
    sessionFilter.gte = new Date(y, m, 1);
    sessionFilter.lte = new Date(y, m + 1, 0, 23, 59, 59, 999);
  } else if (year) {
    const y = Number(year);
    sessionFilter.gte = new Date(y, 0, 1);
    sessionFilter.lte = new Date(y, 11, 31, 23, 59, 59, 999);
  }

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
