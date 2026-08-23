import { cn } from "@/lib/utils";

export function Logo({ className, mark = false }: { className?: string; mark?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span className="relative flex h-8 w-8 items-center justify-center">
        <svg viewBox="0 0 32 32" width={32} height={32} aria-hidden="true">
          <defs>
            <linearGradient id="voisini-mark" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="var(--brand-400)" />
              <stop offset="100%" stopColor="var(--brand-700)" />
            </linearGradient>
          </defs>
          <path
            d="M16 2.6c7.4 0 13.4 6 13.4 13.4S23.4 29.4 16 29.4 2.6 23.4 2.6 16 8.6 2.6 16 2.6Z"
            fill="url(#voisini-mark)"
          />
          <path
            d="M10 11.4h3.1l2.9 8 2.9-8H22l-4.6 11.4h-2.8Z"
            fill="var(--surface-raised)"
          />
          <circle cx="23.4" cy="9.4" r="2.6" fill="var(--accent-500)" />
        </svg>
      </span>
      {!mark ? (
        <span className="text-[1.05rem] font-extrabold tracking-[-0.03em] text-[var(--ink)]">
          voisini
        </span>
      ) : null}
    </span>
  );
}
