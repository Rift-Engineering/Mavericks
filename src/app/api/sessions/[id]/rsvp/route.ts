import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { syncSessionStatus } from "@/lib/sync-session-status";
import { parseRsvpBody, parsedRsvpToPrismaWrite } from "@/lib/parse-rsvp-body";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: sessionId } = await context.params;
  const found = await prisma.session.findUnique({ where: { id: sessionId } });
  if (!found) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const s = await syncSessionStatus(found);
  if (s.status !== "OPEN" || Date.now() >= s.rsvpDeadline.getTime()) {
    return NextResponse.json({ error: "RSVP is closed for this session" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = parseRsvpBody(body);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const write = parsedRsvpToPrismaWrite(parsed.data);

  const rsvp = await prisma.rSVP.upsert({
    where: {
      userId_sessionId: { userId: session.sub, sessionId },
    },
    create: {
      userId: session.sub,
      sessionId,
      ...write,
    },
    update: write,
  });

  return NextResponse.json({ rsvp });
}
