import type { RSVP } from "@prisma/client";

type Props = {
  rsvp: RSVP;
};

/** Summary for drivers: origin, pickup, and total travel time after optimisation. */
export function YourDriveCard({ rsvp }: Props) {
  if (!rsvp.isDriver || !rsvp.attending) return null;

  return (
    <section className="rounded-xl border border-emerald-900/40 bg-emerald-900/10 p-4">
      <h3 className="text-sm font-medium uppercase tracking-wide text-[#a0a0a0]">Your drive</h3>
      <dl className="mt-3 space-y-3 text-sm text-white">
        {rsvp.startLocation ? (
          <div>
            <dt className="text-[#a0a0a0]">Driving from</dt>
            <dd className="mt-0.5">{rsvp.startLocation}</dd>
          </div>
        ) : (
          <p className="text-amber-200/90">Add where you drive from in your RSVP so travel time can include the full route.</p>
        )}
        {rsvp.pickupStation && (
          <div>
            <dt className="text-[#a0a0a0]">Pickup (riders meet you here)</dt>
            <dd className="mt-0.5">{rsvp.pickupStation}</dd>
          </div>
        )}
        {rsvp.travelTimeMin != null ? (
          <p className="text-[#a0a0a0]">
            Estimated total travel:{" "}
            <span className="font-medium text-white">{rsvp.travelTimeMin} min</span>
            <span className="block text-xs text-[#a0a0a0]">
              Start → pickup → venue (no wait at pickup).
            </span>
          </p>
        ) : (
          <p className="text-xs text-[#a0a0a0]">
            Total travel time appears after optimisation is run for this session.
          </p>
        )}
      </dl>
    </section>
  );
}
