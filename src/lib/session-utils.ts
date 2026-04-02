import type { Session, SessionStatus } from "@prisma/client";

export function isRsvpOpen(session: {
  status: SessionStatus;
  rsvpDeadline: Date;
}): boolean {
  if (session.status !== "OPEN") return false;
  return Date.now() < session.rsvpDeadline.getTime();
}

export function sessionStatusLabel(status: SessionStatus): string {
  switch (status) {
    case "OPEN":
      return "Open";
    case "CLOSED":
      return "Closed";
    case "OPTIMISED":
      return "Optimised";
    case "PUBLISHED":
      return "Published";
    default:
      return status;
  }
}

export function maybeCloseSession(session: Session): SessionStatus {
  if (session.status !== "OPEN") return session.status;
  if (Date.now() >= session.rsvpDeadline.getTime()) return "CLOSED";
  return "OPEN";
}
