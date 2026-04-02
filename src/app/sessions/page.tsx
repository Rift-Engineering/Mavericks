import Link from "next/link";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { syncSessionStatus } from "@/lib/sync-session-status";

const STATUS_BADGE: Record<string, string> = {
  OPEN: "bg-emerald-900/50 text-emerald-200",
  CLOSED: "bg-amber-900/50 text-amber-200",
  OPTIMISED: "bg-blue-900/50 text-blue-200",
  PUBLISHED: "bg-accent/40 text-white",
};

export default async function SessionsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  const { tab } = await searchParams;

  const showPast = tab === "past";
  const now = new Date();

  const allUsers = await prisma.user.count();

  const sessions = await prisma.session.findMany({
    where: showPast ? { date: { lt: now } } : { date: { gte: now } },
    orderBy: { date: showPast ? "desc" : "asc" },
    include: {
      rsvps: true,
    },
  });

  const synced = [];
  for (const s of sessions) {
    const st = await syncSessionStatus(s);
    synced.push({ ...st, rsvps: s.rsvps, _allUsers: allUsers });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-white">Sessions</h1>
      </div>

      {/* Tab toggle */}
      <div className="flex gap-1 rounded-lg border border-white/10 bg-white/[0.03] p-1">
        <Link
          href="/sessions"
          className={`flex-1 rounded-md px-4 py-2 text-center text-sm font-medium transition ${!showPast ? "bg-accent text-white" : "text-muted hover:text-white"}`}
        >
          Upcoming
        </Link>
        <Link
          href="/sessions?tab=past"
          className={`flex-1 rounded-md px-4 py-2 text-center text-sm font-medium transition ${showPast ? "bg-accent text-white" : "text-muted hover:text-white"}`}
        >
          Past
        </Link>
      </div>

      <ul className="space-y-3">
        {synced.map((s) => {
          const myRsvp = s.rsvps.find((r) => r.userId === session.sub);
          const status = !myRsvp
            ? "Not responded"
            : !myRsvp.attending
              ? "Not attending"
              : myRsvp.isDriver
                ? "Driving"
                : myRsvp.needsCarpool
                  ? "Needs ride"
                  : "Own way";

          const attendingCount = s.rsvps.filter((r) => r.attending).length;

          return (
            <li key={s.id}>
              <Link
                href={`/sessions/${s.id}`}
                className="block rounded-xl border border-white/10 bg-white/[0.03] px-4 py-4 transition hover:border-accent/50"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium text-white">{s.name}</p>
                  <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_BADGE[s.status] ?? "bg-white/10 text-muted"}`}>
                    {s.status}
                  </span>
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
                <p className="text-sm text-muted">
                  RSVP by{" "}
                  {s.rsvpDeadline.toLocaleString("en-GB", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                    timeZone: "Asia/Tokyo",
                  })}
                </p>

                {/* RSVP progress */}
                <div className="mt-2 flex items-center gap-2">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-accent"
                      style={{ width: `${allUsers > 0 ? (attendingCount / allUsers) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted">{attendingCount}/{allUsers}</span>
                </div>

                <p className="mt-2 text-xs text-accent">{status}</p>
              </Link>
            </li>
          );
        })}
      </ul>
      {synced.length === 0 && (
        <p className="text-muted">{showPast ? "No past sessions." : "No upcoming sessions."}</p>
      )}
    </div>
  );
}
