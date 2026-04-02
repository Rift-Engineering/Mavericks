import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { StatsClient } from "@/components/StatsClient";

export default async function StatsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-white">Travel stats</h1>
        <p className="mt-1 text-sm text-[#a0a0a0]">
          Total door-to-venue travel time from saved RSVPs (after optimisation / own-way calc).
        </p>
      </div>
      <StatsClient />
    </div>
  );
}
