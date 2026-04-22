import { getSession } from "@/lib/auth";
import { NavInner } from "@/components/NavInner";

export async function Nav() {
  const session = await getSession();

  if (!session) {
    return null;
  }

  return <NavInner name={session.name} role={session.role} />;
}
