import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Providers } from "@/components/providers";
import { SiteChrome } from "@/components/site-chrome";

export const metadata: Metadata = {
  title: {
    default: "Sheggar Wheels — Peer-to-peer car rental in Addis Ababa",
    template: "%s · Sheggar Wheels",
  },
  description:
    "Sheggar Wheels is a peer-to-peer car rental marketplace for Addis Ababa. Car owners publish vehicles, set prices, and respond to booking requests; customers browse cars, request rentals, and leave reviews.",
  keywords: [
    "car rental",
    "Addis Ababa",
    "peer-to-peer",
    "marketplace",
    "Ethiopia",
    "Next.js",
    "Prisma",
    "NextAuth",
  ],
  authors: [{ name: "Sheggar Wheels Demo" }],
  openGraph: {
    title: "Sheggar Wheels",
    description:
      "Peer-to-peer car rental marketplace for Addis Ababa. Browse cars, request rentals, manage bookings, leave reviews.",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Sheggar Wheels",
    description: "Peer-to-peer car rental marketplace for Addis Ababa.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased bg-background text-foreground">
        <Providers>
          <SiteChrome>{children}</SiteChrome>
          <Toaster />
          <Sonner position="top-right" />
        </Providers>
      </body>
    </html>
  );
}