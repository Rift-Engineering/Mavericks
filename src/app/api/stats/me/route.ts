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

  let dateFilter: { gte: Date; lte: Date };
  const y = year ? Number(year) : new Date().getFullYear();
  if (month) {
    const m = Number(month) - 1;
    dateFilter = {
      gte: new Date(y, m, 1),
      lte: new Date(y, m + 1, 0, 23, 59, 59, 999),
    };
  } else {
    dateFilter = {
      gte: new Date(y, 0, 1),
      lte: new Date(y, 11, 31, 23, 59, 59, 999),
    };
  }

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
