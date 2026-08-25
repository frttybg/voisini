import { redirect } from "next/navigation";
import { getDictionary, isLocale, type Locale } from "@/lib/i18n";
import { getCurrentProfile } from "@/lib/supabase/server";
import { getUserListings, imageUrl } from "@/lib/data/listings";
import { fetchUserRatings } from "@/lib/actions/transactions";
import { signOutAction } from "@/lib/actions/auth";
import { ProfilePanel } from "@/components/profile/ProfilePanel";
import { DangerZone } from "@/components/profile/DangerZone";
import { paymentsEnabled } from "@/lib/payments";

export const dynamic = "force-dynamic";

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale = (isLocale(raw) ? raw : "fr") as Locale;
  const t = getDictionary(locale);

  const profile = await getCurrentProfile();
  if (!profile) redirect(`/${locale}/login?next=/${locale}/profile`);

  const [listings, ratings] = await Promise.all([
    getUserListings(profile.id),
    fetchUserRatings(profile.id),
  ]);
  const images = Object.fromEntries(listings.map((l) => [l.id, imageUrl(l.image_path)]));

  const signOut = signOutAction.bind(null, locale);

  return (
    <>
      <ProfilePanel
      profile={{
        id: profile.id,
        displayName: profile.display_name,
        bio: profile.bio ?? "",
        avatarUrl: profile.avatar_url,
        city: profile.city,
        role: profile.role,
        ratingAvg: profile.rating_avg,
        ratingCount: profile.rating_count,
        createdAt: profile.created_at,
        emailVerified: profile.email_verified,
        phoneVerified: profile.phone_verified,
        identityVerified: profile.identity_verified,
        showDistance: profile.show_distance,
        allowMessages: profile.allow_messages,
        emailNotifications: profile.email_notifications,
        payoutsEnabled: Boolean(profile.payouts_enabled),
        hasPayoutAccount: Boolean(profile.stripe_account_id),
      }}
      listings={listings}
      ratings={ratings}
      images={images}
      paymentsEnabled={paymentsEnabled}
        signOut={signOut}
        logoutLabel={t.nav.logout}
      />

      <div className="mx-auto w-full max-w-3xl px-5 pb-24 sm:px-8">
        <DangerZone locale={locale} deletionPending={Boolean(profile.deleted_at)} />
      </div>
    </>
  );
}
