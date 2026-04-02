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
    <div className="flex min-h-[70dvh] flex-col items-center justify-center px-4">
      <div className="mb-10 flex flex-col items-center gap-4">
        <div className="relative h-24 w-24 overflow-hidden rounded-full bg-black ring-2 ring-[#8b1a1a]/40">
          <Image
            src="/mavericks_logo.png"
            alt="Tokyo Mavericks"
            width={96}
            height={96}
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
            placeholder="you@example.com"
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
    </div>
  );
}
