import { redirect } from "next/navigation";
import { isLocale, type Locale } from "@/lib/i18n";
import { getCurrentProfile } from "@/lib/supabase/server";
import { fetchDeals, fetchMyDisputes, fetchSwapOffers } from "@/lib/actions/transactions";
import { imageUrl } from "@/lib/data/listings";
import { DealsPanel } from "@/components/deals/DealsPanel";

export const dynamic = "force-dynamic";

export default async function DealsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale: raw } = await params;
  const sp = await searchParams;
  const paymentResult = Array.isArray(sp.payment) ? sp.payment[0] : sp.payment;
  const locale = (isLocale(raw) ? raw : "fr") as Locale;

  const profile = await getCurrentProfile();
  if (!profile) redirect(`/${locale}/login?next=/${locale}/deals`);

  const [deals, offers, disputes] = await Promise.all([
    fetchDeals(),
    fetchSwapOffers(),
    fetchMyDisputes(),
  ]);

  const images = Object.fromEntries(deals.map((d) => [d.id, imageUrl(d.image_path)]));
  const offerImages = Object.fromEntries(
    offers.map((o) => [o.id, imageUrl(o.offered_image)]),
  );

  return (
    <DealsPanel
      deals={deals}
      offers={offers}
      images={images}
      offerImages={offerImages}
      paymentResult={paymentResult ?? null}
      disputes={disputes}
    />
  );
}
