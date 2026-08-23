import Image from "next/image";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Icon, type IconName } from "./Icon";
import type { ListingType } from "@/lib/supabase/types";

/* ------------------------------------------------------------------ Badge */

export function Badge({
  children,
  tone = "neutral",
  size = "md",
  icon,
  className,
  style,
}: {
  children: ReactNode;
  tone?: "neutral" | "brand" | "accent" | "success" | "warning" | "danger" | "custom";
  size?: "sm" | "md";
  icon?: IconName;
  className?: string;
  style?: React.CSSProperties;
}) {
  const tones: Record<string, string> = {
    neutral: "bg-[var(--surface-sunken)] text-[var(--ink-soft)] border-[var(--line)]",
    brand: "bg-[var(--brand-50)] text-[var(--brand-700)] border-[var(--brand-200)]",
    accent: "bg-[color-mix(in_oklab,var(--accent-500)_12%,transparent)] text-[var(--accent-600)] border-[color-mix(in_oklab,var(--accent-500)_28%,transparent)]",
    success: "bg-[color-mix(in_oklab,var(--success)_12%,transparent)] text-[var(--success)] border-[color-mix(in_oklab,var(--success)_28%,transparent)]",
    warning: "bg-[color-mix(in_oklab,var(--warning)_14%,transparent)] text-[var(--warning)] border-[color-mix(in_oklab,var(--warning)_30%,transparent)]",
    danger: "bg-[color-mix(in_oklab,var(--danger)_12%,transparent)] text-[var(--danger)] border-[color-mix(in_oklab,var(--danger)_28%,transparent)]",
    custom: "",
  };
  return (
    <span
      style={style}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border font-semibold leading-none",
        size === "sm" ? "px-2 py-1 text-[0.6875rem]" : "px-2.5 py-1.5 text-[0.75rem]",
        tones[tone],
        className,
      )}
    >
      {icon ? <Icon name={icon} size={size === "sm" ? 11 : 13} /> : null}
      {children}
    </span>
  );
}

/** İlan türü rozeti — platformun görsel dilinin merkezinde */
export function TypeBadge({
  type,
  label,
  size = "md",
  className,
}: {
  type: ListingType;
  label: string;
  size?: "sm" | "md";
  className?: string;
}) {
  const color = `var(--type-${type})`;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-bold leading-none tracking-[-0.01em]",
        size === "sm" ? "px-2.5 py-1 text-[0.6875rem]" : "px-3 py-1.5 text-[0.75rem]",
        className,
      )}
      style={{
        color,
        background: `color-mix(in oklab, ${color} 13%, transparent)`,
        boxShadow: `inset 0 0 0 1px color-mix(in oklab, ${color} 26%, transparent)`,
      }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}

/* ----------------------------------------------------------------- Avatar */

export function Avatar({
  src,
  name,
  size = 36,
  verified,
  className,
}: {
  src?: string | null;
  name: string;
  size?: number;
  verified?: boolean;
  className?: string;
}) {
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <span className={cn("relative inline-flex shrink-0", className)} style={{ width: size, height: size }}>
      {src ? (
        <Image
          src={src}
          alt={name}
          width={size}
          height={size}
          className="rounded-full object-cover"
          style={{ width: size, height: size }}
        />
      ) : (
        <span
          className="flex items-center justify-center rounded-full bg-[var(--brand-100)] font-bold text-[var(--brand-700)]"
          style={{ width: size, height: size, fontSize: size * 0.36 }}
        >
          {initials || "?"}
        </span>
      )}
      {verified ? (
        <span
          className="absolute -end-0.5 -bottom-0.5 flex items-center justify-center rounded-full bg-[var(--surface-raised)] text-[var(--brand-600)]"
          style={{ width: size * 0.42, height: size * 0.42 }}
          title="Vérifié"
        >
          <Icon name="badgeCheck" size={size * 0.42} strokeWidth={1.6} />
        </span>
      ) : null}
    </span>
  );
}

/* ---------------------------------------------------------------- Ratings */

export function Rating({
  value,
  count,
  size = 13,
  className,
}: {
  value: number;
  count?: number;
  size?: number;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-1 text-[var(--ink-muted)]", className)}>
      <Icon name="star" size={size} fill="var(--warning)" className="text-[var(--warning)]" strokeWidth={0} />
      <span className="font-semibold text-[var(--ink-soft)]">{value ? value.toFixed(1) : "—"}</span>
      {count !== undefined ? <span className="text-[0.75rem]">({count})</span> : null}
    </span>
  );
}

/* --------------------------------------------------------------- Surfaces */

export function Card({
  children,
  className,
  padded = true,
  hover = false,
}: {
  children: ReactNode;
  className?: string;
  padded?: boolean;
  hover?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-[var(--radius-lg)] border border-[var(--line)] bg-[var(--surface-raised)]",
        padded && "p-5",
        hover && "card-hover",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton rounded-[var(--radius-md)]", className)} />;
}

export function EmptyState({
  icon = "package",
  title,
  text,
  action,
}: {
  icon?: IconName;
  title: string;
  text?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-[var(--radius-xl)] border border-dashed border-[var(--line)] px-6 py-16 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--surface-sunken)] text-[var(--ink-muted)]">
        <Icon name={icon} size={24} />
      </span>
      <h3 className="text-lg font-bold text-[var(--ink)]">{title}</h3>
      {text ? <p className="max-w-sm text-sm text-[var(--ink-muted)]">{text}</p> : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}

export function Section({
  children,
  className,
  id,
}: {
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section id={id} className={cn("relative px-5 py-20 sm:px-8 md:py-28", className)}>
      <div className="mx-auto w-full max-w-[1240px]">{children}</div>
    </section>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  text,
  align = "start",
  action,
}: {
  eyebrow?: string;
  title: string;
  text?: string;
  align?: "start" | "center";
  action?: ReactNode;
}) {
  return (
    <div
      className={cn(
        "mb-10 flex flex-col gap-3 md:mb-14",
        align === "center" && "items-center text-center",
        action && "md:flex-row md:items-end md:justify-between",
      )}
    >
      <div className={cn("flex flex-col gap-3", align === "center" && "items-center")}>
        {eyebrow ? <span className="eyebrow text-[var(--brand-600)]">{eyebrow}</span> : null}
        <h2 className="display-md max-w-3xl text-balance text-[var(--ink)]">{title}</h2>
        {text ? <p className="lede max-w-2xl text-pretty">{text}</p> : null}
      </div>
      {action}
    </div>
  );
}
