import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const LOGO_URL =
  "https://res.cloudinary.com/dkj22lm1g/image/upload/v1771081619/FalconStream-Pro_jqpcgb.webp";
const LOGO_PNG_180 =
  "https://res.cloudinary.com/dkj22lm1g/image/upload/w_180,h_180,c_fit/v1771081619/FalconStream-Pro_jqpcgb.png";
const LOGO_PNG_32 =
  "https://res.cloudinary.com/dkj22lm1g/image/upload/w_32,h_32,c_fit/v1771081619/FalconStream-Pro_jqpcgb.png";
const LOGO_PNG_16 =
  "https://res.cloudinary.com/dkj22lm1g/image/upload/w_16,h_16,c_fit/v1771081619/FalconStream-Pro_jqpcgb.png";
const SITE_URL = "https://falconstream-pro.github.io";
const SITE_NAME = "FalconStream Pro";
const SITE_DESCRIPTION =
  "A modern, web-based M3U playlist player for streaming live content directly in your browser. Upload M3U/M3U8 playlists, browse preset channels, and enjoy seamless HLS streaming with dark mode, favorites, and picture-in-picture support.";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "FalconStream Pro - M3U Stream Player",
    template: "%s | FalconStream Pro",
  },
  description: SITE_DESCRIPTION,
  keywords: [
    "M3U player",
    "M3U8 player",
    "IPTV player",
    "HLS streaming",
    "live TV",
    "stream player",
    "web player",
    "FalconStream Pro",
  ],
  authors: [{ name: "FalconStream Pro" }],
  creator: "FalconStream Pro",
  publisher: "FalconStream Pro",
  applicationName: SITE_NAME,
  generator: "Next.js",
  referrer: "origin-when-cross-origin",
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
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: LOGO_PNG_32, sizes: "32x32", type: "image/png" },
      { url: LOGO_PNG_16, sizes: "16x16", type: "image/png" },
    ],
    apple: [{ url: LOGO_PNG_180, sizes: "180x180", type: "image/png" }],
  },
  manifest: "/manifest.json",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: "FalconStream Pro - M3U Stream Player",
    description: SITE_DESCRIPTION,
    images: [
      {
        url: LOGO_URL,
        width: 1200,
        height: 630,
        alt: "FalconStream Pro Logo",
        type: "image/webp",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "FalconStream Pro - M3U Stream Player",
    description: SITE_DESCRIPTION,
    images: [LOGO_URL],
  },
  alternates: {
    canonical: SITE_URL,
  },
  category: "technology",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: SITE_NAME,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    applicationCategory: "MultimediaApplication",
    operatingSystem: "Web",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    image: LOGO_URL,
  };

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preload" href={LOGO_URL} as="image" type="image/webp" />
        <link rel="preconnect" href="https://res.cloudinary.com" />
        <link rel="dns-prefetch" href="https://res.cloudinary.com" />
        <meta
          name="theme-color"
          content="#0a0a0a"
          media="(prefers-color-scheme: dark)"
        />
        <meta
          name="theme-color"
          content="#ffffff"
          media="(prefers-color-scheme: light)"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={`${geistSans.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
