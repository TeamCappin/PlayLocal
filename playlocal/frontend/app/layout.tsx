import type { Metadata } from 'next';
import './globals.css';

import { Providers } from './providers';
import { Navigation } from '@/components/Navigation';
import { MobileBottomNav } from '@/components/MobileBottomNav';
import { MobileBottomPadding } from '@/components/MobileBottomPadding';
import { Footer } from '@/components/Footer';
import { Toaster } from '@/components/ui/sonner';

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
  return (
    <html lang="en">
      <body className={`${fontClass} bg-gray-50`}>
        <Providers>
          <Navigation />
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
