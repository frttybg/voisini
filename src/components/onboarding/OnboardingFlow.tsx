"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/provider";
import { Icon, categoryIcon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";
import { FieldError, Input, Label, Textarea } from "@/components/ui/Field";
import { LocationPicker, type PickedLocation } from "@/components/listings/LocationPicker";
import { saveOnboardingStepAction } from "@/lib/actions/profile";
import type { FieldErrors } from "@/lib/validation";

const RADII = [1000, 5000, 10000, 25000, 50000];

export function OnboardingFlow({
  initialStep,
  displayName,
  categories,
  emailVerified,
}: {
  initialStep: number;
  displayName: string;
  categories: { slug: string; name: string; color: string | null }[];
  emailVerified: boolean;
}) {
  const { t, locale } = useI18n();
  const router = useRouter();
  const [step, setStep] = useState(Math.min(Math.max(initialStep, 1), 5));
  const [errors, setErrors] = useState<FieldErrors>({});
  const [pending, startTransition] = useTransition();

  const [name, setName] = useState(displayName);
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState<PickedLocation | null>(null);
  const [radius, setRadius] = useState(10000);
  const [interests, setInterests] = useState<string[]>([]);

  const total = 5;

  function save(nextStep: number, extra?: (fd: FormData) => void) {
    const fd = new FormData();
    fd.set("step", String(nextStep - 1));
    fd.set("displayName", name);
    fd.set("username", username);
    fd.set("bio", bio);
    if (location) {
      fd.set("lat", String(location.lat));
      fd.set("lng", String(location.lng));
      fd.set("city", location.city);
      fd.set("postalCode", location.postcode);
    }
    fd.set("radius", String(radius));
    interests.forEach((i) => fd.append("interests", i));
    extra?.(fd);

    startTransition(async () => {
      const result = await saveOnboardingStepAction({ ok: false }, fd);
      if (!result.ok) {
        setErrors(result.errors ?? {});
        return;
      }
      setErrors({});
      if (nextStep > total) {
        router.push(`/${locale}/listings`);
        router.refresh();
      } else {
        setStep(nextStep);
      }
    });
  }

  const stepTitles = [
    { title: t.onboarding.profileTitle, text: t.onboarding.profileText },
    { title: t.onboarding.locationTitle, text: t.onboarding.locationText },
    { title: t.onboarding.interestsTitle, text: t.onboarding.interestsText },
    { title: t.onboarding.verifyTitle, text: t.onboarding.verifyText },
    { title: t.onboarding.doneTitle, text: t.onboarding.doneText },
  ];

  return (
    <div className="mx-auto w-full max-w-xl px-5 py-14">
      <div className="mb-8">
        <div className="mb-3 flex items-center justify-between text-[0.8125rem] font-semibold text-[var(--ink-muted)]">
          <span>
            {t.onboarding.step} {step} {t.onboarding.of} {total}
          </span>
          {step < total ? (
            <button
              type="button"
              onClick={() => save(step + 1)}
              className="hover:text-[var(--ink)]"
            >
              {t.onboarding.skip}
            </button>
          ) : null}
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-[var(--line)]">
          <div
            className="h-full rounded-full bg-[var(--brand-600)] transition-[width] duration-500 [transition-timing-function:var(--ease-spring)]"
            style={{ width: `${(step / total) * 100}%` }}
          />
        </div>
      </div>

      <h1 className="display-sm mb-1 text-[var(--ink)]">{stepTitles[step - 1].title}</h1>
      <p className="mb-7 text-sm text-[var(--ink-muted)]">{stepTitles[step - 1].text}</p>

      <div key={step} className="animate-fade-up flex flex-col gap-5">
        {step === 1 ? (
          <>
            <div>
              <Label htmlFor="ob-name" required>{t.auth.displayName}</Label>
              <Input id="ob-name" value={name} onChange={(e) => setName(e.target.value)} icon="user" />
              <FieldError>{errors.displayName ? t.errors.tooShort : undefined}</FieldError>
            </div>
            <div>
              <Label htmlFor="ob-username" hint={t.common.optional}>@</Label>
              <Input
                id="ob-username"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase())}
                placeholder="voisin_paris"
              />
              <FieldError>{errors.username ? t.common.error : undefined}</FieldError>
            </div>
            <div>
              <Label htmlFor="ob-bio" hint={t.common.optional}>{t.listing.description}</Label>
              <Textarea id="ob-bio" value={bio} onChange={(e) => setBio(e.target.value)} rows={3} />
            </div>
          </>
        ) : null}

        {step === 2 ? (
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
                {RADII.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRadius(r)}
                    className={cn(
                      "rounded-full border px-4 py-2 text-[0.8125rem] font-semibold transition-all",
                      radius === r
                        ? "border-transparent bg-[var(--brand-600)] text-white"
                        : "border-[var(--line)] text-[var(--ink-soft)] hover:border-[var(--brand-300)]",
                    )}
                  >
                    {r / 1000} km
                  </button>
                ))}
              </div>
            </div>
          </>
        ) : null}

        {step === 3 ? (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {categories.map((cat) => {
              const active = interests.includes(cat.slug);
              return (
                <button
                  key={cat.slug}
                  type="button"
                  onClick={() =>
                    setInterests((prev) =>
                      active ? prev.filter((s) => s !== cat.slug) : [...prev, cat.slug],
                    )
                  }
                  className={cn(
                    "flex items-center gap-2.5 rounded-[var(--radius-md)] border p-3 text-start text-[0.8125rem] font-semibold transition-all duration-300",
                    active
                      ? "border-[var(--brand-400)] bg-[var(--brand-50)] text-[var(--brand-700)]"
                      : "border-[var(--line)] text-[var(--ink-soft)] hover:border-[var(--brand-300)]",
                  )}
                >
                  <Icon name={categoryIcon[cat.slug] ?? "package"} size={17} />
                  <span className="truncate">{cat.name}</span>
                  {active ? <Icon name="check" size={14} className="ms-auto" /> : null}
                </button>
              );
            })}
          </div>
        ) : null}

        {step === 4 ? (
          <div className="flex flex-col gap-3">
            <VerifyRow
              done={emailVerified}
              title={t.auth.email}
              text={emailVerified ? t.trust.verified : t.auth.checkEmailText}
            />
            <VerifyRow done={false} title="SMS" text={t.onboarding.verifyText} soon />
            <VerifyRow done={false} title="ID" text={t.trust.verifiedText} soon />
          </div>
        ) : null}

        {step === 5 ? (
          <div className="flex flex-col items-center gap-4 py-6 text-center">
            <span className="flex h-20 w-20 items-center justify-center rounded-full bg-[var(--brand-50)] text-[var(--brand-600)]">
              <Icon name="sparkles" size={34} />
            </span>
            <p className="text-sm text-[var(--ink-muted)]">{t.onboarding.doneText}</p>
          </div>
        ) : null}

        <div className="mt-3 flex items-center gap-3">
          {step > 1 ? (
            <Button variant="ghost" onClick={() => setStep(step - 1)} type="button">
              {t.common.back}
            </Button>
          ) : null}
          <Button
            className="ms-auto"
            size="lg"
            loading={pending}
            onClick={() => save(step + 1)}
            type="button"
            iconRight={step === total ? undefined : "arrowRight"}
          >
            {step === total ? t.onboarding.startExploring : t.common.next}
          </Button>
        </div>
      </div>
    </div>
  );
}

function VerifyRow({
  done,
  title,
  text,
  soon,
}: {
  done: boolean;
  title: string;
  text: string;
  soon?: boolean;
}) {
  return (
    <div className="flex items-start gap-3 rounded-[var(--radius-md)] border border-[var(--line)] p-4">
      <span
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
          done ? "bg-[var(--brand-50)] text-[var(--brand-600)]" : "bg-[var(--surface-sunken)] text-[var(--ink-muted)]",
        )}
      >
        <Icon name={done ? "badgeCheck" : "shield"} size={18} />
      </span>
      <span className="min-w-0">
        <span className="block text-[0.9375rem] font-bold text-[var(--ink)]">{title}</span>
        <span className="block text-[0.8125rem] text-[var(--ink-muted)]">{text}</span>
      </span>
      {soon ? (
        <span className="ms-auto shrink-0 rounded-full bg-[var(--surface-sunken)] px-2 py-1 text-[0.6875rem] font-semibold text-[var(--ink-muted)]">
          ⏳
        </span>
      ) : null}
    </div>
  );
}
