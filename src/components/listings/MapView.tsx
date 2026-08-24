"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n/provider";
import { Icon } from "@/components/ui/Icon";
import { formatDistance, formatPrice } from "@/lib/utils";
import type { ListingCard as ListingCardData } from "@/lib/supabase/types";

/**
 * Elle yazılmış kaydırılabilir harita.
 *
 * Karolar OpenStreetMap'ten gelir (kullanım şartı gereği atıf sağ altta
 * gösterilir). Ek bir harita kütüphanesi kullanılmaz.
 *
 * Gizlilik: işaretler ilanın veritabanındaki konumunu gösterir; bu konum
 * ilan eklenirken bilerek kaydırılmıştır, gerçek adres hiç saklanmaz.
 */

const TILE = 256;
const MIN_ZOOM = 3;
const MAX_ZOOM = 17;

type Point = { lat: number; lng: number };

function project(lat: number, lng: number, zoom: number) {
  const scale = TILE * 2 ** zoom;
  const x = ((lng + 180) / 360) * scale;
  const s = Math.min(Math.max(Math.sin((lat * Math.PI) / 180), -0.9999), 0.9999);
  const y = (0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI)) * scale;
  return { x, y };
}

function unproject(x: number, y: number, zoom: number): Point {
  const scale = TILE * 2 ** zoom;
  const lng = (x / scale) * 360 - 180;
  const n = Math.PI - (2 * Math.PI * y) / scale;
  const lat = (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
  return { lat, lng };
}

/** Tüm noktaları kapsayan merkez ve yakınlaştırma düzeyi. */
function fit(points: Point[], width: number, height: number): { center: Point; zoom: number } {
  if (!points.length) return { center: { lat: 48.8566, lng: 2.3522 }, zoom: 12 };
  if (points.length === 1) return { center: points[0], zoom: 14 };

  const lats = points.map((p) => p.lat);
  const lngs = points.map((p) => p.lng);
  const center = {
    lat: (Math.min(...lats) + Math.max(...lats)) / 2,
    lng: (Math.min(...lngs) + Math.max(...lngs)) / 2,
  };

  for (let zoom = MAX_ZOOM; zoom >= MIN_ZOOM; zoom--) {
    const corners = points.map((p) => project(p.lat, p.lng, zoom));
    const w = Math.max(...corners.map((c) => c.x)) - Math.min(...corners.map((c) => c.x));
    const h = Math.max(...corners.map((c) => c.y)) - Math.min(...corners.map((c) => c.y));
    if (w < width - 96 && h < height - 96) return { center, zoom };
  }
  return { center, zoom: MIN_ZOOM };
}

export function MapView({
  listings,
  points,
  images,
}: {
  listings: ListingCardData[];
  points: Record<string, Point>;
  images: Record<string, string | null>;
}) {
  const { t, locale } = useI18n();
  const router = useRouter();
  const boxRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [view, setView] = useState<{ center: Point; zoom: number }>({
    center: { lat: 48.8566, lng: 2.3522 },
    zoom: 12,
  });
  const [selected, setSelected] = useState<string | null>(null);
  const fitted = useRef(false);
  const drag = useRef<{ x: number; y: number; moved: boolean; id: number } | null>(null);
  const [dragging, setDragging] = useState(false);

  const placed = useMemo(
    () => listings.filter((l) => points[l.id]).map((l) => ({ listing: l, point: points[l.id] })),
    [listings, points],
  );

  /* --------------------------------------------------------- ölçüm ve uyum */

  useEffect(() => {
    const node = boxRef.current;
    if (!node) return;
    const observer = new ResizeObserver(([entry]) => {
      setSize({ w: entry.contentRect.width, h: entry.contentRect.height });
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (fitted.current || !size.w || !size.h || !placed.length) return;
    fitted.current = true;
    setView(fit(placed.map((p) => p.point), size.w, size.h));
  }, [size, placed]);

  /* ------------------------------------------------------------ etkileşim */

  const zoomBy = useCallback(
    (delta: number, anchorX?: number, anchorY?: number) => {
      setView((prev) => {
        const next = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, prev.zoom + delta));
        if (next === prev.zoom || !size.w) return prev;

        // İmlecin altındaki nokta yerinde kalsın
        const ax = anchorX ?? size.w / 2;
        const ay = anchorY ?? size.h / 2;
        const c = project(prev.center.lat, prev.center.lng, prev.zoom);
        const world = { x: c.x - size.w / 2 + ax, y: c.y - size.h / 2 + ay };
        const geo = unproject(world.x, world.y, prev.zoom);

        const nc = project(geo.lat, geo.lng, next);
        const center = unproject(nc.x - ax + size.w / 2, nc.y - ay + size.h / 2, next);
        return { center, zoom: next };
      });
    },
    [size],
  );

  /**
   * Kaydırma, ancak parmak/fare gerçekten birkaç piksel hareket edince
   * başlar. Aksi hâlde işaretçi yakalama, işaret ve kart tıklamalarını
   * yutar — basıyorsun, hiçbir şey olmuyor.
   */
  const DRAG_THRESHOLD = 5;

  function onPointerDown(event: React.PointerEvent) {
    if (event.button !== 0 && event.pointerType === "mouse") return;
    // Düğme ya da bağlantıya basıldıysa kaydırmaya hiç başlama
    if ((event.target as HTMLElement).closest("button, a")) return;
    drag.current = { x: event.clientX, y: event.clientY, moved: false, id: event.pointerId };
  }

  function onPointerMove(event: React.PointerEvent) {
    const start = drag.current;
    if (!start) return;

    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;

    if (!start.moved) {
      if (Math.abs(dx) < DRAG_THRESHOLD && Math.abs(dy) < DRAG_THRESHOLD) return;
      start.moved = true;
      setDragging(true);
      try {
        (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
      } catch {
        /* yoksay */
      }
    }

    drag.current = { ...start, x: event.clientX, y: event.clientY };

    setView((prev) => {
      const c = project(prev.center.lat, prev.center.lng, prev.zoom);
      return { ...prev, center: unproject(c.x - dx, c.y - dy, prev.zoom) };
    });
  }

  function onPointerUp(event: React.PointerEvent) {
    const start = drag.current;
    drag.current = null;
    setDragging(false);
    if (start?.moved) {
      try {
        (event.currentTarget as HTMLElement).releasePointerCapture(event.pointerId);
      } catch {
        /* yoksay */
      }
    }
  }

  useEffect(() => {
    const node = boxRef.current;
    if (!node) return;
    function onWheel(event: WheelEvent) {
      event.preventDefault();
      const rect = node!.getBoundingClientRect();
      zoomBy(event.deltaY < 0 ? 1 : -1, event.clientX - rect.left, event.clientY - rect.top);
    }
    node.addEventListener("wheel", onWheel, { passive: false });
    return () => node.removeEventListener("wheel", onWheel);
  }, [zoomBy]);

  /* -------------------------------------------------------------- çizim */

  const centerPx = project(view.center.lat, view.center.lng, view.zoom);
  const originX = centerPx.x - size.w / 2;
  const originY = centerPx.y - size.h / 2;
  const tileCount = 2 ** view.zoom;

  const tiles: { key: string; src: string; left: number; top: number }[] = [];
  if (size.w && size.h) {
    const firstX = Math.floor(originX / TILE);
    const lastX = Math.floor((originX + size.w) / TILE);
    const firstY = Math.max(0, Math.floor(originY / TILE));
    const lastY = Math.min(tileCount - 1, Math.floor((originY + size.h) / TILE));

    for (let ty = firstY; ty <= lastY; ty++) {
      for (let tx = firstX; tx <= lastX; tx++) {
        const wrapped = ((tx % tileCount) + tileCount) % tileCount;
        tiles.push({
          key: `${view.zoom}/${tx}/${ty}`,
          src: `https://tile.openstreetmap.org/${view.zoom}/${wrapped}/${ty}.png`,
          left: tx * TILE - originX,
          top: ty * TILE - originY,
        });
      }
    }
  }

  const active = placed.find((p) => p.listing.id === selected);

  function priceLabel(listing: ListingCardData) {
    if (listing.type === "give") return t.listing.free;
    if (listing.type === "rent" && listing.rent_price_cents !== null) {
      return formatPrice(listing.rent_price_cents, locale, listing.currency);
    }
    if (listing.type === "sell" && listing.price_cents !== null) {
      return formatPrice(listing.price_cents, locale, listing.currency);
    }
    return t.types[listing.type].short;
  }

  return (
    <div
      ref={boxRef}
      className="relative h-[clamp(24rem,68vh,44rem)] w-full touch-none overflow-hidden rounded-[var(--radius-lg)] border border-[var(--line)] bg-[var(--surface-sunken)] select-none"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      style={{ cursor: dragging ? "grabbing" : "grab" }}
    >
      {tiles.map((tile) => (
        // Harita karoları uzak sunucudan gelir; next/image burada uygun değil.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={tile.key}
          src={tile.src}
          alt=""
          width={TILE}
          height={TILE}
          draggable={false}
          className="pointer-events-none absolute"
          style={{ left: tile.left, top: tile.top }}
        />
      ))}

      {placed.map(({ listing, point }) => {
        const p = project(point.lat, point.lng, view.zoom);
        const left = p.x - originX;
        const top = p.y - originY;
        if (left < -60 || top < -60 || left > size.w + 60 || top > size.h + 60) return null;
        const isActive = listing.id === selected;

        return (
          <button
            key={listing.id}
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              // İlk dokunuş kartı açar, aynı işarete tekrar basmak ilana götürür.
              if (isActive) router.push(`/${locale}/listings/${listing.slug}`);
              else setSelected(listing.id);
            }}
            aria-label={listing.title}
            className="absolute -translate-x-1/2 -translate-y-full rounded-full px-2.5 py-1 text-[0.72rem] font-bold whitespace-nowrap shadow-[var(--shadow-card)] transition-transform hover:scale-105"
            style={{
              left,
              top,
              zIndex: isActive ? 30 : 10,
              background: isActive ? "var(--ink)" : "var(--surface-raised)",
              color: isActive ? "var(--surface-raised)" : "var(--ink)",
              border: "1px solid var(--line)",
            }}
          >
            {priceLabel(listing)}
          </button>
        );
      })}

      {active ? (
        <div className="absolute inset-x-3 bottom-3 z-40 sm:inset-x-auto sm:start-3 sm:w-72">
          <Link
            href={`/${locale}/listings/${active.listing.slug}`}
            className="flex gap-3 rounded-[var(--radius-md)] border border-[var(--line)] bg-[var(--surface-raised)] p-2.5 shadow-[var(--shadow-lift)]"
          >
            <span
              className="h-16 w-16 shrink-0 rounded-[var(--radius-sm)] bg-[var(--surface-sunken)] bg-cover bg-center"
              style={{
                backgroundImage: images[active.listing.id]
                  ? `url(${images[active.listing.id]})`
                  : undefined,
              }}
            />
            <span className="flex min-w-0 flex-col justify-center gap-0.5">
              <span className="truncate text-sm font-bold text-[var(--ink)]">
                {active.listing.title}
              </span>
              <span className="text-sm font-semibold text-[var(--brand-600)]">
                {priceLabel(active.listing)}
              </span>
              <span className="flex items-center gap-1 text-[0.75rem] text-[var(--ink-muted)]">
                {formatDistance(active.listing.distance_m, locale)}
                <Icon name="chevronRight" size={12} className="rtl:rotate-180" />
              </span>
            </span>
          </Link>
        </div>
      ) : null}

      <div className="absolute end-3 top-3 z-40 flex flex-col gap-1">
        <button
          type="button"
          onClick={() => zoomBy(1)}
          aria-label="+"
          className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-sm)] border border-[var(--line)] bg-[var(--surface-raised)] text-[var(--ink)] shadow-[var(--shadow-soft)]"
        >
          <Icon name="plus" size={16} />
        </button>
        <button
          type="button"
          onClick={() => zoomBy(-1)}
          aria-label="−"
          className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-sm)] border border-[var(--line)] bg-[var(--surface-raised)] text-[var(--ink)] shadow-[var(--shadow-soft)]"
        >
          <Icon name="minus" size={16} />
        </button>
      </div>

      <a
        href="https://www.openstreetmap.org/copyright"
        target="_blank"
        rel="noreferrer noopener"
        onClick={(event) => event.stopPropagation()}
        className="absolute end-1 bottom-1 z-40 rounded-[3px] bg-[color-mix(in_oklab,var(--surface-raised)_82%,transparent)] px-1.5 py-0.5 text-[0.62rem] text-[var(--ink-muted)]"
      >
        © OpenStreetMap
      </a>
    </div>
  );
}
