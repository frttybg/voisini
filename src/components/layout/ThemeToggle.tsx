"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/ui/Icon";

type Theme = "light" | "dark" | "system";

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("system");

  useEffect(() => {
    const stored = (localStorage.getItem("vsi-theme") as Theme | null) ?? "system";
    setTheme(stored);
    apply(stored);
  }, []);

  function apply(next: Theme) {
    const root = document.documentElement;
    if (next === "system") root.removeAttribute("data-theme");
    else root.setAttribute("data-theme", next);
  }

  function cycle() {
    const order: Theme[] = ["system", "light", "dark"];
    const next = order[(order.indexOf(theme) + 1) % order.length];
    setTheme(next);
    localStorage.setItem("vsi-theme", next);
    apply(next);
  }

  return (
    <button
      type="button"
      onClick={cycle}
      aria-label="Theme"
      title={theme}
      className="rounded-full p-2.5 text-[var(--ink-soft)] transition-colors hover:bg-[var(--surface-sunken)] hover:text-[var(--ink)]"
    >
      <Icon name={theme === "dark" ? "moon" : theme === "light" ? "sun" : "sparkles"} size={18} />
    </button>
  );
}
