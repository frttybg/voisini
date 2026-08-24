"use client";

import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n/provider";
import { Icon } from "@/components/ui/Icon";

type Theme = "system" | "light" | "dark";
type Skin = "voisini" | "klasik" | "luks" | "cesur";

const SKINS: Skin[] = ["voisini", "klasik", "luks", "cesur"];
const THEMES: Theme[] = ["system", "light", "dark"];

/** Küçük renk örneği: her görünümün karakterini tek bakışta gösterir. */
const SWATCH: Record<Skin, [string, string, string]> = {
  voisini: ["#fbfaf7", "#12a97f", "#0a1310"],
  klasik: ["#fbfaf6", "#14533d", "#9c6b3f"],
  luks: ["#0a0c0a", "#c8b78a", "#47c28e"],
  cesur: ["#e9e5da", "#0f5b3f", "#e4572e"],
};

function applyTheme(next: Theme) {
  const root = document.documentElement;
  if (next === "system") root.removeAttribute("data-theme");
  else root.setAttribute("data-theme", next);
}

function applySkin(next: Skin) {
  const root = document.documentElement;
  if (next === "voisini") root.removeAttribute("data-skin");
  else root.setAttribute("data-skin", next);
}

export function AppearanceMenu({
  allowSkins = false,
}: {
  /**
   * Stil (görünüm) seçimi yalnızca yöneticiye gösterilir. Ziyaretçiler
   * sitenin tek bir kimliğini görür; gece/gündüz seçimi herkeste açıktır.
   */
  allowSkins?: boolean;
}) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState<Theme>("system");
  const [skin, setSkin] = useState<Skin>("voisini");
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const storedTheme = localStorage.getItem("vsi-theme") as Theme | null;
      const storedSkin = localStorage.getItem("vsi-skin") as Skin | null;
      if (storedTheme && THEMES.includes(storedTheme)) setTheme(storedTheme);
      if (storedSkin && SKINS.includes(storedSkin)) setSkin(storedSkin);
    } catch {
      /* gizli sekmede depolama kapalı olabilir */
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    function onDown(event: MouseEvent) {
      if (!boxRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function chooseSkin(next: Skin) {
    setSkin(next);
    applySkin(next);
    try {
      localStorage.setItem("vsi-skin", next);
    } catch {
      /* yoksay */
    }
  }

  function chooseTheme(next: Theme) {
    setTheme(next);
    applyTheme(next);
    try {
      localStorage.setItem("vsi-theme", next);
    } catch {
      /* yoksay */
    }
  }

  const themeLabel: Record<Theme, string> = {
    system: t.appearance.system,
    light: t.appearance.light,
    dark: t.appearance.dark,
  };
  const skinLabel: Record<Skin, string> = {
    voisini: t.appearance.skinVoisini,
    klasik: t.appearance.skinKlasik,
    luks: t.appearance.skinLuks,
    cesur: t.appearance.skinCesur,
  };

  return (
    <div className="relative" ref={boxRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t.appearance.title}
        title={t.appearance.title}
        className="rounded-[var(--radius-xl)] p-2.5 text-[var(--ink-soft)] transition-colors hover:bg-[var(--surface-sunken)] hover:text-[var(--ink)]"
      >
        <Icon name={theme === "dark" ? "moon" : theme === "light" ? "sun" : "sparkles"} size={18} />
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute end-0 top-full z-50 mt-2 w-56 rounded-[var(--radius-lg)] border border-[var(--line)] bg-[var(--surface-raised)] p-2 shadow-[var(--shadow-lift)]"
        >
          {allowSkins ? (
            <>
          <p className="px-2 pb-1.5 pt-1 text-[0.68rem] font-bold uppercase tracking-[0.16em] text-[var(--ink-muted)]">
            {t.appearance.style}
          </p>

          <div className="flex flex-col">
            {SKINS.map((value) => (
              <button
                key={value}
                type="button"
                role="menuitemradio"
                aria-checked={skin === value}
                onClick={() => chooseSkin(value)}
                className={`flex items-center gap-2.5 rounded-[var(--radius-md)] px-2 py-2 text-start text-sm transition-colors ${
                  skin === value
                    ? "bg-[var(--brand-50)] font-semibold text-[var(--brand-600)]"
                    : "text-[var(--ink-soft)] hover:bg-[var(--surface-sunken)]"
                }`}
              >
                <span className="flex overflow-hidden rounded-full border border-[var(--line)]">
                  {SWATCH[value].map((color) => (
                    <span
                      key={color}
                      className="block h-4 w-2.5"
                      style={{ background: color }}
                      aria-hidden
                    />
                  ))}
                </span>
                <span className="flex-1">{skinLabel[value]}</span>
                {skin === value ? <Icon name="check" size={14} /> : null}
              </button>
            ))}
          </div>
            </>
          ) : null}

          <p
            className={`px-2 pb-1.5 text-[0.68rem] font-bold uppercase tracking-[0.16em] text-[var(--ink-muted)] ${
              allowSkins ? "pt-3" : "pt-1"
            }`}
          >
            {t.appearance.theme}
          </p>

          <div className="grid grid-cols-3 gap-1">
            {THEMES.map((value) => (
              <button
                key={value}
                type="button"
                role="menuitemradio"
                aria-checked={theme === value}
                onClick={() => chooseTheme(value)}
                className={`flex flex-col items-center gap-1 rounded-[var(--radius-md)] px-1 py-2 text-[0.72rem] transition-colors ${
                  theme === value
                    ? "bg-[var(--brand-50)] font-semibold text-[var(--brand-600)]"
                    : "text-[var(--ink-soft)] hover:bg-[var(--surface-sunken)]"
                }`}
              >
                <Icon
                  name={value === "dark" ? "moon" : value === "light" ? "sun" : "sparkles"}
                  size={15}
                />
                {themeLabel[value]}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
