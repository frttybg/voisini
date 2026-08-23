"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { cn, listingTypeOrder } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/provider";
import { Icon, categoryIcon, type IconName } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";
import { Checkbox, FieldError, Input, Label, Select, Textarea } from "@/components/ui/Field";
import { TypeBadge } from "@/components/ui/Primitives";
import { useToast } from "@/components/ui/Overlay";
import { ImageUploader, type UploadedImage } from "./ImageUploader";
import { LocationPicker, type PickedLocation } from "./LocationPicker";
import { createListingAction } from "@/lib/actions/listings";
import type { FieldErrors } from "@/lib/validation";
import type { ItemCondition, ListingType, RentPeriod } from "@/lib/supabase/types";

const typeIcon: Record<ListingType, IconName> = {
  sell: "tag",
  give: "gift",
  lend: "clock",
  rent: "key",
  swap: "swap",
};

const CONDITIONS: ItemCondition[] = ["new", "like_new", "good", "fair", "for_parts"];
const PERIODS: RentPeriod[] = ["hour", "day", "week", "month"];
const PRECISIONS = [150, 300, 800, 1500];

export function ListingWizard({
  categories,
  defaultCity,
}: {
  categories: { slug: string; name: string }[];
  defaultCity: string | null;
}) {
  const { t, locale } = useI18n();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [errors, setErrors] = useState<FieldErrors>({});
  const [step, setStep] = useState(1);

  const [images, setImages] = useState<UploadedImage[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(categories[0]?.slug ?? "");
  const [condition, setCondition] = useState<ItemCondition>("good");
  const [type, setType] = useState<ListingType>("sell");

  const [price, setPrice] = useState("");
  const [negotiable, setNegotiable] = useState(false);
  const [rentPrice, setRentPrice] = useState("");
  const [rentPeriod, setRentPeriod] = useState<RentPeriod>("day");
  const [deposit, setDeposit] = useState("");
  const [lendFrom, setLendFrom] = useState("");
  const [lendTo, setLendTo] = useState("");
  const [lendTerms, setLendTerms] = useState("");
  const [swapWanted, setSwapWanted] = useState("");

  const [location, setLocation] = useState<PickedLocation | null>(null);
  const [precision, setPrecision] = useState(300);

  const TOTAL = 7;

  const stepTitles = [
    t.listing.photos,
    t.listing.infoTitle,
    t.listing.typeTitle,
    t.listing.detailsTitle,
    t.listing.locationTitle,
    t.listing.previewTitle,
    t.listing.publish,
  ];

  function canAdvance() {
    if (step === 2) return title.trim().length >= 3;
    if (step === 5) return Boolean(location);
    return true;
  }

  function publish() {
    const fd = new FormData();
    fd.set("type", type);
    fd.set("title", title);
    fd.set("description", description);
    fd.set("category", category);
    fd.set("condition", condition);
    fd.set("price", price);
    if (negotiable) fd.set("negotiable", "on");
    fd.set("rentPrice", rentPrice);
    fd.set("rentPeriod", rentPeriod);
    fd.set("deposit", deposit);
    fd.set("lendFrom", lendFrom);
    fd.set("lendTo", lendTo);
    fd.set("lendTerms", lendTerms);
    fd.set("swapWanted", swapWanted);
    fd.set("precision", String(precision));
    if (location) {
      fd.set("lat", String(location.lat));
      fd.set("lng", String(location.lng));
      fd.set("city", location.city || defaultCity || "");
      fd.set("postalCode", location.postcode);
    }
    images.forEach((img) => fd.append("images", img.path));

    startTransition(async () => {
      const result = await createListingAction({ ok: false }, fd);
      if (!result.ok) {
        setErrors(result.errors ?? {});
        toast(result.message === "rateLimited" ? t.errors.rateLimited : t.common.error, "error");
        if (result.errors?.title) setStep(2);
        else if (result.errors?.location) setStep(5);
        else if (result.errors?.price || result.errors?.rentPrice) setStep(4);
        return;
      }
      toast(t.listing.published, "success");
      router.push(`/${locale}/listings/${String(result.data?.slug ?? "")}`);
      router.refresh();
    });
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-5 pb-28 pt-10">
      {/* İlerleme */}
      <div className="mb-8">
        <div className="mb-2 flex items-baseline justify-between">
          <h1 className="display-sm text-[var(--ink)]">{t.listing.createTitle}</h1>
          <span className="text-[0.8125rem] font-semibold text-[var(--ink-muted)]">
            {step}/{TOTAL}
          </span>
        </div>
        <p className="mb-3 text-sm text-[var(--ink-muted)]">{stepTitles[step - 1]}</p>
        <div className="h-1.5 overflow-hidden rounded-full bg-[var(--line)]">
          <div
            className="h-full rounded-full bg-[var(--brand-600)] transition-[width] duration-500 [transition-timing-function:var(--ease-spring)]"
            style={{ width: `${(step / TOTAL) * 100}%` }}
          />
        </div>
      </div>

      <div key={step} className="animate-fade-up flex flex-col gap-6">
        {/* 1 — Fotoğraflar */}
        {step === 1 ? <ImageUploader images={images} onChange={setImages} /> : null}

        {/* 2 — Bilgiler */}
        {step === 2 ? (
          <>
            <div>
              <Label htmlFor="title" required>{t.listing.title}</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t.listing.titlePlaceholder}
                maxLength={120}
                invalid={Boolean(errors.title)}
              />
              <FieldError>{errors.title ? t.errors.tooShort : undefined}</FieldError>
            </div>
            <div>
              <Label htmlFor="description">{t.listing.description}</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t.listing.descriptionPlaceholder}
                rows={6}
                maxLength={5000}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="category">{t.listing.category}</Label>
                <Select id="category" value={category} onChange={(e) => setCategory(e.target.value)}>
                  {categories.map((c) => (
                    <option key={c.slug} value={c.slug}>
                      {c.name}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <Label htmlFor="condition">{t.listing.condition}</Label>
                <Select
                  id="condition"
                  value={condition}
                  onChange={(e) => setCondition(e.target.value as ItemCondition)}
                >
                  {CONDITIONS.map((c) => (
                    <option key={c} value={c}>
                      {t.conditions[c]}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
          </>
        ) : null}

        {/* 3 — İlan türü */}
        {step === 3 ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {listingTypeOrder.map((option) => {
              const active = type === option;
              const color = `var(--type-${option})`;
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => setType(option)}
                  className={cn(
                    "flex flex-col items-start gap-2 rounded-[var(--radius-lg)] border p-5 text-start transition-all duration-400",
                    "[transition-timing-function:var(--ease-spring)]",
                    active
                      ? "-translate-y-1 border-transparent shadow-[var(--shadow-card)]"
                      : "border-[var(--line)] hover:border-[var(--brand-300)]",
                  )}
                  style={
                    active
                      ? { background: `color-mix(in oklab, ${color} 10%, var(--surface-raised))` }
                      : undefined
                  }
                >
                  <span
                    className="flex h-11 w-11 items-center justify-center rounded-[var(--radius-md)]"
                    style={{ color, background: `color-mix(in oklab, ${color} 14%, transparent)` }}
                  >
                    <Icon name={typeIcon[option]} size={21} />
                  </span>
                  <span className="text-[1.0625rem] font-bold" style={{ color: active ? color : undefined }}>
                    {t.types[option].label}
                  </span>
                  <span className="text-[0.8125rem] leading-relaxed text-[var(--ink-muted)]">
                    {t.types[option].tagline}
                  </span>
                </button>
              );
            })}
          </div>
        ) : null}

        {/* 4 — Türe özel alanlar */}
        {step === 4 ? (
          <>
            {type === "sell" ? (
              <>
                <div>
                  <Label htmlFor="price" required>{t.listing.price} (€)</Label>
                  <Input
                    id="price"
                    type="number"
                    min={0}
                    step="0.01"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    icon="euro"
                    invalid={Boolean(errors.price)}
                  />
                  <FieldError>{errors.price ? t.common.required : undefined}</FieldError>
                </div>
                <Checkbox
                  label={t.listing.negotiable}
                  checked={negotiable}
                  onChange={(e) => setNegotiable(e.target.checked)}
                />
              </>
            ) : null}

            {type === "give" ? (
              <div className="rounded-[var(--radius-lg)] border border-[var(--line)] bg-[var(--surface-sunken)] p-5">
                <p className="flex items-center gap-2 text-[0.9375rem] font-bold text-[var(--type-give)]">
                  <Icon name="gift" size={18} />
                  {t.listing.free}
                </p>
                <p className="mt-1 text-[0.8125rem] text-[var(--ink-muted)]">
                  {t.types.give.tagline}
                </p>
              </div>
            ) : null}

            {type === "rent" ? (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="rentPrice" required>{t.listing.rentPrice} (€)</Label>
                    <Input
                      id="rentPrice"
                      type="number"
                      min={0}
                      step="0.01"
                      value={rentPrice}
                      onChange={(e) => setRentPrice(e.target.value)}
                      icon="euro"
                      invalid={Boolean(errors.rentPrice)}
                    />
                    <FieldError>{errors.rentPrice ? t.common.required : undefined}</FieldError>
                  </div>
                  <div>
                    <Label htmlFor="rentPeriod">{t.listing.rentPeriod}</Label>
                    <Select
                      id="rentPeriod"
                      value={rentPeriod}
                      onChange={(e) => setRentPeriod(e.target.value as RentPeriod)}
                    >
                      {PERIODS.map((p) => (
                        <option key={p} value={p}>
                          {t.periods[p]}
                        </option>
                      ))}
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="deposit" hint={t.common.optional}>{t.listing.deposit} (€)</Label>
                  <Input
                    id="deposit"
                    type="number"
                    min={0}
                    step="0.01"
                    value={deposit}
                    onChange={(e) => setDeposit(e.target.value)}
                    icon="shield"
                  />
                </div>
              </>
            ) : null}

            {type === "lend" ? (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="lendFrom">{t.listing.lendFrom}</Label>
                    <Input
                      id="lendFrom"
                      type="date"
                      value={lendFrom}
                      onChange={(e) => setLendFrom(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="lendTo">{t.listing.lendTo}</Label>
                    <Input
                      id="lendTo"
                      type="date"
                      value={lendTo}
                      onChange={(e) => setLendTo(e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="lendTerms" hint={t.common.optional}>{t.listing.lendTerms}</Label>
                  <Textarea
                    id="lendTerms"
                    value={lendTerms}
                    onChange={(e) => setLendTerms(e.target.value)}
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="lendDeposit" hint={t.common.optional}>{t.listing.deposit} (€)</Label>
                  <Input
                    id="lendDeposit"
                    type="number"
                    min={0}
                    step="0.01"
                    value={deposit}
                    onChange={(e) => setDeposit(e.target.value)}
                    icon="shield"
                  />
                </div>
              </>
            ) : null}

            {type === "swap" ? (
              <div>
                <Label htmlFor="swapWanted">{t.listing.swapWanted}</Label>
                <Input
                  id="swapWanted"
                  value={swapWanted}
                  onChange={(e) => setSwapWanted(e.target.value)}
                  placeholder={t.listing.swapWantedPlaceholder}
                  icon="swap"
                />
                <p className="mt-1.5 text-[0.75rem] text-[var(--ink-muted)]">
                  {t.listing.swapWantedPlaceholder}
                </p>
              </div>
            ) : null}
          </>
        ) : null}

        {/* 5 — Konum */}
        {step === 5 ? (
          <>
            <LocationPicker
              value={location}
              onChange={setLocation}
              label={t.listing.locationTitle}
              hint={t.listing.locationHint}
            />
            <FieldError>{errors.location ? t.common.required : undefined}</FieldError>

            <div>
              <Label>{t.filters.distance}</Label>
              <div className="flex flex-wrap gap-2">
                {PRECISIONS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPrecision(p)}
                    className={cn(
                      "rounded-full border px-4 py-2 text-[0.8125rem] font-semibold transition-all",
                      precision === p
                        ? "border-transparent bg-[var(--brand-600)] text-white"
                        : "border-[var(--line)] text-[var(--ink-soft)] hover:border-[var(--brand-300)]",
                    )}
                  >
                    ± {p < 1000 ? `${p} m` : `${p / 1000} km`}
                  </button>
                ))}
              </div>
              <p className="mt-2 flex items-start gap-1.5 text-[0.75rem] text-[var(--ink-muted)]">
                <Icon name="shield" size={13} className="mt-0.5 shrink-0" />
                {t.listing.locationHint}
              </p>
            </div>
          </>
        ) : null}

        {/* 6 — Önizleme */}
        {step === 6 ? (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-[var(--ink-muted)]">{t.listing.previewHint}</p>
            <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--line)] bg-[var(--surface-raised)]">
              <div className="relative aspect-[4/3] w-full bg-[var(--surface-sunken)]">
                {images[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={images[0].previewUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-[var(--ink-muted)]">
                    <Icon name={categoryIcon[category] ?? "package"} size={40} strokeWidth={1.3} />
                  </span>
                )}
                <span className="absolute start-3 top-3">
                  <TypeBadge type={type} label={t.types[type].short} size="sm" />
                </span>
              </div>
              <div className="flex flex-col gap-2 p-4">
                <h3 className="text-lg font-bold text-[var(--ink)]">
                  {title || t.listing.titlePlaceholder}
                </h3>
                <p className="text-xl font-extrabold" style={{ color: `var(--type-${type})` }}>
                  {type === "give"
                    ? t.listing.free
                    : type === "rent"
                      ? `${rentPrice || "0"} € / ${t.periods[rentPeriod]}`
                      : type === "sell"
                        ? `${price || "0"} €`
                        : t.types[type].short}
                </p>
                {description ? (
                  <p className="whitespace-pre-line text-sm text-[var(--ink-soft)]">{description}</p>
                ) : null}
                {location ? (
                  <p className="inline-flex items-center gap-1.5 text-[0.8125rem] text-[var(--ink-muted)]">
                    <Icon name="pin" size={13} />
                    {location.city || location.label}
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}

        {/* 7 — Yayınla */}
        {step === 7 ? (
          <div className="flex flex-col items-center gap-5 rounded-[var(--radius-xl)] border border-[var(--line)] bg-[var(--surface-raised)] px-6 py-12 text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--brand-50)] text-[var(--brand-600)]">
              <Icon name="sparkles" size={28} />
            </span>
            <p className="max-w-sm text-sm text-[var(--ink-muted)]">{t.listing.safety}</p>
            <Button size="xl" loading={pending} onClick={publish} magnetic>
              {pending ? t.listing.publishing : t.listing.publish}
            </Button>
          </div>
        ) : null}

        {/* Gezinme */}
        <div className="flex items-center gap-3 pt-2">
          {step > 1 ? (
            <Button variant="ghost" icon="chevronLeft" onClick={() => setStep(step - 1)} type="button">
              {t.common.back}
            </Button>
          ) : null}
          {step < TOTAL ? (
            <Button
              className="ms-auto"
              size="lg"
              iconRight="arrowRight"
              disabled={!canAdvance()}
              onClick={() => setStep(step + 1)}
              type="button"
            >
              {t.common.next}
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
