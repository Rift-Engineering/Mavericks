"use client";

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[50dvh] flex-col items-center justify-center text-center">
      <p className="text-6xl font-bold text-accent">500</p>
      <h1 className="mt-4 text-xl font-semibold text-white">Something went wrong</h1>
      <p className="mt-2 text-muted">An unexpected error occurred. Please try again.</p>
      <button
        onClick={reset}
        className="mt-6 rounded-lg bg-accent px-6 py-3 font-medium text-white hover:bg-accent-hover"
      >
        Try again
      </button>
    </div>
  );
}
