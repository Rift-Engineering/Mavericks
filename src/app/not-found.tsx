import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[50dvh] flex-col items-center justify-center text-center">
      <p className="text-6xl font-bold text-accent">404</p>
      <h1 className="mt-4 text-xl font-semibold text-white">Page not found</h1>
      <p className="mt-2 text-muted">The page you&apos;re looking for doesn&apos;t exist or has been moved.</p>
      <Link href="/" className="mt-6 rounded-lg bg-accent px-6 py-3 font-medium text-white hover:bg-accent-hover">
        Go home
      </Link>
    </div>
  );
}
