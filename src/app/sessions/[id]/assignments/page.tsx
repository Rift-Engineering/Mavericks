import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { syncSessionStatus } from "@/lib/sync-session-status";
import { AssignmentEditor } from "@/components/AssignmentEditor";
import { ClientActions } from "@/components/AssignmentActions";

export default async function AssignmentsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const sessionUser = await getSession();
  if (!sessionUser) redirect("/login");
  if (sessionUser.role !== "ADMIN") redirect("/");

  const raw = await prisma.session.findUnique({
    where: { id },
    include: {
      rsvps: {
        include: { user: { select: { name: true } } },
      },
      carpoolGroups: {
        include: {
          driverRsvp: { include: { user: { select: { name: true } } } },
          riders: { include: { user: { select: { name: true } } } },
        },
      },
      optimisationSnap: true,
    },
  });

  if (!raw) notFound();
  const synced = await syncSessionStatus(raw);
  const session = { ...raw, ...synced };

  const drivers = session.rsvps.filter((r) => r.attending && r.isDriver);
  const riders = session.rsvps.filter((r) => r.attending && r.needsCarpool && !r.isDriver);

  const initialGroups = session.carpoolGroups.map((g) => ({
    driverRsvpId: g.driverRsvpId,
    riderRsvpIds: g.riders.map((r) => r.id),
  }));

  const canOptimise = session.status !== "OPEN" && session.status !== "PUBLISHED";
  const canPublish = session.status === "OPTIMISED";
  const canUnpublish = session.status === "PUBLISHED";
  const hasSnapshot = !!session.optimisationSnap;

  const isStale =
    hasSnapshot &&
    session.optimisationSnap &&
    session.updatedAt > session.optimisationSnap.updatedAt;

  const unassignedCount = riders.filter(
    (r) => !session.carpoolGroups.some((g) => g.riders.some((gr) => gr.id === r.id)),
  ).length;

  return (
    <div className="space-y-8">
      <div>
        <Link href={`/sessions/${id}`} className="text-sm text-accent hover:underline">
          ← Back to session
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-white">Carpool assignments</h1>
        <p className="mt-1 text-sm text-muted">
          {drivers.length} driver(s), {riders.length} rider(s). Session status:{" "}
          <span className="font-medium text-white">{session.status}</span>
        </p>
      </div>

      {/* Stale data warning */}
      {isStale && (
        <div className="rounded-xl border border-amber-700/50 bg-amber-950/30 p-4" role="alert">
          <p className="text-sm font-medium text-amber-200">
            Session was updated after the last optimisation. Re-run with &quot;Refresh matrices&quot; to update travel times.
          </p>
        </div>
      )}

      {/* Unassigned rider count warning */}
      {unassignedCount > 0 && (session.status === "OPTIMISED" || session.status === "PUBLISHED") && (
        <div className="rounded-xl border border-red-800/50 bg-red-950/30 p-4" role="alert">
          <p className="text-sm font-medium text-red-200">
            {unassignedCount} rider(s) still unassigned
          </p>
        </div>
      )}

      <ClientActions
        sessionId={id}
        canOptimise={canOptimise}
        canPublish={canPublish}
        canUnpublish={canUnpublish}
        hasSnapshot={hasSnapshot}
      />

      {session.status === "OPTIMISED" ? (
        <AssignmentEditor
          sessionId={id}
          drivers={drivers}
          riders={riders}
          initialGroups={initialGroups}
        />
      ) : session.status === "PUBLISHED" ? (
        <AssignmentEditor
          sessionId={id}
          drivers={drivers}
          riders={riders}
          initialGroups={initialGroups}
        />
      ) : (
        <p className="text-muted">
          After the RSVP deadline, use Generate assignments to run the optimiser.
        </p>
      )}
    </div>
  );
}
