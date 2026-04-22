"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Login failed");
        return;
      }
      router.push("/");
      router.refresh();
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-[calc(100dvh-8rem)] flex-col items-center justify-center px-4 py-8">
      <div className="mb-8 flex flex-col items-center gap-3">
        <div className="relative h-20 w-20 overflow-hidden rounded-full bg-black ring-2 ring-[#8b1a1a]/40">
          <Image
            src="/mavericks_logo.png"
            alt="Tokyo Mavericks"
            width={80}
            height={80}
            className="object-contain"
            priority
          />
        </div>
        <h1 className="text-center text-2xl font-semibold text-white">Tokyo Mavericks</h1>
        <p className="text-center text-sm text-[#a0a0a0]">Sign in to manage attendance & carpools</p>
      </div>

      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm space-y-4 rounded-xl border border-white/10 bg-white/[0.03] p-6"
      >
        {error && (
          <p className="rounded-lg bg-[#8b1a1a]/30 px-3 py-2 text-sm text-red-200" role="alert">
            {error}
          </p>
        )}
        <div>
          <label htmlFor="email" className="mb-1 block text-sm text-[#a0a0a0]">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="tap-target w-full rounded-lg border border-white/15 bg-[#0a0a0a] px-4 py-3 text-white placeholder:text-white/40 focus:border-[#8b1a1a] focus:outline-none focus:ring-1 focus:ring-[#8b1a1a]"
            placeholder="email@example.com"
          />
        </div>
        <div>
          <label htmlFor="password" className="mb-1 block text-sm text-[#a0a0a0]">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="tap-target w-full rounded-lg border border-white/15 bg-[#0a0a0a] px-4 py-3 text-white placeholder:text-white/40 focus:border-[#8b1a1a] focus:outline-none focus:ring-1 focus:ring-[#8b1a1a]"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="tap-target w-full rounded-lg bg-[#8b1a1a] py-3 text-base font-medium text-white transition hover:bg-[#a32222] disabled:opacity-50"
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <footer className="pointer-events-none fixed inset-x-0 bottom-4 z-10 flex flex-col items-center gap-2 text-[11px] text-white/40 [&_a]:pointer-events-auto">
        <a
          href="https://riftengineering.com.au"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Rift Engineering"
          className="opacity-70 transition hover:opacity-100"
        >
          <Image
            src="/rift_engineering_logo.svg"
            alt="Rift Engineering"
            width={32}
            height={32}
            className="rounded-sm"
          />
        </a>
        <p>
          Built by{" "}
          <a
            href="https://riftengineering.com.au"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white/60 underline-offset-2 hover:text-white hover:underline"
          >
            Rift Engineering
          </a>
          {" · "}
          <a
            href="https://github.com/Rift-Engineering/Mavericks"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white/60 underline-offset-2 hover:text-white hover:underline"
          >
            source
          </a>
        </p>
      </footer>
    </div>
  );
}
