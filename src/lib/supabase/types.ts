export type ListingType = "sell" | "give" | "lend" | "rent" | "swap";
export type ListingStatus =
  | "draft" | "pending" | "active" | "reserved" | "completed" | "archived" | "removed";
export type ItemCondition = "new" | "like_new" | "good" | "fair" | "for_parts";
export type RentPeriod = "hour" | "day" | "week" | "month";
export type UserRole = "user" | "moderator" | "admin";
export type SwapOfferStatus = "pending" | "accepted" | "declined" | "countered" | "withdrawn";
export type NotificationKind =
  | "message" | "offer" | "offer_accepted" | "offer_declined" | "favorite"
  | "review" | "payment" | "rental_start" | "rental_end" | "return_reminder"
  | "deposit" | "listing_approved" | "listing_removed" | "system";

export type Profile = {
  id: string;
  username: string | null;
  display_name: string;
  bio: string | null;
  avatar_url: string | null;
  phone: string | null;
  locale: string;
  role: UserRole;
  email_verified: boolean;
  phone_verified: boolean;
  identity_verified: boolean;
  is_trusted: boolean;
  is_banned: boolean;
  onboarding_step: number;
  onboarded_at: string | null;
  city: string | null;
  region: string | null;
  postal_code: string | null;
  country: string | null;
  search_radius_m: number;
  interests: string[];
  show_distance: boolean;
  allow_messages: boolean;
  email_notifications: boolean;
  rating_avg: number;
  rating_count: number;
  listings_count: number;
  stripe_account_id: string | null;
  payouts_enabled: boolean;
  created_at: string;
};

export type Category = {
  id: string;
  slug: string;
  icon: string | null;
  color: string | null;
  sort_order: number;
  name_fr: string;
  name_tr: string;
  name_en: string;
  name_de: string;
  name_ar: string;
  name_es: string;
};

export type ListingImage = {
  id: string;
  listing_id: string;
  path: string;
  width: number | null;
  height: number | null;
  position: number;
  is_primary: boolean;
};

export type Listing = {
  id: string;
  slug: string;
  owner_id: string;
  category_id: string | null;
  type: ListingType;
  status: ListingStatus;
  title: string;
  description: string;
  condition: ItemCondition | null;
  price_cents: number | null;
  currency: string;
  is_negotiable: boolean;
  rent_price_cents: number | null;
  rent_period: RentPeriod | null;
  deposit_cents: number | null;
  min_rent_units: number | null;
  max_rent_units: number | null;
  lend_from: string | null;
  lend_to: string | null;
  lend_terms: string | null;
  swap_wanted: string[];
  city: string | null;
  postal_code: string | null;
  region: string | null;
  country: string;
  view_count: number;
  favorite_count: number;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

/** search_listings RPC'sinin döndürdüğü satır */
export type ListingCard = {
  id: string;
  slug: string;
  title: string;
  type: ListingType;
  status: ListingStatus;
  price_cents: number | null;
  rent_price_cents: number | null;
  rent_period: RentPeriod | null;
  deposit_cents: number | null;
  currency: string;
  condition: ItemCondition | null;
  city: string | null;
  postal_code: string | null;
  distance_m: number | null;
  favorite_count: number;
  created_at: string;
  published_at: string | null;
  image_path: string | null;
  category_slug: string | null;
  owner_id: string;
  owner_name: string;
  owner_avatar: string | null;
  owner_rating: number;
  owner_rating_count: number;
  owner_verified: boolean;
  total_count: number;
};

export type Conversation = {
  id: string;
  listing_id: string | null;
  buyer_id: string;
  seller_id: string;
  last_message: string | null;
  last_message_at: string | null;
  buyer_unread: number;
  seller_unread: number;
  created_at: string;
};

export type Message = {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  read_at: string | null;
  created_at: string;
};

export type NotificationRow = {
  id: string;
  user_id: string;
  kind: NotificationKind;
  title: string;
  body: string | null;
  url: string | null;
  read_at: string | null;
  created_at: string;
};

export type AdminStats = {
  users_total: number;
  users_active_30d: number;
  users_banned: number;
  listings_total: number;
  listings_active: number;
  listings_by_type: Record<string, number>;
  transactions_total: number;
  sales: number;
  rentals: number;
  swaps: number;
  gifts: number;
  reports_open: number;
  disputes_open: number;
  deposits_held: number;
  signups_7d: { day: string; n: number }[];
};

/* ------------------------------------------------- İşlem döngüsü tipleri */

export type TransactionKind = "sale" | "rental" | "loan" | "swap" | "gift";
export type TransactionStatus =
  | "requested" | "accepted" | "declined" | "cancelled"
  | "in_progress" | "awaiting_return" | "completed" | "disputed";
export type PaymentStatus =
  | "pending" | "authorized" | "captured" | "failed"
  | "refunded" | "partially_refunded" | "cancelled";
export type DepositStatus =
  | "pending" | "authorized" | "captured" | "released" | "partially_released" | "disputed";

/** my_transactions() RPC satırı */
export type DealRow = {
  id: string;
  listing_id: string;
  listing_title: string;
  listing_slug: string;
  listing_type: ListingType;
  image_path: string | null;
  kind: TransactionKind;
  status: TransactionStatus;
  amount_cents: number;
  currency: string;
  starts_at: string | null;
  ends_at: string | null;
  completed_at: string | null;
  created_at: string;
  is_buyer: boolean;
  counterpart_id: string;
  counterpart_name: string;
  counterpart_avatar: string | null;
  deposit_cents: number | null;
  deposit_status: DepositStatus | null;
  i_confirmed: boolean;
  i_rated: boolean;
  payment_status: PaymentStatus | null;
  seller_payouts_enabled: boolean;
};

/** my_swap_offers() RPC satırı */
export type SwapOfferRow = {
  id: string;
  listing_id: string;
  listing_title: string;
  listing_slug: string;
  offered_listing_id: string | null;
  offered_title: string | null;
  offered_slug: string | null;
  offered_image: string | null;
  offered_text: string | null;
  cash_adjust_cents: number;
  status: SwapOfferStatus;
  created_at: string;
  is_mine: boolean;
  sender_id: string;
  sender_name: string;
  sender_avatar: string | null;
};

/** user_ratings() RPC satırı */
export type RatingRow = {
  id: string;
  score: number;
  comment: string | null;
  created_at: string;
  rater_name: string;
  rater_avatar: string | null;
  kind: TransactionKind;
};

export type UnreadCounts = { notifications: number; messages: number };
