"use client";

import Link from "next/link";
import { forwardRef, useRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Icon, type IconName } from "./Icon";

type Variant = "primary" | "secondary" | "ghost" | "outline" | "danger" | "glass";
type Size = "sm" | "md" | "lg" | "xl";

const variants: Record<Variant, string> = {
  primary:
    "bg-[var(--brand-600)] text-white hover:bg-[var(--brand-700)] shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-card)]",
  secondary:
    "bg-[var(--ink)] text-[var(--surface)] hover:opacity-90 shadow-[var(--shadow-soft)]",
  outline:
    "border border-[var(--line)] bg-[var(--surface-raised)] text-[var(--ink)] hover:border-[var(--brand-400)] hover:text-[var(--brand-700)]",
  ghost: "text-[var(--ink-soft)] hover:bg-[var(--surface-sunken)] hover:text-[var(--ink)]",
  danger: "bg-[var(--danger)] text-white hover:brightness-110",
  glass:
    "glass border border-white/25 text-[var(--ink)] hover:border-[var(--brand-300)]",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-3.5 text-[0.8125rem] gap-1.5 rounded-[var(--radius-sm)]",
  md: "h-11 px-5 text-sm gap-2 rounded-[var(--radius-md)]",
  lg: "h-[52px] px-6 text-[0.95rem] gap-2.5 rounded-[var(--radius-lg)]",
  xl: "h-[60px] px-8 text-base gap-3 rounded-[var(--radius-xl)]",
};

const base =
  "inline-flex items-center justify-center font-semibold tracking-[-0.01em] " +
  "transition-[transform,background-color,box-shadow,color,border-color] duration-300 " +
  "[transition-timing-function:var(--ease-spring)] active:scale-[0.97] " +
  "disabled:opacity-50 disabled:pointer-events-none select-none whitespace-nowrap";

export type ButtonProps = {
  variant?: Variant;
  size?: Size;
  icon?: IconName;
  iconRight?: IconName;
  loading?: boolean;
  full?: boolean;
  /** İmleci hafifçe takip eden "manyetik" etki */
  magnetic?: boolean;
  href?: string;
  children?: ReactNode;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children">;

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = "primary",
    size = "md",
    icon,
    iconRight,
    loading,
    full,
    magnetic,
    href,
    className,
    children,
    disabled,
    ...rest
  },
  ref,
) {
  const inner = useRef<HTMLElement | null>(null);

  const magneticHandlers = magnetic
    ? {
        onPointerMove: (e: React.PointerEvent) => {
          const el = inner.current;
          if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
          const r = el.getBoundingClientRect();
          const x = (e.clientX - (r.left + r.width / 2)) * 0.18;
          const y = (e.clientY - (r.top + r.height / 2)) * 0.28;
          el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
        },
        onPointerLeave: () => {
          if (inner.current) inner.current.style.transform = "";
        },
      }
    : {};

  /**
   * Metin ve ikonlar bilerek <span> içine sarılıyor.
   * Tarayıcının otomatik çeviri eklentisi (Google Translate) sayfadaki
   * ÇIPLAK metin düğümlerini değiştiriyor; React aynı düğümü değiştirmeye
   * çalıştığında "insertBefore ... is not a child of this node" hatası
   * veriyor. Sarmalayınca eklenti span'ın içini değiştiriyor, React'in
   * takip ettiği düğüm yerinde kalıyor.
   */
  const content = (
    <>
      {loading ? (
        <span className="inline-flex shrink-0" aria-hidden>
          <Icon name="loader" size={16} className="animate-spin" />
        </span>
      ) : icon ? (
        <span className="inline-flex shrink-0" aria-hidden>
          <Icon name={icon} size={size === "sm" ? 15 : 18} />
        </span>
      ) : null}
      {children !== undefined && children !== null ? <span>{children}</span> : null}
      {iconRight && !loading ? (
        <span className="inline-flex shrink-0" aria-hidden>
          <Icon name={iconRight} size={size === "sm" ? 15 : 18} />
        </span>
      ) : null}
    </>
  );

  const classes = cn(base, variants[variant], sizes[size], full && "w-full", className);

  if (href) {
    return (
      <Link
        href={href}
        ref={(node) => {
          inner.current = node;
        }}
        className={classes}
        {...magneticHandlers}
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      ref={(node) => {
        inner.current = node;
        if (typeof ref === "function") ref(node);
        else if (ref) ref.current = node;
      }}
      className={classes}
      disabled={disabled || loading}
      {...magneticHandlers}
      {...rest}
    >
      {content}
    </button>
  );
});
