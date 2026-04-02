import Link from "next/link";
import type { RSVP, Session, User } from "@prisma/client";

type SessionWithOptional = Session & {
  rsvps?: RSVP[];
};

type PublishedRide = RSVP & {
  carpoolGroup: {
    driverRsvp: RSVP & { user: User };
  } | null;
};

function formatDate(d: Date) {
  return d.toLocaleString("en-GB", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Tokyo",
  });
}

function deadlineCountdown(deadline: Date) {
  const ms = deadline.getTime() - Date.now();
  if (ms <= 0) return "Closed";
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  if (h >= 48) return `${Math.floor(h / 24)}d left`;
  if (h >= 1) return `${h}h ${m}m left`;
  return `${m}m left`;
}

export function SessionCard({
  session,
  userRsvp,
  publishedRide,
}: {
  session: SessionWithOptional;
  userRsvp: RSVP | null;
  publishedRide: PublishedRide | null;
}) {
  const badge = !userRsvp
    ? { label: "Not responded", className: "bg-white/10 text-[#a0a0a0]" }
    : !userRsvp.attending
      ? { label: "Not attending", className: "bg-white/10 text-[#a0a0a0]" }
      : userRsvp.isDriver
        ? { label: "Driving", className: "bg-[#8b1a1a]/40 text-white" }
        : userRsvp.needsCarpool
          ? { label: "Needs ride", className: "bg-amber-900/40 text-amber-100" }
          : { label: "Own way", className: "bg-emerald-900/40 text-emerald-100" };

  return (
    <section className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.03]">
      <div className="border-b border-white/10 px-4 py-3">
        <p className="text-xs uppercase tracking-wide text-[#a0a0a0]">Next session</p>
        <h2 className="mt-1 text-xl font-semibold text-white">{session.name}</h2>
      </div>
      <div className="space-y-3 px-4 py-4 text-sm">
        <p className="text-[#a0a0a0]">{formatDate(session.date)}</p>
        <p className="text-white">{session.locationName}</p>
        <p className="text-xs text-[#a0a0a0]">
          RSVP deadline: {formatDate(session.rsvpDeadline)} · {deadlineCountdown(session.rsvpDeadline)}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <span className={`rounded-full px-3 py-1 text-xs font-medium ${badge.className}`}>
            {badge.label}
          </span>
        </div>
      </div>

      {publishedRide?.carpoolGroup && (
        <div className="border-t border-white/10 bg-[#8b1a1a]/10 px-4 py-4">
          <p className="text-xs font-medium uppercase text-[#a0a0a0]">Your ride</p>
          <p className="mt-2 text-white">
            Driver: {publishedRide.carpoolGroup.driverRsvp.user.name}
          </p>
          {publishedRide.carpoolGroup.driverRsvp.pickupStation && (
            <p className="text-sm text-[#a0a0a0]">
              Pickup: {publishedRide.carpoolGroup.driverRsvp.pickupStation}
            </p>
          )}
          {publishedRide.calcDepartureTime && (
            <p className="mt-2 text-sm text-white">
              Leave around{" "}
              {publishedRide.calcDepartureTime.toLocaleTimeString("en-GB", {
                hour: "2-digit",
                minute: "2-digit",
                timeZone: "Asia/Tokyo",
              })}
            </p>
          )}
          {publishedRide.carpoolGroup.driverRsvp.calcDepartureTime && (
            <p className="text-sm text-[#a0a0a0]">
              Driver departs:{" "}
              {publishedRide.carpoolGroup.driverRsvp.calcDepartureTime.toLocaleTimeString("en-GB", {
                hour: "2-digit",
                minute: "2-digit",
                timeZone: "Asia/Tokyo",
              })}
            </p>
          )}
          <Link
            href={`/sessions/${session.id}`}
            className="mt-3 inline-block text-sm text-[#8b1a1a] hover:underline"
          >
            Full details
          </Link>
        </div>
      )}
    </section>
  );
}
