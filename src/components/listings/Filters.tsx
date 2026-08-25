"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";
import { cn, listingTypeAll } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/provider";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Overlay";

const DISTANCES = [1000, 5000, 10000, 25000, 50000, 100000];

export function Filters({
  categories,
  total,
}: {
  categories: { slug: string; name: string }[];
  total: number;
}) {
  const { t } = useI18n();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [open, setOpen] = useState(false);

  const setParam = useCallback(
    (updates: Record<string, string | null>) => {
      const next = new URLSearchParams(params.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === "") next.delete(key);
        else next.set(key, value);
      }
      next.delete("offset");
      router.push(`${pathname}?${next.toString()}`, { scroll: false });
    },
    [params, pathname, router],
  );

  const activeType = params.get("type");
  const activeSort = params.get("sort") ?? "distance";
  const activeRadius = Number(params.get("radius") ?? 25000);
  const activeCategory = params.get("category");

  const activeCount = ["category", "condition", "min", "max"].filter((k) => params.get(k)).length;

  return (
    <div className="sticky top-16 z-30 -mx-5 mb-6 border-b border-[var(--line)] bg-[color-mix(in_oklab,var(--surface)_88%,transparent)] px-5 py-3 backdrop-blur-xl sm:mx-0 sm:rounded-[var(--radius-lg)] sm:border sm:px-4">
      <div className="no-scrollbar flex items-center gap-2 overflow-x-auto">
        <Chip active={!activeType} onClick={() => setParam({ type: null })}>
          {t.filters.all}
        </Chip>
        {listingTypeAll.map((type) => (
          <Chip
            key={type}
            active={activeType === type}
            color={`var(--type-${type})`}
            onClick={() => setParam({ type: activeType === type ? null : type })}
          >
            {t.types[type].short}
          </Chip>
        ))}

        <span className="mx-1 h-6 w-px shrink-0 bg-[var(--line)]" />

        <select
          value={activeRadius}
          onChange={(e) => setParam({ radius: e.target.value })}
          aria-label={t.filters.distance}
          className="h-9 shrink-0 rounded-full border border-[var(--line)] bg-[var(--surface-raised)] px-3 text-[0.8125rem] font-semibold text-[var(--ink-soft)] outline-none"
        >
          {DISTANCES.map((d) => (
            <option key={d} value={d}>
              {d / 1000} km
            </option>
          ))}
        </select>

        <select
          value={activeSort}
          onChange={(e) => setParam({ sort: e.target.value })}
          aria-label={t.filters.title}
          className="h-9 shrink-0 rounded-full border border-[var(--line)] bg-[var(--surface-raised)] px-3 text-[0.8125rem] font-semibold text-[var(--ink-soft)] outline-none"
        >
          <option value="distance">{t.filters.nearest}</option>
          <option value="recent">{t.filters.newest}</option>
          <option value="price_asc">{t.filters.priceAsc}</option>
          <option value="price_desc">{t.filters.priceDesc}</option>
        </select>

        <button
          type="button"
          onClick={() => setOpen(true)}
          className={cn(
            "flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-[0.8125rem] font-semibold transition-colors",
            activeCount
              ? "border-[var(--brand-400)] bg-[var(--brand-50)] text-[var(--brand-700)]"
              : "border-[var(--line)] bg-[var(--surface-raised)] text-[var(--ink-soft)]",
          )}
        >
          <Icon name="filter" size={14} />
          {t.filters.title}
          {activeCount ? <span className="tabular-nums">({activeCount})</span> : null}
        </button>

        <span className="ms-auto hidden shrink-0 ps-3 text-[0.8125rem] text-[var(--ink-muted)] sm:block">
          {total} {t.filters.results}
        </span>
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={t.filters.title}
        footer={
          <div className="flex gap-2">
            <Button
              variant="ghost"
              full
              onClick={() => {
                setParam({ category: null, condition: null, min: null, max: null });
                setOpen(false);
              }}
            >
              {t.filters.reset}
            </Button>
            <Button full onClick={() => setOpen(false)}>
              {t.filters.apply}
            </Button>
          </div>
        }
      >
        <div className="flex flex-col gap-5">
          <div>
            <Label>{t.filters.category}</Label>
            <Select
              value={activeCategory ?? ""}
              onChange={(e) => setParam({ category: e.target.value || null })}
            >
              <option value="">{t.filters.all}</option>
              {categories.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <Label>{t.filters.condition}</Label>
            <Select
              value={params.get("condition") ?? ""}
              onChange={(e) => setParam({ condition: e.target.value || null })}
            >
              <option value="">{t.filters.all}</option>
              {(["new", "like_new", "good", "fair", "for_parts"] as const).map((c) => (
                <option key={c} value={c}>
                  {t.conditions[c]}
                </option>
              ))}
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>{t.filters.minPrice}</Label>
              <Input
                type="number"
                min={0}
                defaultValue={params.get("min") ?? ""}
                onBlur={(e) => setParam({ min: e.target.value || null })}
              />
            </div>
            <div>
              <Label>{t.filters.maxPrice}</Label>
              <Input
                type="number"
                min={0}
                defaultValue={params.get("max") ?? ""}
                onBlur={(e) => setParam({ max: e.target.value || null })}
              />
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function Chip({
  active,
  color,
  onClick,
  children,
}: {
  active: boolean;
  color?: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "h-9 shrink-0 rounded-full border px-3.5 text-[0.8125rem] font-semibold transition-all duration-300 active:scale-95",
        active
          ? "border-transparent text-white"
          : "border-[var(--line)] bg-[var(--surface-raised)] text-[var(--ink-soft)] hover:border-[var(--brand-300)]",
      )}
      style={active ? { background: color ?? "var(--ink)" } : undefined}
    >
      {children}
    </button>
  );
}
