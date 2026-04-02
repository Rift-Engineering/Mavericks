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

  const canOptimise =
    session.status !== "OPEN" && session.status !== "PUBLISHED";
  const canPublish = session.status === "OPTIMISED";
  const hasSnapshot = !!(await prisma.optimisationSnapshot.findUnique({
    where: { sessionId: id },
  }));

  return (
    <div className="space-y-8">
      <div>
        <Link href={`/sessions/${id}`} className="text-sm text-[#8b1a1a] hover:underline">
          ← Back to session
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-white">Carpool assignments</h1>
        <p className="mt-1 text-sm text-[#a0a0a0]">
          {drivers.length} driver(s), {riders.length} rider(s). Session status: {session.status}
        </p>
      </div>

      <ClientActions
        sessionId={id}
        canOptimise={canOptimise}
        canPublish={canPublish}
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
        <p className="text-[#a0a0a0]">
          Assignments are published. Unpublish by editing session status in the database if you
          need to change them.
        </p>
      ) : (
        <p className="text-[#a0a0a0]">
          After the RSVP deadline, use Generate assignments to run the optimiser.
        </p>
      )}
    </div>
  );
}
