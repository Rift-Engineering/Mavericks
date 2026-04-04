import Link from "next/link";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { SessionCard } from "@/components/SessionCard";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const now = new Date();
  const upcoming = await prisma.session.findMany({
    where: { date: { gte: now } },
    orderBy: { date: "asc" },
    take: 3,
    include: {
      rsvps: {
        where: { userId: session.sub },
        take: 1,
        include: {
          carpoolGroup: {
            include: {
              driverRsvp: { include: { user: true } },
            },
          },
        },
      },
    },
  });

  const nextSession = upcoming[0] ?? null;
  const userRsvp = nextSession?.rsvps[0];
  const publishedRide =
    nextSession?.status === "PUBLISHED" &&
    userRsvp?.attending &&
    userRsvp.needsCarpool &&
    userRsvp.carpoolGroup
      ? userRsvp
      : null;

  // Find open sessions where user hasn't RSVP'd and deadline is within 48h
  const urgentSessions = upcoming.filter((s) => {
    const r = s.rsvps[0];
    const hoursLeft = (s.rsvpDeadline.getTime() - now.getTime()) / 3600000;
    return s.status === "OPEN" && hoursLeft > 0 && hoursLeft <= 48 && !r;
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-white">Hello, {session.name}</h1>
        <p className="mt-1 text-muted">Upcoming training & your RSVP</p>
      </div>

      {/* Urgency banner */}
      {urgentSessions.length > 0 && (
        <div className="rounded-xl border border-accent/50 bg-accent/10 p-4">
          <p className="text-sm font-medium text-white">RSVP closing soon</p>
          {urgentSessions.map((s) => {
            const hoursLeft = Math.floor((s.rsvpDeadline.getTime() - now.getTime()) / 3600000);
            return (
              <Link
                key={s.id}
                href={`/sessions/${s.id}`}
                className="mt-2 flex items-center justify-between rounded-lg bg-accent/10 px-3 py-2 text-sm hover:bg-accent/20"
              >
                <span className="text-white">{s.name}</span>
                <span className="text-accent">{hoursLeft}h left</span>
              </Link>
            );
          })}
        </div>
      )}

      {nextSession ? (
        <>
          <SessionCard
            session={nextSession}
            userRsvp={userRsvp ?? null}
            publishedRide={publishedRide}
          />
          <Link
            href={`/sessions/${nextSession.id}`}
            className="tap-target flex w-full items-center justify-center rounded-xl bg-accent py-4 text-center text-base font-medium text-white hover:bg-accent-hover"
          >
            RSVP now
          </Link>
        </>
      ) : (
        <p className="rounded-xl border border-white/10 bg-white/[0.03] p-6 text-muted">
          No upcoming sessions scheduled.
        </p>
      )}

      {/* Additional upcoming sessions */}
      {upcoming.length > 1 && (
        <div className="space-y-3">
          <h2 className="text-lg font-medium text-white">Also coming up</h2>
          {upcoming.slice(1).map((s) => {
            const r = s.rsvps[0];
            const badge = !r
              ? "Not responded"
              : !r.attending
                ? "Not attending"
                : r.isDriver
                  ? "Driving"
                  : r.needsCarpool
                    ? "Needs ride"
                    : "Own way";
            return (
              <Link
                key={s.id}
                href={`/sessions/${s.id}`}
                className="block rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 transition hover:border-accent/50"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium text-white">{s.name}</p>
                  <span className="text-xs text-accent">{badge}</span>
                </div>
                <p className="mt-1 text-sm text-muted">
                  {s.date.toLocaleString("en-GB", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                    timeZone: "Asia/Tokyo",
                  })}
                </p>
              </Link>
            );
          })}
        </div>
      )}

      <Link
        href="/sessions"
        className="block text-center text-sm text-accent hover:underline"
      >
        View all sessions
      </Link>
    </div>
  );
}
