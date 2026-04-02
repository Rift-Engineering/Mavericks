import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { EditSessionForm } from "@/components/EditSessionForm";

export default async function EditSessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const sessionUser = await getSession();
  if (!sessionUser) redirect("/login");
  if (sessionUser.role !== "ADMIN") redirect("/");

  const session = await prisma.session.findUnique({ where: { id } });
  if (!session) notFound();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-white">Edit session</h1>
      <EditSessionForm session={session} />
    </div>
  );
}
