import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { AdminAttendancePanel } from "@/components/AdminAttendancePanel";

export default async function AttendancePage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const isAdmin = session.role === "ADMIN";

  const [sessions, users] = await Promise.all([
    prisma.session.findMany({
      orderBy: { date: "desc" },
      select: { id: true, name: true, date: true },
    }),
    prisma.user.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, email: true },
    }),
  ]);

  const sessionOptions = sessions.map((s) => ({
    id: s.id,
    name: s.name,
    date: s.date.toISOString(),
  }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-white">Attendance &amp; rides</h1>
        <p className="mt-1 text-sm text-[#a0a0a0]">
          Pick a session to see the full roster—who&apos;s in and how they&apos;re travelling.{" "}
          {isAdmin ? (
            <>You can update any player&apos;s attendance or ride details when something changes.</>
          ) : (
            <>Contact an admin if something needs updating.</>
          )}
        </p>
      </div>
      <AdminAttendancePanel sessions={sessionOptions} users={users} canEdit={isAdmin} />
    </div>
  );
}
