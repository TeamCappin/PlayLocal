'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { getAdsRuntimeConfig, isAdsAllowedForPathname } from './adsConfig';

declare global {
  interface Window {
    adsbygoogle?: any[];
  }
}

const ADSENSE_SCRIPT_ID = 'google-adsense-script';
const DEFAULT_PAGE_LEVEL_MIN_HEIGHT_PX = 120;
const DEFAULT_SLOT_MIN_HEIGHT_PX = 250;

function ensureAdsenseScript(pubId: string): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      resolve();
      return;
    }

    const existing = document.getElementById(ADSENSE_SCRIPT_ID) as
      | HTMLScriptElement
      | null;

    const src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(
      pubId
    )}`;

    if (existing) {
      // Script is already present in the DOM (e.g. injected from SSR layout).
      // We resolve immediately; queued `adsbygoogle.push(...)` calls will
      // typically be processed once the script finishes loading.
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.id = ADSENSE_SCRIPT_ID;
    script.async = true;
    script.src = src;
    script.crossOrigin = 'anonymous';

    script.addEventListener(
      'load',
      () => {
        script.dataset.loaded = 'true';
        resolve();
      },
      { once: true }
    );

    script.addEventListener(
      'error',
      () => {
        // Never block the page due to a failed third-party script.
        resolve();
      },
      { once: true }
    );

    document.head.appendChild(script);
  });
}

function pushPageLevelAds(pubId: string) {
  // Standard "page-level / auto" snippet pattern.
  try {
    window.adsbygoogle = window.adsbygoogle || [];
    window.adsbygoogle.push({
      google_ad_client: pubId,
      enable_page_level_ads: true,
    });
  } catch {
    // Swallow errors to avoid breaking UX.
  }
}

function pushAdIns() {
  // Standard manual ad slot push after `<ins class="adsbygoogle" .../>`
  // is present in the DOM.
  try {
    window.adsbygoogle = window.adsbygoogle || [];
    window.adsbygoogle.push({});
  } catch {
    // Swallow errors to avoid breaking UX.
  }
}

export function GoogleAdsenseClient() {
  const pathname = usePathname();
  const cfg = getAdsRuntimeConfig();
  const allowed =
    !!cfg.enabled &&
    !!cfg.pubId &&
    isAdsAllowedForPathname(pathname || '/', cfg.includeSensitive);

  const [scriptReady, setScriptReady] = useState(false);
  const lastAdRequestPathRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!allowed || !cfg.pubId) return;

      await ensureAdsenseScript(cfg.pubId);
      if (!cancelled) setScriptReady(true);
    }

    run();

    return () => {
      cancelled = true;
    };
  }, [allowed, cfg.pubId]);

  useEffect(() => {
    // Only push after the script is present and we know the route is allowed.
    if (!allowed || !scriptReady || !cfg.pubId) return;

    // Avoid duplicate requests when React re-runs effects.
    if (lastAdRequestPathRef.current === pathname) return;

    if (cfg.adSlotId) {
      pushAdIns();
      lastAdRequestPathRef.current = pathname || null;
      return;
    }

    // If no explicit ad slot id is configured, rely on page-level ads.
    if (cfg.enablePageLevelAds) {
      pushPageLevelAds(cfg.pubId);
      lastAdRequestPathRef.current = pathname || null;
    }
  }, [
    allowed,
    cfg.adSlotId,
    cfg.enablePageLevelAds,
    cfg.pubId,
    scriptReady,
    pathname,
  ]);

  if (!allowed || !cfg.pubId) return null;

  return (
    <div
      className="w-full flex justify-center px-4"
      aria-hidden="true"
      style={{ minHeight: cfg.adSlotId ? DEFAULT_SLOT_MIN_HEIGHT_PX : DEFAULT_PAGE_LEVEL_MIN_HEIGHT_PX }}
    >
      {cfg.adSlotId ? (
        <div className="w-full max-w-4xl">
          <ins
            key={pathname}
            className="adsbygoogle"
            style={{ display: 'block' }}
            data-ad-client={cfg.pubId}
            data-ad-slot={cfg.adSlotId}
            data-ad-format="auto"
            data-full-width-responsive="true"
          />
        </div>
      ) : (
        <div className="w-full max-w-4xl" />
      )}
    </div>
  );
}

