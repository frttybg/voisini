"use client";

import { Suspense, useActionState, useState } from "react";
import { useI18n } from "@/lib/i18n/provider";
import { cn, formatDate, formatRelativeTime } from "@/lib/utils";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";
import { Checkbox, Input, Label, Textarea } from "@/components/ui/Field";
import { Avatar, Badge, EmptyState, Rating } from "@/components/ui/Primitives";
import { ListingCard } from "@/components/listings/ListingCard";
import { PayoutsSection } from "./PayoutsSection";
import { updateProfileAction } from "@/lib/actions/profile";
import { idleState } from "@/lib/actions/state";
import type { ListingCard as ListingCardData, RatingRow } from "@/lib/supabase/types";

type ProfileView = {
  id: string;
  displayName: string;
  bio: string;
  avatarUrl: string | null;
  city: string | null;
  role: string;
  ratingAvg: number;
  ratingCount: number;
  createdAt: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  identityVerified: boolean;
  showDistance: boolean;
  allowMessages: boolean;
  emailNotifications: boolean;
  payoutsEnabled: boolean;
  hasPayoutAccount: boolean;
};

export function ProfilePanel({
  profile,
  listings,
  ratings,
  images,
  paymentsEnabled,
  signOut,
  logoutLabel,
}: {
  profile: ProfileView;
  listings: ListingCardData[];
  ratings: RatingRow[];
  images: Record<string, string | null>;
  paymentsEnabled: boolean;
  signOut: () => Promise<void>;
  logoutLabel: string;
}) {
  const { t, locale } = useI18n();
  const [tab, setTab] = useState<"listings" | "ratings" | "settings">("listings");
  const [state, formAction, pending] = useActionState(updateProfileAction, idleState);

  const activeCount = listings.filter((l) => l.status === "active").length;

  return (
    <div className="mx-auto w-full max-w-[1240px] px-5 pb-24 pt-10 sm:px-8">
      <header className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-center">
        <Avatar
          src={profile.avatarUrl}
          name={profile.displayName}
          size={72}
          verified={profile.emailVerified && (profile.phoneVerified || profile.identityVerified)}
        />
        <div className="min-w-0 flex-1">
          <h1 className="display-sm truncate text-[var(--ink)]">{profile.displayName}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-3 text-[0.8125rem] text-[var(--ink-muted)]">
            <Rating value={profile.ratingAvg} count={profile.ratingCount} />
            {profile.city ? (
              <span className="inline-flex items-center gap-1">
                <Icon name="pin" size={13} />
                {profile.city}
              </span>
            ) : null}
            <span>
              {t.listing.memberSince} {formatDate(profile.createdAt, locale)}
            </span>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {profile.emailVerified ? (
              <Badge tone="brand" size="sm" icon="badgeCheck">
                e-mail
              </Badge>
            ) : null}
            {profile.phoneVerified ? (
              <Badge tone="brand" size="sm" icon="badgeCheck">
                SMS
              </Badge>
            ) : null}
            {profile.role !== "user" ? (
              <Badge tone="accent" size="sm" icon="shield">
                {profile.role}
              </Badge>
            ) : null}
          </div>
        </div>
        <div className="flex gap-2">
          <Button href={`/${locale}/new`} icon="plus">
            {t.nav.addListing}
          </Button>
          {profile.role === "admin" || profile.role === "moderator" ? (
            <Button href={`/${locale}/admin`} variant="outline" icon="shield">
              {t.nav.admin}
            </Button>
          ) : null}
        </div>
      </header>

      <div className="mb-6 flex gap-1 border-b border-[var(--line)]">
        {(
          [
            ["listings", `${t.nav.myListings} (${activeCount})`],
            ["ratings", `${t.rating.received} (${profile.ratingCount})`],
            ["settings", t.nav.settings],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={cn(
              "-mb-px border-b-2 px-4 py-3 text-sm font-semibold transition-colors",
              tab === key
                ? "border-[var(--brand-600)] text-[var(--ink)]"
                : "border-transparent text-[var(--ink-muted)] hover:text-[var(--ink-soft)]",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "listings" ? (
        listings.length ? (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {listings.map((listing) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                imageUrl={images[listing.id] ?? null}
                canFavorite={false}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon="package"
            title={t.common.emptyTitle}
            text={t.sections.shareText}
            action={
              <Button href={`/${locale}/new`} icon="plus">
                {t.nav.addListing}
              </Button>
            }
          />
        )
      ) : tab === "ratings" ? (
        ratings.length ? (
          <ul className="flex max-w-2xl flex-col gap-3">
            {ratings.map((rating) => (
              <li
                key={rating.id}
                className="flex gap-3 rounded-[var(--radius-lg)] border border-[var(--line)] bg-[var(--surface-raised)] p-4"
              >
                <Avatar src={rating.rater_avatar} name={rating.rater_name} size={40} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2">
                    <span className="truncate font-bold text-[var(--ink)]">{rating.rater_name}</span>
                    <span className="ms-auto shrink-0 text-[0.75rem] text-[var(--ink-muted)]">
                      {formatRelativeTime(rating.created_at, locale)}
                    </span>
                  </div>
                  <div className="my-1 flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Icon
                        key={n}
                        name="star"
                        size={13}
                        fill={n <= rating.score ? "var(--warning)" : "none"}
                        strokeWidth={n <= rating.score ? 0 : 1.5}
                        className={n <= rating.score ? "text-[var(--warning)]" : "text-[var(--line)]"}
                      />
                    ))}
                  </div>
                  {rating.comment ? (
                    <p className="text-[0.875rem] leading-relaxed text-[var(--ink-soft)]">
                      {rating.comment}
                    </p>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState icon="star" title={t.rating.none} text={t.trust.ratingsText} />
        )
      ) : (
        <div className="max-w-xl">
          <form action={formAction} className="flex flex-col gap-5">
            <input type="hidden" name="locale" value={locale} />
            <div>
              <Label htmlFor="displayName" required>
                {t.auth.displayName}
              </Label>
              <Input id="displayName" name="displayName" defaultValue={profile.displayName} icon="user" />
            </div>
            <div>
              <Label htmlFor="bio">{t.listing.description}</Label>
              <Textarea id="bio" name="bio" defaultValue={profile.bio} rows={4} />
            </div>

            <fieldset className="flex flex-col gap-3 rounded-[var(--radius-lg)] border border-[var(--line)] p-4">
              <legend className="px-2 text-[0.75rem] font-bold uppercase tracking-[0.1em] text-[var(--ink-muted)]">
                {t.nav.settings}
              </legend>
              <Checkbox
                name="showDistance"
                defaultChecked={profile.showDistance}
                label={t.listing.locationHint}
              />
              <Checkbox
                name="allowMessages"
                defaultChecked={profile.allowMessages}
                label={t.nav.messages}
              />
              <Checkbox
                name="emailNotifications"
                defaultChecked={profile.emailNotifications}
                label={t.auth.email}
              />
            </fieldset>

            {state.ok ? (
              <p className="flex items-center gap-2 text-sm text-[var(--success)]">
                <Icon name="check" size={15} />
                {t.common.saved}
              </p>
            ) : null}

            <div className="flex items-center gap-3">
              <Button type="submit" loading={pending}>
                {t.common.save}
              </Button>
            </div>
          </form>

          <div className="mt-8">
            <Suspense fallback={null}>
              <PayoutsSection
                enabled={paymentsEnabled}
                payoutsEnabled={profile.payoutsEnabled}
                hasAccount={profile.hasPayoutAccount}
              />
            </Suspense>
          </div>

          <form action={signOut} className="mt-10 border-t border-[var(--line)] pt-6">
            <Button type="submit" variant="ghost" icon="logout">
              {logoutLabel}
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}
