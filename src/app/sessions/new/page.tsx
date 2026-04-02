import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { NewSessionForm } from "@/components/NewSessionForm";

export default async function NewSessionPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "ADMIN") redirect("/");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-white">New session</h1>
      <NewSessionForm />
    </div>
  );
}
