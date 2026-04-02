"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function ClientActions({
  sessionId,
  canOptimise,
  canPublish,
  hasSnapshot,
}: {
  sessionId: string;
  canOptimise: boolean;
  canPublish: boolean;
  hasSnapshot: boolean;
}) {
  const router = useRouter();
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState<string | null>(null);

  async function optimise(refresh: boolean) {
    setMsg(null);
    setLoading("opt");
    try {
      const url = `/api/sessions/${sessionId}/optimise${refresh ? "?refresh=1" : ""}`;
      const res = await fetch(url, { method: "POST" });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setMsg(data.error ?? "Optimisation failed");
        return;
      }
      router.refresh();
    } catch {
      setMsg("Request failed");
    } finally {
      setLoading(null);
    }
  }

  async function publish() {
    setMsg(null);
    setLoading("pub");
    try {
      const res = await fetch(`/api/sessions/${sessionId}/publish`, { method: "POST" });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setMsg(data.error ?? "Publish failed");
        return;
      }
      router.push(`/sessions/${sessionId}`);
      router.refresh();
    } catch {
      setMsg("Request failed");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {msg && <p className="text-sm text-red-300">{msg}</p>}
      <div className="flex flex-wrap gap-2">
        {canOptimise && (
          <>
            <button
              type="button"
              disabled={loading !== null}
              onClick={() => void optimise(false)}
              className="rounded-lg bg-[#8b1a1a] px-4 py-2 text-sm font-medium text-white hover:bg-[#a32222] disabled:opacity-50"
            >
              {loading === "opt" && !hasSnapshot ? "Running…" : "Generate assignments"}
            </button>
            {hasSnapshot && (
              <button
                type="button"
                disabled={loading !== null}
                onClick={() => void optimise(true)}
                className="rounded-lg border border-white/20 px-4 py-2 text-sm text-[#a0a0a0] hover:text-white disabled:opacity-50"
              >
                Refresh matrices (API cost)
              </button>
            )}
          </>
        )}
        {canPublish && (
          <button
            type="button"
            disabled={loading !== null}
            onClick={() => void publish()}
            className="rounded-lg bg-emerald-900/80 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800 disabled:opacity-50"
          >
            {loading === "pub" ? "Publishing…" : "Publish to players"}
          </button>
        )}
      </div>
    </div>
  );
}
