import Image from "next/image";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { LogoutButton } from "@/components/LogoutButton";

export async function Nav() {
  const session = await getSession();

  if (!session) {
    return (
      <header className="border-b border-white/10 bg-[#0a0a0a]/95 backdrop-blur">
        <div className="mx-auto flex max-w-lg items-center justify-between px-4 py-3 md:max-w-4xl">
          <Link href="/login" className="flex items-center gap-2">
            <div className="relative h-10 w-10 overflow-hidden rounded-full bg-[#8b1a1a]">
              <Image
                src="/logo.svg"
                alt="Tokyo Mavericks"
                width={40}
                height={40}
                className="object-cover"
                priority
              />
            </div>
            <span className="text-lg font-semibold tracking-tight text-white">
              Tokyo Mavericks
            </span>
          </Link>
        </div>
      </header>
    );
  }

  return (
    <header className="border-b border-white/10 bg-[#0a0a0a]/95 backdrop-blur">
      <div className="mx-auto flex max-w-lg flex-wrap items-center justify-between gap-2 px-4 py-3 md:max-w-4xl">
        <Link href="/" className="flex items-center gap-2">
          <div className="relative h-10 w-10 overflow-hidden rounded-full bg-[#8b1a1a]">
            <Image
              src="/logo.svg"
              alt="Tokyo Mavericks"
              width={40}
              height={40}
              className="object-cover"
            />
          </div>
          <span className="text-lg font-semibold tracking-tight text-white">
            Mavericks
          </span>
        </Link>
        <nav className="flex flex-wrap items-center gap-3 text-sm">
          <Link href="/sessions" className="text-[#a0a0a0] hover:text-white">
            Sessions
          </Link>
          <Link href="/stats" className="text-[#a0a0a0] hover:text-white">
            Stats
          </Link>
          {session.role === "ADMIN" && (
            <>
              <Link href="/sessions/new" className="text-[#a0a0a0] hover:text-white">
                New session
              </Link>
              <Link href="/admin/users" className="text-[#a0a0a0] hover:text-white">
                Users
              </Link>
            </>
          )}
          <span className="hidden text-[#a0a0a0] sm:inline">{session.name}</span>
          <LogoutButton />
        </nav>
      </div>
    </header>
  );
}
