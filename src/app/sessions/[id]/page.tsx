import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { syncSessionStatus } from "@/lib/sync-session-status";
import { sessionStatusLabel } from "@/lib/session-utils";
import { CarpoolSessionMap } from "@/components/CarpoolSessionMap";
import { MapEmbed } from "@/components/MapEmbed";
import { RSVPForm } from "@/components/RSVPForm";
import { AttendeeList } from "@/components/AttendeeList";
import { CarpoolAssignments } from "@/components/CarpoolAssignments";
import { YourRideCard } from "@/components/YourRideCard";
import { YourDriveCard } from "@/components/YourDriveCard";

export default async function SessionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const sessionUser = await getSession();
  if (!sessionUser) redirect("/login");

  const raw = await prisma.session.findUnique({
    where: { id },
    include: {
      rsvps: {
        include: {
          user: { select: { id: true, name: true, email: true } },
          carpoolGroup: {
            include: {
              driverRsvp: { include: { user: { select: { name: true } } } },
            },
          },
        },
      },
      carpoolGroups: {
        include: {
          driverRsvp: { include: { user: { select: { id: true, name: true } } } },
          riders: { include: { user: { select: { id: true, name: true } } } },
        },
      },
    },
  });

  if (!raw) notFound();

  const s = await syncSessionStatus(raw);
  const session = { ...raw, ...s };
  const myRsvp = session.rsvps.find((r) => r.userId === sessionUser.sub) ?? null;

  const showAssignments = session.status === "PUBLISHED" || session.status === "OPTIMISED";
  const showPublicAssignments = session.status === "PUBLISHED";

  const carpoolMapGroups = session.carpoolGroups
    .map((g) => {
      const plat = g.driverRsvp.pickupLat;
      const plng = g.driverRsvp.pickupLng;
      if (plat == null || plng == null) return null;
      return {
        id: g.id,
        driverName: g.driverRsvp.user.name,
        pickupLabel: g.driverRsvp.pickupStation ?? "Pickup",
        driverLat: plat,
        driverLng: plng,
        riders: g.riders
          .filter((r) => r.startLat != null && r.startLng != null)
          .map((r) => ({
            name: r.user.name,
            lat: r.startLat as number,
            lng: r.startLng as number,
          })),
      };
    })
    .filter((g): g is NonNullable<typeof g> => g != null);

  const showCarpoolMap = showAssignments && carpoolMapGroups.length > 0;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-[#a0a0a0]">
            {sessionStatusLabel(session.status)}
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-white">{session.name}</h1>
          <p className="mt-2 text-[#a0a0a0]">
            {session.date.toLocaleString("en-GB", {
              weekday: "long",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
              timeZone: "Asia/Tokyo",
            })}
          </p>
          <p className="mt-1 text-white">{session.locationName}</p>
          <p className="mt-2 text-sm text-[#a0a0a0]">
            RSVP by{" "}
            {session.rsvpDeadline.toLocaleString("en-GB", {
              timeZone: "Asia/Tokyo",
            })}
          </p>
        </div>
        {sessionUser.role === "ADMIN" && (
          <div className="flex flex-col gap-2">
            <Link
              href={`/sessions/${id}/assignments`}
              className="rounded-lg border border-[#8b1a1a] px-4 py-2 text-center text-sm text-[#8b1a1a] hover:bg-[#8b1a1a]/10"
            >
              Manage / Optimise Carpooling
            </Link>
            <Link
              href={`/sessions/${id}/edit`}
              className="rounded-lg border border-white/20 px-4 py-2 text-center text-sm text-[#a0a0a0] hover:text-white"
            >
              Edit session
            </Link>
          </div>
        )}
      </div>

      {/* Personal cards promoted above map */}
      {myRsvp?.attending && myRsvp.isDriver && <YourDriveCard rsvp={myRsvp} />}

      {(showPublicAssignments || session.status === "OPTIMISED") &&
        myRsvp?.needsCarpool &&
        myRsvp.carpoolGroup &&
        myRsvp.carpoolGroupId && (
          <div>
            <YourRideCard rsvp={myRsvp} sessionDate={session.date} />
            {session.status === "OPTIMISED" && (
              <p className="mt-1 text-xs text-amber-300">Pending — assignments not yet published</p>
            )}
          </div>
        )}

      {showCarpoolMap ? (
        <CarpoolSessionMap
          venueName={session.locationName}
          venueLat={session.locationLat}
          venueLng={session.locationLng}
          groups={carpoolMapGroups}
        />
      ) : (
        <MapEmbed lat={session.locationLat} lng={session.locationLng} title={session.locationName} />
      )}

      <RSVPForm session={session} existing={myRsvp} />

      <div>
        <h2 className="text-lg font-medium text-white">Who&apos;s coming</h2>
        <div className="mt-4">
          <AttendeeList rsvps={session.rsvps} />
        </div>
      </div>

      {showAssignments && (
        <CarpoolAssignments groups={session.carpoolGroups} sessionTime={session.date} />
      )}
    </div>
  );
}
