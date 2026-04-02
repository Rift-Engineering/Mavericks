import Link from "next/link";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { syncSessionStatus } from "@/lib/sync-session-status";

export default async function SessionsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const now = new Date();
  const sessions = await prisma.session.findMany({
    where: { date: { gte: now } },
    orderBy: { date: "asc" },
    include: {
      rsvps: { where: { userId: session.sub }, take: 1 },
    },
  });

  const synced = [];
  for (const s of sessions) {
    synced.push({ ...(await syncSessionStatus(s)), rsvps: s.rsvps });
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-white">Upcoming sessions</h1>
      <ul className="space-y-3">
        {synced.map((s) => {
          const r = s.rsvps[0];
          const status = !r
            ? "Not responded"
            : !r.attending
              ? "Not attending"
              : r.isDriver
                ? "Driving"
                : r.needsCarpool
                  ? "Needs ride"
                  : "Own way";
          return (
            <li key={s.id}>
              <Link
                href={`/sessions/${s.id}`}
                className="block rounded-xl border border-white/10 bg-white/[0.03] px-4 py-4 transition hover:border-[#8b1a1a]/50"
              >
                <p className="font-medium text-white">{s.name}</p>
                <p className="text-sm text-[#a0a0a0]">
                  {s.date.toLocaleString("en-GB", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                    timeZone: "Asia/Tokyo",
                  })}
                </p>
                <p className="mt-1 text-sm text-[#a0a0a0]">
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
                <p className="mt-2 text-xs text-[#8b1a1a]">{status}</p>
              </Link>
            </li>
          );
        })}
      </ul>
      {synced.length === 0 && (
        <p className="text-[#a0a0a0]">No upcoming sessions.</p>
      )}
    </div>
  );
}
