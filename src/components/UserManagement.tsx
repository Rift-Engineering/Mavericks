"use client";

import type { Role } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

type UserRow = {
  id: string;
  email: string;
  name: string;
  role: Role;
  createdAt: Date;
};

export function UserManagement({ initialUsers }: { initialUsers: UserRow[] }) {
  const router = useRouter();
  const [users, setUsers] = useState(initialUsers);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<string | null>(null);

  async function createUser(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading("create");
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, password }),
      });
      const data = (await res.json()) as { error?: string; user?: UserRow };
      if (!res.ok) {
        setError(data.error ?? "Failed");
        return;
      }
      if (data.user) {
        setUsers((u) => [...u, { ...data.user!, createdAt: new Date() }].sort((a, b) => a.name.localeCompare(b.name)));
        setEmail("");
        setName("");
        setPassword("");
      }
      router.refresh();
    } catch {
      setError("Request failed");
    } finally {
      setLoading(null);
    }
  }

  async function updateRole(id: string, role: Role) {
    setLoading(id + "role");
    setError(null);
    try {
      const res = await fetch(`/api/users/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Failed");
        return;
      }
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, role } : u)));
      router.refresh();
    } catch {
      setError("Request failed");
    } finally {
      setLoading(null);
    }
  }

  async function resetPassword(id: string) {
    if (!confirm("Reset password to default (mavericks123)?")) return;
    setLoading(id + "pw");
    setError(null);
    try {
      const res = await fetch(`/api/users/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resetPassword: true }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Failed");
        return;
      }
      router.refresh();
    } catch {
      setError("Request failed");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="space-y-10">
      <form
        onSubmit={createUser}
        className="rounded-xl border border-white/10 bg-white/[0.03] p-4 space-y-3"
      >
        <h2 className="text-lg font-medium text-white">Create user</h2>
        {error && (
          <p className="text-sm text-red-300" role="alert">
            {error}
          </p>
        )}
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <label htmlFor="new-email" className="mb-1 block text-sm text-muted">Email</label>
            <input
              id="new-email"
              required
              type="email"
              placeholder="player@team.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-white/15 bg-[#0a0a0a] px-3 py-2 text-white"
            />
          </div>
          <div>
            <label htmlFor="new-name" className="mb-1 block text-sm text-muted">Name</label>
            <input
              id="new-name"
              required
              placeholder="Full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-white/15 bg-[#0a0a0a] px-3 py-2 text-white"
            />
          </div>
          <div>
            <label htmlFor="new-password" className="mb-1 block text-sm text-muted">Temporary password</label>
            <input
              id="new-password"
              required
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-white/15 bg-[#0a0a0a] px-3 py-2 text-white"
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={loading === "create"}
          className="rounded-lg bg-[#8b1a1a] px-4 py-2 text-sm font-medium text-white hover:bg-[#a32222] disabled:opacity-50"
        >
          {loading === "create" ? "Creating…" : "Create"}
        </button>
      </form>

      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full min-w-[600px] text-left text-sm">
          <thead>
            <tr className="border-b border-white/10 bg-white/[0.05]">
              <th scope="col" className="px-4 py-3 font-medium text-[#a0a0a0]">Name</th>
              <th scope="col" className="px-4 py-3 font-medium text-[#a0a0a0]">Email</th>
              <th scope="col" className="px-4 py-3 font-medium text-[#a0a0a0]">Role</th>
              <th scope="col" className="px-4 py-3 font-medium text-[#a0a0a0]">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-white/5">
                <td className="px-4 py-3 text-white">{u.name}</td>
                <td className="px-4 py-3 text-[#a0a0a0]">{u.email}</td>
                <td className="px-4 py-3">
                  <select
                    value={u.role}
                    disabled={loading === u.id + "role"}
                    onChange={(e) => void updateRole(u.id, e.target.value as Role)}
                    className="rounded border border-white/15 bg-[#0a0a0a] px-2 py-1 text-white"
                  >
                    <option value="PLAYER">Player</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => void resetPassword(u.id)}
                    disabled={loading === u.id + "pw"}
                    className="text-sm text-[#8b1a1a] hover:underline disabled:opacity-50"
                  >
                    Reset password
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
