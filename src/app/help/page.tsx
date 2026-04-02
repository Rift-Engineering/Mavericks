import type { Metadata } from "next";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Help",
  description: "Guide to Tokyo Mavericks sessions, RSVP, carpool, stats, and admin tools",
};

const sections: { id: string; title: string }[] = [
  { id: "overview", title: "Overview" },
  { id: "home", title: "Home" },
  { id: "sessions", title: "Sessions" },
  { id: "session-detail", title: "Session detail & RSVP" },
  { id: "stats", title: "Travel stats" },
  { id: "attendance", title: "Attendance & rides" },
  { id: "admin", title: "Administrator tools" },
  { id: "lifecycle", title: "Session status lifecycle" },
];

export default async function HelpPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div className="space-y-10 pb-8">
      <div>
        <h1 className="font-help-serif text-3xl font-medium tracking-tight text-white md:text-4xl">
          Help &amp; guide
        </h1>
        <p className="mt-2 max-w-2xl text-[#a0a0a0]">
          How Tokyo Mavericks fits together: pages, RSVP and carpool behaviour, stats, and what admins can do.
        </p>
      </div>

      <nav
        aria-label="On this page"
        className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm"
      >
        <p className="font-medium text-white">On this page</p>
        <ul className="mt-2 flex flex-col gap-1.5 text-[#8b1a1a]">
          {sections.map((s) => (
            <li key={s.id}>
              <a href={`#${s.id}`} className="hover:underline">
                {s.title}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <section id="overview" className="scroll-mt-24 space-y-3">
        <h2 className="font-help-serif text-xl font-medium text-white">Overview</h2>
        <p className="text-[#a0a0a0]">
          Tokyo Mavericks is a team app for training sessions: you RSVP with your travel plans, admins group people
          into carpools and publish assignments, and everyone can see attendance and travel-time stats. Times are shown
          in Japan (Asia/Tokyo).
        </p>
      </section>

      <section id="home" className="scroll-mt-24 space-y-3">
        <h2 className="font-help-serif text-xl font-medium text-white">Home</h2>
        <p className="text-[#a0a0a0]">
          The home page (<Link href="/" className="text-[#8b1a1a] hover:underline">/</Link>) greets you and highlights the{" "}
          <strong className="text-white">next upcoming session</strong>. You get a summary card with date, venue, and
          your RSVP state. If your ride has been published after optimisation, you may see your assigned carpool here.
          Use <strong className="text-white">RSVP now</strong> to open the full session page, or{" "}
          <strong className="text-white">View all sessions</strong> for the full list.
        </p>
      </section>

      <section id="sessions" className="scroll-mt-24 space-y-3">
        <h2 className="font-help-serif text-xl font-medium text-white">Sessions</h2>
        <p className="text-[#a0a0a0]">
          <Link href="/sessions" className="text-[#8b1a1a] hover:underline">
            /sessions
          </Link>{" "}
          lists every <strong className="text-white">upcoming</strong> training session. Each row shows the session name,
          date and time, RSVP deadline, and a short status for <em>your</em> response: not responded, not attending,
          driving, needs ride, or making your own way. Tap a session to open its detail page.
        </p>
      </section>

      <section id="session-detail" className="scroll-mt-24 space-y-4">
        <h2 className="font-help-serif text-xl font-medium text-white">Session detail &amp; RSVP</h2>
        <p className="text-[#a0a0a0]">
          Each session page (<code className="rounded bg-white/10 px-1.5 py-0.5 text-sm text-white">/sessions/[id]</code>)
          shows the official status (Open, Closed, Optimised, Published), venue name, map, and who is coming.
        </p>
        <ul className="list-inside list-disc space-y-2 text-[#a0a0a0]">
          <li>
            <strong className="text-white">RSVP form</strong> — While the session is <strong className="text-white">Open</strong> and
            before the RSVP deadline, you can say if you&apos;re attending and how you travel:{" "}
            <strong className="text-white">need a ride</strong> (rider: set your start location from search suggestions),{" "}
            <strong className="text-white">driving</strong> (pickup station, seats, and where you&apos;re driving from), or{" "}
            <strong className="text-white">own way</strong> (transport mode and start for routing). Locations must be chosen
            from suggestions so coordinates are valid.
          </li>
          <li>
            <strong className="text-white">Maps</strong> — You always see the venue. After assignments exist, a richer map
            may show drivers, pickups, and riders when data is available.
          </li>
          <li>
            <strong className="text-white">Your drive / your ride</strong> — If you&apos;re a driver, you get a summary of your
            drive. If you need a ride and the session is Published, you see your assigned group and timing.
          </li>
          <li>
            <strong className="text-white">Who&apos;s coming</strong> — List of attendees and their RSVP summary.
          </li>
          <li>
            <strong className="text-white">Carpool assignments</strong> — When the session is Optimised or Published,
            published groups and routes appear here for everyone; detailed editing is admin-only (see below).
          </li>
        </ul>
      </section>

      <section id="stats" className="scroll-mt-24 space-y-3">
        <h2 className="font-help-serif text-xl font-medium text-white">Travel stats</h2>
        <p className="text-[#a0a0a0]">
          <Link href="/stats" className="text-[#8b1a1a] hover:underline">
            /stats
          </Link>{" "}
          shows <strong className="text-white">door-to-venue travel minutes</strong> from RSVPs after optimisation has
          run. Charts include your totals and team totals summed across all sessions (all-time). For drivers, travel
          includes start → pickup → venue (no waiting at pickup). Use this to understand team travel burden over time.
        </p>
      </section>

      <section id="attendance" className="scroll-mt-24 space-y-3">
        <h2 className="font-help-serif text-xl font-medium text-white">Attendance &amp; rides</h2>
        <p className="text-[#a0a0a0]">
          <Link href="/attendance" className="text-[#8b1a1a] hover:underline">
            /attendance
          </Link>{" "}
          lets you pick <strong className="text-white">any session</strong> (past or future) and see the full roster:
          who&apos;s in and how they&apos;re travelling.{" "}
          <strong className="text-white">Admins</strong> can adjust any player&apos;s attendance or ride details when
          something changes; <strong className="text-white">members</strong> should contact an admin for corrections.
        </p>
      </section>

      <section id="admin" className="scroll-mt-24 space-y-4">
        <h2 className="font-help-serif text-xl font-medium text-white">Administrator tools</h2>
        <p className="text-[#a0a0a0]">
          If your account role is <strong className="text-white">ADMIN</strong>, the header shows extra links. Other
          users won&apos;t see these.
        </p>
        <ul className="list-inside list-disc space-y-3 text-[#a0a0a0]">
          <li>
            <strong className="text-white">
              <Link href="/sessions/new" className="text-[#8b1a1a] hover:underline">
                New session
              </Link>
            </strong>{" "}
            — Create a training session: name, date/time, venue, RSVP deadline, and location coordinates for maps and
            routing.
          </li>
          <li>
            <strong className="text-white">
              <Link href="/admin/users" className="text-[#8b1a1a] hover:underline">
                Users
              </Link>
            </strong>{" "}
            — Create accounts, assign roles, and manage who can log in.
          </li>
          <li>
            <strong className="text-white">Manage / Optimise Carpooling</strong> — On a session page, opens{" "}
            <code className="rounded bg-white/10 px-1.5 py-0.5 text-sm text-white">/sessions/[id]/assignments</code>.
            After RSVPs close, you run optimisation, optionally tweak driver–rider groups, then publish so riders see
            their rides. Buttons on that page reflect what&apos;s allowed for the current session status.
          </li>
          <li>
            <strong className="text-white">Edit session</strong> — From the session page, edit session metadata (e.g.
            time, venue, deadline) via{" "}
            <code className="rounded bg-white/10 px-1.5 py-0.5 text-sm text-white">/sessions/[id]/edit</code>.
          </li>
        </ul>
      </section>

      <section id="lifecycle" className="scroll-mt-24 space-y-3">
        <h2 className="font-help-serif text-xl font-medium text-white">Session status lifecycle</h2>
        <p className="text-[#a0a0a0]">
          Sessions move through statuses so RSVPs and carpooling stay orderly:
        </p>
        <ul className="list-inside list-disc space-y-2 text-[#a0a0a0]">
          <li>
            <strong className="text-white">Open</strong> — Members can RSVP until the RSVP deadline.
          </li>
          <li>
            <strong className="text-white">Closed</strong> — RSVP window has ended; assignments can be prepared.
          </li>
          <li>
            <strong className="text-white">Optimised</strong> — An optimisation run has produced (or updated) carpool
            groupings; admins can review and edit assignments before publishing.
          </li>
          <li>
            <strong className="text-white">Published</strong> — Final assignments are visible to riders and drivers;
            public ride details and stats use this snapshot.
          </li>
        </ul>
      </section>

      <p className="text-sm text-[#666]">
        Signed in as {session.name}. For account issues, contact an administrator.
      </p>
    </div>
  );
}
