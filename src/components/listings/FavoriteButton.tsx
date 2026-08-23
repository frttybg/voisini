"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/ui/Icon";
import { useToast } from "@/components/ui/Overlay";
import { useI18n } from "@/lib/i18n/provider";
import { toggleFavoriteAction } from "@/lib/actions/listings";

export function FavoriteButton({
  listingId,
  initial,
  size = 36,
}: {
  listingId: string;
  initial: boolean;
  size?: number;
}) {
  const [favorited, setFavorited] = useState(initial);
  const [pending, startTransition] = useTransition();
  const { toast } = useToast();
  const { t, locale } = useI18n();
  const router = useRouter();

  function toggle() {
    const next = !favorited;
    setFavorited(next);
    startTransition(async () => {
      const result = await toggleFavoriteAction(listingId);
      if (!result.ok) {
        setFavorited(!next);
        if (result.message === "forbidden") {
          router.push(`/${locale}/login`);
        } else {
          toast(t.common.error, "error");
        }
      }
    });
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      aria-pressed={favorited}
      aria-label={t.nav.favorites}
      style={{ width: size, height: size }}
      className={cn(
        "flex items-center justify-center rounded-full backdrop-blur-md transition-all duration-300",
        "[transition-timing-function:var(--ease-spring)] active:scale-90",
        favorited
          ? "bg-[var(--accent-500)] text-white shadow-[var(--shadow-soft)]"
          : "bg-[color-mix(in_oklab,var(--surface-raised)_78%,transparent)] text-[var(--ink-soft)] hover:text-[var(--accent-500)]",
      )}
    >
      <Icon
        name="heart"
        size={size * 0.48}
        fill={favorited ? "currentColor" : "none"}
        strokeWidth={favorited ? 0 : 1.9}
      />
    </button>
  );
}
