import { prisma } from "@/lib/db";
import type { Session } from "@prisma/client";

/** Transition OPEN → CLOSED when RSVP deadline has passed (on read). */
export async function syncSessionStatus<T extends Session>(session: T): Promise<Session> {
  if (session.status !== "OPEN") return session;
  if (Date.now() < session.rsvpDeadline.getTime()) return session;
  return prisma.session.update({
    where: { id: session.id },
    data: { status: "CLOSED" },
  });
}
