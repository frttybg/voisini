import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import BottomNav from "./components/BottomNav"; // Alt menüyü projeye dahil ediyoruz

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "voisini.com — Komşular Arası Paylaşım Platformu",
  description: "Yakınındaki insanlarla paylaş, sat, kirala, ödünç ver veya takas et.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased pb-16 md:pb-0`}
      >
        {/* Tüm sayfalar buraya yüklenir */}
        {children}

        {/* Mobil cihazlarda her sayfada altta görünecek menü */}
        <BottomNav />
      </body>
    </html>
  );
}