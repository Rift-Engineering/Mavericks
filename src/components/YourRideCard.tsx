import type { RSVP, User } from "@prisma/client";

type Props = {
  rsvp: RSVP & {
    carpoolGroup: {
      driverRsvp: RSVP & { user: Pick<User, "name"> };
    } | null;
  };
  sessionDate: Date;
};

function fmt(t: Date | null | undefined) {
  if (!t) return "—";
  return t.toLocaleString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "Asia/Tokyo",
  });
}

export function YourRideCard({ rsvp, sessionDate }: Props) {
  const g = rsvp.carpoolGroup;
  if (!g) return null;
  const driver = g.driverRsvp;

  return (
    <section className="rounded-xl border border-[#8b1a1a]/40 bg-[#8b1a1a]/10 p-4">
      <h3 className="text-sm font-medium uppercase tracking-wide text-[#a0a0a0]">Your ride</h3>
      <p className="mt-2 text-lg font-medium text-white">Driver: {driver.user.name}</p>
      {driver.pickupStation && (
        <p className="text-sm text-[#a0a0a0]">Meet at {driver.pickupStation}</p>
      )}
      <div className="mt-4 space-y-2 text-sm text-white">
        <p>
          <span className="text-[#a0a0a0]">You leave </span>
          {rsvp.startLocation ?? "your start"}{" "}
          <span className="text-[#a0a0a0]">around </span>
          {fmt(rsvp.calcDepartureTime)}
        </p>
        <p>
          <span className="text-[#a0a0a0]">Driver departs station </span>
          {fmt(driver.calcDepartureTime)}
        </p>
        <p>
          <span className="text-[#a0a0a0]">Session </span>
          {fmt(sessionDate)}
        </p>
      </div>
    </section>
  );
}
