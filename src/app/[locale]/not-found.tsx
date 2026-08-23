import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[70svh] w-full max-w-lg flex-col items-center justify-center gap-4 px-5 text-center">
      <p className="display-lg text-[var(--brand-600)]">404</p>
      <p className="lede">Cette page n&apos;existe pas (ou plus).</p>
      <Link
        href="/"
        className="rounded-full bg-[var(--brand-600)] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[var(--brand-700)]"
      >
        Voisini
      </Link>
    </div>
  );
}
