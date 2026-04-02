import type { CarpoolGroup, RSVP, User } from "@prisma/client";

type DriverRsvp = RSVP & { user: Pick<User, "id" | "name"> };
type RiderRsvp = RSVP & { user: Pick<User, "id" | "name"> };
type Group = CarpoolGroup & {
  driverRsvp: DriverRsvp;
  riders: RiderRsvp[];
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

export function CarpoolAssignments({
  groups,
  sessionTime,
}: {
  groups: Group[];
  sessionTime: Date;
}) {
  if (groups.length === 0) {
    return (
      <p className="text-sm text-[#a0a0a0]">No carpool groups for this session yet.</p>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-white">Carpool assignments</h3>
      {groups.map((g) => (
        <div
          key={g.id}
          className="rounded-xl border border-white/10 bg-white/[0.03] p-4"
        >
          <p className="font-medium text-white">{g.driverRsvp.user.name} — driver</p>
          <p className="text-sm text-[#a0a0a0]">
            Pickup: {g.driverRsvp.pickupStation ?? "—"}
          </p>
          <p className="text-sm text-[#a0a0a0]">
            Driver departs: {fmt(g.driverRsvp.calcDepartureTime)} ·{" "}
            {g.driverRsvp.calcDriveToVenueMin != null
              ? `${g.driverRsvp.calcDriveToVenueMin} min drive to venue`
              : ""}
          </p>
          <p className="mt-2 text-xs uppercase text-[#a0a0a0]">Riders</p>
          <ul className="mt-1 space-y-2">
            {g.riders.map((r) => (
              <li key={r.id} className="text-sm text-white">
                {r.user.name}
                <span className="block text-[#a0a0a0]">
                  Leave ~{fmt(r.calcDepartureTime)} · transit to pickup{" "}
                  {r.transitToPickupMin != null ? `${r.transitToPickupMin} min` : ""}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ))}
      <p className="text-xs text-[#a0a0a0]">
        Session starts: {fmt(sessionTime)} (Asia/Tokyo)
      </p>
    </div>
  );
}
