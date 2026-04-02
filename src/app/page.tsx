import Link from "next/link";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { SessionCard } from "@/components/SessionCard";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const now = new Date();
  const nextSession = await prisma.session.findFirst({
    where: { date: { gte: now } },
    orderBy: { date: "asc" },
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

  const userRsvp = nextSession?.rsvps[0];
  const publishedRide =
    nextSession?.status === "PUBLISHED" &&
    userRsvp?.attending &&
    userRsvp.needsCarpool &&
    userRsvp.carpoolGroup
      ? userRsvp
      : null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-white">Hello, {session.name}</h1>
        <p className="mt-1 text-[#a0a0a0]">Upcoming training & your RSVP</p>
      </div>

      {nextSession ? (
        <>
          <SessionCard
            session={nextSession}
            userRsvp={userRsvp ?? null}
            publishedRide={publishedRide}
          />
          <Link
            href={`/sessions/${nextSession.id}`}
            className="tap-target flex w-full items-center justify-center rounded-xl bg-[#8b1a1a] py-4 text-center text-base font-medium text-white hover:bg-[#a32222]"
          >
            RSVP now
          </Link>
        </>
      ) : (
        <p className="rounded-xl border border-white/10 bg-white/[0.03] p-6 text-[#a0a0a0]">
          No upcoming sessions scheduled.
        </p>
      )}

      <Link
        href="/sessions"
        className="block text-center text-sm text-[#8b1a1a] hover:underline"
      >
        View all sessions
      </Link>
    </div>
  );
}
