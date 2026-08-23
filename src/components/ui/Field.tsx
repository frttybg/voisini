"use client";

import {
  forwardRef,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import { cn } from "@/lib/utils";
import { Icon, type IconName } from "./Icon";

const controlBase =
  "w-full bg-[var(--surface-raised)] border border-[var(--line)] text-[var(--ink)] " +
  "placeholder:text-[var(--ink-muted)] rounded-[var(--radius-md)] " +
  "transition-[border-color,box-shadow,background-color] duration-200 " +
  "focus:outline-none focus:border-[var(--brand-400)] " +
  "focus:shadow-[0_0_0_4px_var(--brand-100)] disabled:opacity-60";

export function Label({
  htmlFor,
  children,
  hint,
  required,
}: {
  htmlFor?: string;
  children: ReactNode;
  hint?: string;
  required?: boolean;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-1.5 flex items-baseline gap-2 text-[0.8125rem] font-semibold text-[var(--ink-soft)]"
    >
      {children}
      {required ? <span className="text-[var(--accent-500)]">*</span> : null}
      {hint ? <span className="text-[0.75rem] font-normal text-[var(--ink-muted)]">{hint}</span> : null}
    </label>
  );
}

export function FieldError({ children }: { children?: ReactNode }) {
  if (!children) return null;
  return (
    <p className="mt-1.5 flex items-center gap-1.5 text-[0.8125rem] text-[var(--danger)]">
      <Icon name="alert" size={14} />
      {children}
    </p>
  );
}

export const Input = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement> & { icon?: IconName; invalid?: boolean }
>(function Input({ className, icon, invalid, ...rest }, ref) {
  return (
    <div className="relative">
      {icon ? (
        <span className="pointer-events-none absolute inset-y-0 start-3.5 flex items-center text-[var(--ink-muted)]">
          <Icon name={icon} size={17} />
        </span>
      ) : null}
      <input
        ref={ref}
        className={cn(
          controlBase,
          "h-11 px-3.5 text-[0.9375rem]",
          icon && "ps-10",
          invalid && "border-[var(--danger)]",
          className,
        )}
        {...rest}
      />
    </div>
  );
});

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }
>(function Textarea({ className, invalid, ...rest }, ref) {
  return (
    <textarea
      ref={ref}
      className={cn(
        controlBase,
        "min-h-28 resize-y px-3.5 py-3 text-[0.9375rem] leading-relaxed",
        invalid && "border-[var(--danger)]",
        className,
      )}
      {...rest}
    />
  );
});

export const Select = forwardRef<
  HTMLSelectElement,
  SelectHTMLAttributes<HTMLSelectElement> & { invalid?: boolean }
>(function Select({ className, invalid, children, ...rest }, ref) {
  return (
    <div className="relative">
      <select
        ref={ref}
        className={cn(
          controlBase,
          "h-11 appearance-none px-3.5 pe-10 text-[0.9375rem]",
          invalid && "border-[var(--danger)]",
          className,
        )}
        {...rest}
      >
        {children}
      </select>
      <span className="pointer-events-none absolute inset-y-0 end-3.5 flex items-center text-[var(--ink-muted)]">
        <Icon name="chevronDown" size={16} />
      </span>
    </div>
  );
});

export function Checkbox({
  label,
  className,
  ...rest
}: InputHTMLAttributes<HTMLInputElement> & { label: ReactNode }) {
  return (
    <label className={cn("flex cursor-pointer items-start gap-3 text-sm text-[var(--ink-soft)]", className)}>
      <input
        type="checkbox"
        className="mt-0.5 h-[18px] w-[18px] shrink-0 cursor-pointer accent-[var(--brand-600)]"
        {...rest}
      />
      <span>{label}</span>
    </label>
  );
}

/** Segment seçici — ilan türü, sıralama, görünüm vb. için */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  size = "md",
  className,
}: {
  options: { value: T; label: ReactNode; color?: string }[];
  value: T;
  onChange: (value: T) => void;
  size?: "sm" | "md";
  className?: string;
}) {
  return (
    <div
      role="tablist"
      className={cn(
        "inline-flex items-center gap-1 rounded-[var(--radius-lg)] border border-[var(--line)] bg-[var(--surface-sunken)] p-1",
        className,
      )}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.value)}
            className={cn(
              "rounded-[var(--radius-md)] font-semibold transition-all duration-300 [transition-timing-function:var(--ease-spring)]",
              size === "sm" ? "px-3 py-1.5 text-[0.75rem]" : "px-4 py-2 text-[0.8125rem]",
              active
                ? "bg-[var(--surface-raised)] text-[var(--ink)] shadow-[var(--shadow-soft)]"
                : "text-[var(--ink-muted)] hover:text-[var(--ink-soft)]",
            )}
            style={active && opt.color ? { color: opt.color } : undefined}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
