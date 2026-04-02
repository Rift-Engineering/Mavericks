"use client";

import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={() => void logout()}
      className="tap-target rounded-lg border border-white/20 px-3 py-2 text-sm text-[#a0a0a0] hover:border-[#8b1a1a] hover:text-white"
    >
      Log out
    </button>
  );
}
