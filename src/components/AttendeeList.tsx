import type { RSVP, User } from "@prisma/client";

type R = RSVP & { user: Pick<User, "id" | "name" | "email"> };

export function AttendeeList({ rsvps }: { rsvps: R[] }) {
  const drivers = rsvps.filter((r) => r.attending && r.isDriver);
  const riders = rsvps.filter((r) => r.attending && r.needsCarpool && !r.isDriver);
  const own = rsvps.filter(
    (r) =>
      r.attending &&
      !r.isDriver &&
      !r.needsCarpool &&
      (r.transportMode || r.startLocation),
  );
  const notAttending = rsvps.filter((r) => !r.attending);

  return (
    <div className="space-y-6">
      <Section title="Driving" items={drivers} render={(r) => `${r.user.name} · ${r.pickupStation ?? "?"} · ${r.availableSeats ?? 0} seats`} />
      <Section title="Need a ride" items={riders} render={(r) => `${r.user.name} · from ${r.startLocation ?? "?"}`} />
      <Section
        title="Own way"
        items={own}
        render={(r) =>
          `${r.user.name} · ${r.transportMode?.replace("_", " ").toLowerCase() ?? "?"} · ${r.startLocation ?? "?"}`
        }
      />
      <Section title="Not attending" items={notAttending} render={(r) => r.user.name} />
    </div>
  );
}

function Section<T extends R>({
  title,
  items,
  render,
}: {
  title: string;
  items: T[];
  render: (r: T) => string;
}) {
  if (items.length === 0) return null;
  return (
    <div>
      <h4 className="text-sm font-medium text-[#a0a0a0]">{title}</h4>
      <ul className="mt-2 space-y-1 text-white">
        {items.map((r) => (
          <li key={r.id} className="rounded-lg bg-white/[0.04] px-3 py-2 text-sm">
            {render(r)}
          </li>
        ))}
      </ul>
    </div>
  );
}
