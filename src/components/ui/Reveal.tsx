"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Scroll ile görünür olduğunda içeriği açığa çıkarır.
 * IntersectionObserver + CSS geçişi — kütüphane yok, ana iş parçacığı boş.
 * prefers-reduced-motion açıksa animasyon devre dışı kalır (globals.css).
 */
export function Reveal({
  children,
  variant = "up",
  delay = 0,
  once = true,
  className,
}: {
  children: ReactNode;
  variant?: "up" | "scale" | "left" | "right";
  delay?: number;
  once?: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.classList.add("is-visible");
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            if (once) observer.unobserve(entry.target);
          } else if (!once) {
            entry.target.classList.remove("is-visible");
          }
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [once]);

  return (
    <div
      ref={ref}
      data-reveal={variant === "up" ? "" : variant}
      style={{ "--reveal-delay": `${delay}ms` } as CSSProperties}
      className={cn(className)}
    >
      {children}
    </div>
  );
}

/** Çocukları sırayla açığa çıkaran sarmalayıcı */
export function RevealGroup({
  children,
  stagger = 70,
  className,
}: {
  children: ReactNode[];
  stagger?: number;
  className?: string;
}) {
  return (
    <div className={className}>
      {children.map((child, i) => (
        <Reveal key={i} delay={i * stagger}>
          {child}
        </Reveal>
      ))}
    </div>
  );
}
