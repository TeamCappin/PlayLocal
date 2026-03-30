import type { Metadata } from 'next';
import './globals.css';

import { Providers } from './providers';
import { Navigation } from '@/components/Navigation';
import { MobileBottomNav } from '@/components/MobileBottomNav';
import { MobileBottomPadding } from '@/components/MobileBottomPadding';
import { Footer } from '@/components/Footer';
import { Toaster } from '@/components/ui/sonner';
import { GoogleAdsenseClient } from '@/components/ads/GoogleAdsenseClient';
import Script from 'next/script';

// Use system font stack so Docker build does not require network (Google Fonts fetch)
const fontClass =
  'antialiased font-sans [--font-geist-sans:ui-sans-serif,system-ui,sans-serif] [--font-geist-mono:ui-monospace,monospace]';

export const metadata: Metadata = {
  title: 'PlayLocal - Find Your Game',
  description:
    'Connect with local sports enthusiasts, organize pickup games, and build lasting friendships',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const rawAdsEnabled = process.env.NEXT_PUBLIC_ADS_ENABLED;
  const adsEnabled = rawAdsEnabled
    ? ['1', 'true', 'yes', 'y', 'on'].includes(rawAdsEnabled.toLowerCase())
    : false;

  const rawPubId = process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_PUB_ID;
  const pubId = rawPubId && rawPubId.trim() !== '' ? rawPubId.trim() : undefined;
  return (
    <html lang="en">
      <head>
        {adsEnabled && pubId ? (
          <Script
            id="google-adsense-script"
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(
              pubId
            )}`}
            crossOrigin="anonymous"  // Required for CORS when loading external scripts
            strategy="afterInteractive" // Load script after the page becomes interactive
          />
        ) : null}
      </head>
      <body className={`${fontClass} bg-gray-50`}>
        <Providers>
          <Navigation />
          <GoogleAdsenseClient />
          <main>
            {children}
            <Footer />
            <MobileBottomPadding />
          </main>
          <MobileBottomNav />
          <Toaster richColors position="top-right" />
        </Providers>
      </body>
    </html>
  );
}
