"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { LogoutButton } from "@/components/LogoutButton";

function navLink(href: string, label: string, pathname: string, extra?: string) {
  const active =
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/");
  return (
    <Link
      href={href}
      className={`${active ? "text-white underline underline-offset-4 decoration-accent" : "text-muted hover:text-white"} ${extra ?? ""}`}
    >
      {label}
    </Link>
  );
}

export function NavInner({ name, role }: { name: string; role: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const links = (
    <>
      <Link
        href="/help"
        className={`font-help-serif text-[0.95rem] tracking-wide ${pathname === "/help" ? "text-[#e8d4b0] underline underline-offset-4" : "text-[#c4a574] hover:text-[#e8d4b0]"}`}
      >
        Help
      </Link>
      {navLink("/sessions", "Sessions", pathname)}
      {navLink("/stats", "Stats", pathname)}
      {navLink("/attendance", "Attendance", pathname)}
      {role === "ADMIN" && (
        <>
          {navLink("/sessions/new", "New session", pathname)}
          {navLink("/admin/users", "Users", pathname)}
        </>
      )}
    </>
  );

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-background/95 backdrop-blur">
      <div className="mx-auto flex max-w-lg items-center justify-between gap-2 px-4 py-3 md:max-w-4xl">
        <Link href="/" className="flex items-center gap-2">
          <div className="relative h-10 w-10 overflow-hidden rounded-full bg-black">
            <Image src="/mavericks_logo.png" alt="Tokyo Mavericks" width={40} height={40} className="object-contain" />
          </div>
          <span className="text-lg font-semibold tracking-tight text-white">Tokyo Mavericks</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-3 text-sm sm:flex">
          {links}
          <span className="text-muted">{name}</span>
          <LogoutButton />
        </nav>

        {/* Mobile hamburger */}
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="tap-target flex items-center justify-center rounded-lg border border-white/20 p-2 text-muted hover:text-white sm:hidden"
          aria-label="Toggle menu"
          aria-expanded={open}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            {open ? (
              <>
                <line x1="4" y1="4" x2="16" y2="16" />
                <line x1="16" y1="4" x2="4" y2="16" />
              </>
            ) : (
              <>
                <line x1="3" y1="5" x2="17" y2="5" />
                <line x1="3" y1="10" x2="17" y2="10" />
                <line x1="3" y1="15" x2="17" y2="15" />
              </>
            )}
          </svg>
        </button>
      </div>

      {/* Mobile dropdown */}
      {open && (
        <nav className="flex flex-col gap-3 border-t border-white/10 px-4 pb-4 pt-3 text-sm sm:hidden">
          {links}
          <span className="text-muted">{name}</span>
          <LogoutButton />
        </nav>
      )}
    </header>
  );
}
