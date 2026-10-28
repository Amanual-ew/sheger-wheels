import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Providers } from "@/components/providers";
import { SiteChrome } from "@/components/site-chrome";

export const metadata: Metadata = {
  metadataBase: new URL("https://sheger-wheels-mu.vercel.app"),
  applicationName: "Sheggar Wheels",
  title: {
    default: "Sheggar Wheels | Peer-to-peer car rental in Addis Ababa",
    template: "%s | Sheggar Wheels",
  },
  description:
    "Find trusted cars for rent in Addis Ababa through Sheggar Wheels. Browse listings, request bookings, and manage rentals with a secure peer-to-peer car marketplace.",
  keywords: [
    "car rental Addis Ababa",
    "peer-to-peer car rental",
    "Ethiopia car rental",
    "rent a car in Addis",
    "Sheggar Wheels",
    "car marketplace",
    "book a car in Addis Ababa",
  ],
  authors: [{ name: "Sheggar Wheels" }],
  creator: "Sheggar Wheels",
  publisher: "Sheggar Wheels",
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
  siteName: "Sheggar Wheels",
  title: "Sheggar Wheels | Peer-to-peer car rental in Addis Ababa",
  description:
    "Browse trusted rental cars, request bookings, and manage your rides in Addis Ababa with Sheggar Wheels.",
  type: "website",
  locale: "en_ET",
  url: "https://sheger-wheels-mu.vercel.app/",
  images: [
    {
      url: "/sheger-wheels-og.png",
      width: 1200,
      height: 630,
      alt: "Sheggar Wheels peer-to-peer car rental in Addis Ababa, Ethiopia",
    },
  ],
},
twitter: {
  card: "summary_large_image",
  title: "Sheggar Wheels | Peer-to-peer car rental in Addis Ababa",
  description:
    "Browse verified cars, request rentals, and manage bookings in Addis Ababa.",
  creator: "@shegerwheels",
  images: ["/sheger-wheels-og.png"],
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