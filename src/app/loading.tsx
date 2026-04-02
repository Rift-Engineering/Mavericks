export default function Loading() {
  return (
    <div className="space-y-4 pt-4" aria-busy="true" aria-label="Loading">
      <div className="h-8 w-48 animate-pulse rounded-lg bg-white/10" />
      <div className="h-4 w-64 animate-pulse rounded bg-white/5" />
      <div className="mt-6 space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 animate-pulse rounded-xl border border-white/10 bg-white/[0.03]" />
        ))}
      </div>
    </div>
  );
}
