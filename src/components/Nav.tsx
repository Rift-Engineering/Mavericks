import Image from "next/image";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { NavInner } from "@/components/NavInner";

export async function Nav() {
  const session = await getSession();

  if (!session) {
    return (
      <header className="sticky top-0 z-40 border-b border-white/10 bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-lg items-center justify-between px-4 py-3 md:max-w-4xl">
          <Link href="/login" className="flex items-center gap-2">
            <div className="relative h-10 w-10 overflow-hidden rounded-full bg-black">
              <Image src="/mavericks_logo.png" alt="Tokyo Mavericks" width={40} height={40} className="object-contain" priority />
            </div>
            <span className="text-lg font-semibold tracking-tight text-white">Tokyo Mavericks</span>
          </Link>
        </div>
      </header>
    );
  }

  return <NavInner name={session.name} role={session.role} />;
}
