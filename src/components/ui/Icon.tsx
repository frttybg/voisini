import type { ReactNode, SVGProps } from "react";

/**
 * Bağımlılıksız ikon seti (satır içi SVG).
 * Tek bir bileşen + yol haritası: ağaç sarsma yerine tek küçük dosya.
 */
const paths: Record<string, ReactNode> = {
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.6-3.6" />
    </>
  ),
  pin: (
    <>
      <path d="M12 21s-7-5.5-7-11a7 7 0 1 1 14 0c0 5.5-7 11-7 11Z" />
      <circle cx="12" cy="10" r="2.6" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  minus: <path d="M5 12h14" />,
  message: <path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 9 9 0 0 1-3.9-.9L3 20.5l1.6-4.6A8.4 8.4 0 0 1 3.6 11.5a8.4 8.4 0 0 1 9-8.4 8.4 8.4 0 0 1 8.4 8.4Z" />,
  heart: <path d="M12 20.3 4.9 13.4a4.6 4.6 0 0 1 0-6.6 4.8 4.8 0 0 1 6.7 0l.4.4.4-.4a4.8 4.8 0 0 1 6.7 0 4.6 4.6 0 0 1 0 6.6Z" />,
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4.5 20a7.7 7.7 0 0 1 15 0" />
    </>
  ),
  home: <path d="M4 10.5 12 4l8 6.5V19a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 19Z" />,
  compass: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m15.2 8.8-2 4.4-4.4 2 2-4.4Z" />
    </>
  ),
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  close: <path d="m6 6 12 12M18 6 6 18" />,
  chevronDown: <path d="m6 9 6 6 6-6" />,
  chevronRight: <path d="m9 6 6 6-6 6" />,
  chevronLeft: <path d="m15 6-6 6 6 6" />,
  arrowRight: <path d="M4 12h15m-6-6 6 6-6 6" />,
  arrowUpRight: <path d="M7 17 17 7m0 0h-8m8 0v8" />,
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  star: <path d="m12 3.6 2.6 5.4 5.9.8-4.3 4.1 1 5.9-5.2-2.8-5.2 2.8 1-5.9-4.3-4.1 5.9-.8Z" />,
  shield: <path d="M12 3 5 6v6c0 4.4 2.9 7.9 7 9 4.1-1.1 7-4.6 7-9V6Z" />,
  shieldCheck: (
    <>
      <path d="M12 3 5 6v6c0 4.4 2.9 7.9 7 9 4.1-1.1 7-4.6 7-9V6Z" />
      <path d="m9 12 2 2 4-4" />
    </>
  ),
  badgeCheck: (
    <>
      <path d="m12 2.8 2.3 1.8 2.9-.2.6 2.8 2.4 1.6-1.3 2.6 1.3 2.6-2.4 1.6-.6 2.8-2.9-.2L12 21.2l-2.3-1.8-2.9.2-.6-2.8-2.4-1.6 1.3-2.6-1.3-2.6 2.4-1.6.6-2.8 2.9.2Z" />
      <path d="m9.3 12 1.9 1.9 3.5-3.7" />
    </>
  ),
  bell: (
    <>
      <path d="M18 9a6 6 0 1 0-12 0c0 5-2 6-2 6h16s-2-1-2-6" />
      <path d="M13.7 20a2 2 0 0 1-3.4 0" />
    </>
  ),
  camera: (
    <>
      <path d="M4 8.5h3l1.4-2h7.2l1.4 2h3A1.5 1.5 0 0 1 21.5 10v8a1.5 1.5 0 0 1-1.5 1.5H4A1.5 1.5 0 0 1 2.5 18v-8A1.5 1.5 0 0 1 4 8.5Z" />
      <circle cx="12" cy="13.8" r="3.4" />
    </>
  ),
  image: (
    <>
      <rect x="3" y="4.5" width="18" height="15" rx="2.5" />
      <circle cx="8.5" cy="10" r="1.6" />
      <path d="m3.5 17 4.8-4.4 4 3.5 3-2.6 5.2 4.4" />
    </>
  ),
  upload: <path d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5M4 16v2.5A1.5 1.5 0 0 0 5.5 20h13a1.5 1.5 0 0 0 1.5-1.5V16" />,
  trash: <path d="M4 7h16M9.5 7V5.5A1.5 1.5 0 0 1 11 4h2a1.5 1.5 0 0 1 1.5 1.5V7m1.5 0v12a1.5 1.5 0 0 1-1.5 1.5h-5A1.5 1.5 0 0 1 8 19V7" />,
  loader: <path d="M12 3v3.5M12 17.5V21M21 12h-3.5M6.5 12H3m14.5-6.4-2.5 2.5M8.9 15.1l-2.5 2.5m0-12 2.5 2.5m6.2 6.2 2.5 2.5" />,
  globe: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M3.5 9.5h17M3.5 14.5h17M12 3a15 15 0 0 1 0 18 15 15 0 0 1 0-18Z" />
    </>
  ),
  filter: <path d="M4 6h16l-6.4 7.4V19l-3.2 1.6v-7.2Z" />,
  grid: (
    <>
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.6" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1.6" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.6" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1.6" />
    </>
  ),
  map: <path d="M9 4 3.5 6.2v13.3L9 17.3l6 2.2 5.5-2.2V4L15 6.2Zm0 0v13.3m6-11.1v13.3" />,
  swap: <path d="M4 8h13m0 0-3.2-3.2M17 8l-3.2 3.2M20 16H7m0 0 3.2-3.2M7 16l3.2 3.2" />,
  gift: (
    <>
      <rect x="3.5" y="9" width="17" height="11" rx="1.8" />
      <path d="M3.5 13.5h17M12 9v11M12 9S9.5 9 8.4 7.9a2.4 2.4 0 0 1 3.4-3.4C12.9 5.6 12 9 12 9Zm0 0s2.5 0 3.6-1.1a2.4 2.4 0 0 0-3.4-3.4C11.1 5.6 12 9 12 9Z" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.5V12l3 1.8" />
    </>
  ),
  key: (
    <>
      <circle cx="8" cy="14" r="3.6" />
      <path d="m10.6 11.4 8-8M17 5l2 2m-3.6 1.4 2 2" />
    </>
  ),
  tag: (
    <>
      <path d="M3.8 12.6V5.4A1.6 1.6 0 0 1 5.4 3.8h7.2l7.6 7.6a1.6 1.6 0 0 1 0 2.3l-5.1 5.1a1.6 1.6 0 0 1-2.3 0Z" />
      <circle cx="8.2" cy="8.2" r="1.3" />
    </>
  ),
  sparkles: <path d="m12 3 1.7 4.4L18 9l-4.3 1.6L12 15l-1.7-4.4L6 9l4.3-1.6ZM18.5 14l.9 2.2 2.1.8-2.1.8-.9 2.2-.9-2.2-2.1-.8 2.1-.8ZM5 14l.7 1.7 1.8.6-1.8.6L5 18.6l-.7-1.7-1.8-.6 1.8-.6Z" />,
  eye: (
    <>
      <path d="M2.5 12S6 5.8 12 5.8 21.5 12 21.5 12 18 18.2 12 18.2 2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  share: <path d="M12 15V4m0 0L8 8m4-4 4 4M5 14v4.5A1.5 1.5 0 0 0 6.5 20h11a1.5 1.5 0 0 0 1.5-1.5V14" />,
  flag: <path d="M5 21V4.5m0 0c3.5-1.6 6.5 1.6 10 0V14c-3.5 1.6-6.5-1.6-10 0Z" />,
  logout: <path d="M15 5.5V4.5A1.5 1.5 0 0 0 13.5 3h-7A1.5 1.5 0 0 0 5 4.5v15A1.5 1.5 0 0 0 6.5 21h7a1.5 1.5 0 0 0 1.5-1.5v-1M10 12h11m0 0-3.5-3.5M21 12l-3.5 3.5" />,
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 14.5a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.2a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.2a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.2a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.2a1.6 1.6 0 0 0-1.4 1Z" />
    </>
  ),
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.5V5m0 14v2.5M2.5 12H5m14 0h2.5M5.6 5.6l1.8 1.8m9.2 9.2 1.8 1.8m0-12.8-1.8 1.8M7.4 16.6l-1.8 1.8" />
    </>
  ),
  moon: <path d="M20 13.5A8.5 8.5 0 1 1 10.5 4a6.8 6.8 0 0 0 9.5 9.5Z" />,
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5m0-8.2v.2" />
    </>
  ),
  alert: <path d="M12 4.5 21 19.5H3ZM12 10v4m0 2.4v.1" />,
  euro: <path d="M18 6.5A6.5 6.5 0 0 0 8.2 9m0 6A6.5 6.5 0 0 0 18 17.5M4.5 10.5h8m-8 3.5h8" />,
  send: <path d="M21 3 3 10.5l7.5 3L14 21Z" />,
  package: (
    <>
      <path d="M3.5 8 12 4l8.5 4-8.5 4Z" />
      <path d="M3.5 8v8l8.5 4 8.5-4V8M12 12v8" />
    </>
  ),
  cpu: (
    <>
      <rect x="7" y="7" width="10" height="10" rx="2" />
      <path d="M10 3.5V7m4-3.5V7m-4 10v3.5m4-3.5v3.5M3.5 10H7m-3.5 4H7m10-4h3.5m-3.5 4h3.5" />
    </>
  ),
  lamp: <path d="M9 3h6l3 7H6ZM12 10v7m-3 4h6" />,
  armchair: <path d="M5.5 11V7.5A2.5 2.5 0 0 1 8 5h8a2.5 2.5 0 0 1 2.5 2.5V11m-13 0a2 2 0 0 0 0 4v3h15v-3a2 2 0 0 0 0-4m-13 0v4h13v-4M7 18v2m10-2v2" />,
  shirt: <path d="m8 3 4 2 4-2 4.5 3-2 3.5-1.5-.8V21h-10V8.7L5.5 9.5l-2-3.5Z" />,
  baby: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M9.3 10v.2m5.4-.2v.2M9.5 14.5a4 4 0 0 0 5 0" />
    </>
  ),
  bike: (
    <>
      <circle cx="6" cy="16.5" r="3.5" />
      <circle cx="18" cy="16.5" r="3.5" />
      <path d="m6 16.5 4-8h5m-3.5 8L15 9m0 0 2 2m-2-2h3" />
    </>
  ),
  book: <path d="M5 4.5h9A2.5 2.5 0 0 1 16.5 7v13H7.5A2.5 2.5 0 0 1 5 17.5Zm11.5 2.5H19v13m-2.5 0H19" />,
  car: <path d="M4 15v3h2.5v-3m11 0v3H20v-3M3.5 15v-3.2L5.4 7h13.2l1.9 4.8V15Zm3-1.5h.1m10.9 0h.1" />,
  sprout: <path d="M12 21v-7m0 0c0-3-2.5-5.5-5.5-5.5H4v1.5C4 13 6.5 14 9 14Zm0 0c0-3.5 2.5-6 6-6h2v2c0 3-2.5 5-6 5Z" />,
  palette: (
    <>
      <path d="M12 3.5a8.5 8.5 0 0 0 0 17c1.4 0 2-1 2-2s-.6-1.5-.6-2.3c0-.8.7-1.4 1.6-1.4h1.4A4.6 4.6 0 0 0 21 10.2C21 6.4 17 3.5 12 3.5Z" />
      <circle cx="8" cy="10" r="1" />
      <circle cx="12" cy="7.5" r="1" />
      <circle cx="16" cy="10" r="1" />
    </>
  ),
  gem: <path d="m5 4.5h14l3 5-10 11-10-11ZM2.5 9.5h19M8.5 4.5 6 9.5l6 10 6-10-2.5-5" />,
  wrench: <path d="M15.5 4.5a5 5 0 0 0-6.2 6.4L4 16.2a2 2 0 1 0 2.8 2.8l5.3-5.3a5 5 0 0 0 6.4-6.2L16 10l-2.5-.5L13 7Z" />,
};

export type IconName = keyof typeof paths;

export function Icon({
  name,
  size = 20,
  strokeWidth = 1.75,
  fill = "none",
  ...rest
}: {
  name: IconName;
  size?: number;
  strokeWidth?: number;
  fill?: string;
} & Omit<SVGProps<SVGSVGElement>, "name" | "fill" | "strokeWidth" | "width" | "height">) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill={fill}
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      {paths[name]}
    </svg>
  );
}

/** Kategori slug'ından ikon adına eşleme */
export const categoryIcon: Record<string, IconName> = {
  electronics: "cpu",
  home: "lamp",
  furniture: "armchair",
  fashion: "shirt",
  kids: "baby",
  sports: "bike",
  books: "book",
  vehicles: "car",
  garden: "sprout",
  hobby: "palette",
  collectibles: "gem",
  tools: "wrench",
  other: "package",
};
