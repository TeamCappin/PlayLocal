'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { getAdsRuntimeConfig, isAdsAllowedForPathname } from './adsConfig';
import { featureFlagsApi, getAuthToken, privacyApi } from '@/lib/api';

declare global {
  interface Window {
    adsbygoogle?: any[];
  }
}

const ADSENSE_SCRIPT_ID = 'google-adsense-script';
const DEFAULT_SLOT_MIN_HEIGHT_PX = 250;

interface GoogleAdsenseClientProps {
  developerAdsReady: boolean;
  pubId?: string;
}

function parseBooleanEnv(value: string | undefined): boolean {
  if (!value) return false;
  return ['true', '1', 'yes', 'y', 'on'].includes(value.toLowerCase());
}

function ensureAdsenseScript(pubId: string): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      resolve(false);
      return;
    }

    const existing = document.getElementById(ADSENSE_SCRIPT_ID) as
      | HTMLScriptElement
      | null;

    if (existing) {
      // Script setup is centralized in the root layout.
      resolve(true);
      return;
    }

    // Fail closed when setup is missing; we do not inject scripts from here.
    resolve(false);
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

export function GoogleAdsenseClient({
  developerAdsReady,
  pubId,
}: GoogleAdsenseClientProps) {
  const pathname = usePathname();
  const cfg = getAdsRuntimeConfig();
  const isDevFakeAds = parseBooleanEnv(process.env.NEXT_PUBLIC_GOOGLE_ADS_DEV);
  const routeAllowed = isAdsAllowedForPathname(pathname || '/', cfg.includeSensitive);
  const [adminAdsSwitchOn, setAdminAdsSwitchOn] = useState<boolean>(false);
  const allowed = developerAdsReady && adminAdsSwitchOn && routeAllowed;

  // Reserve UI space / load client script only when something will render or request ads.
  const hasActiveAdMode = Boolean(cfg.adSlotId || cfg.enablePageLevelAds);
  const shouldFetchAdminSwitch =
    developerAdsReady && routeAllowed && !!pubId && hasActiveAdMode;

  // Logged-out users must remain non-personalized.
  const [adPersonalizationEnabled, setAdPersonalizationEnabled] = useState(
    () => !!getAuthToken()
  );
  const [scriptReady, setScriptReady] = useState(false);
  const lastAdRequestPathRef = useRef<string | null>(null);

  useEffect(() => {
    if (!shouldFetchAdminSwitch) {
      setAdminAdsSwitchOn(false);
      return;
    }

    let cancelled = false;

    featureFlagsApi
      .getAdsSwitch()
      .then((response) => {
        if (cancelled) return;
        setAdminAdsSwitchOn(response.adminAdsSwitchOn !== false);
      })
      .catch(() => {
        if (cancelled) return;
        // Fail closed: if switch state cannot be fetched, ads stay off.
        setAdminAdsSwitchOn(false);
      });

    return () => {
      cancelled = true;
    };
  }, [shouldFetchAdminSwitch]);

  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      setAdPersonalizationEnabled(false);
      return;
    }

    let cancelled = false;
    privacyApi
      .getSettings()
      .then((settings) => {
        if (cancelled) return;
        setAdPersonalizationEnabled(settings.adPersonalizationEnabled !== false);
      })
      .catch(() => {
        if (cancelled) return;
        setAdPersonalizationEnabled(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (isDevFakeAds) return;
      if (!allowed || !pubId || !hasActiveAdMode) return;

      const loaded = await ensureAdsenseScript(pubId);
      if (!cancelled) setScriptReady(loaded);
    }

    run();

    return () => {
      cancelled = true;
    };
  }, [isDevFakeAds, allowed, pubId, hasActiveAdMode]);

  useEffect(() => {
    // Only push after the script is present and we know the route is allowed.
    if (isDevFakeAds) return;
    if (!allowed || !scriptReady || !pubId || !hasActiveAdMode) return;

    // Avoid duplicate requests when React re-runs effects.
    if (lastAdRequestPathRef.current === pathname) return;

    (window.adsbygoogle as any).requestNonPersonalizedAds =
      adPersonalizationEnabled ? 0 : 1;

    if (cfg.adSlotId) {
      pushAdIns();
      lastAdRequestPathRef.current = pathname || null;
      return;
    }

    // If no explicit ad slot id is configured, rely on page-level ads.
    if (cfg.enablePageLevelAds) {
      pushPageLevelAds(pubId);
      lastAdRequestPathRef.current = pathname || null;
    }
  }, [
    allowed,
    cfg.adSlotId,
    cfg.enablePageLevelAds,
    pubId,
    scriptReady,
    pathname,
    hasActiveAdMode,
    isDevFakeAds,
    adPersonalizationEnabled,
  ]);

  if (!allowed) return null;

  // Dev mode: render fake ad only; never call AdSense script/request flows.
  if (isDevFakeAds) {
    return (
      <div className="w-full flex justify-center px-4" aria-live="polite">
        <div className="w-full max-w-4xl rounded-lg bg-purple-700 px-4 py-3 text-white">
          {adPersonalizationEnabled
            ? 'This is a personalized ad.'
            : 'This is a non-personalized ad.'}
        </div>
      </div>
    );
  }

  if (!pubId || !hasActiveAdMode) return null;
  if (!cfg.adSlotId) return null;

  return (
    <div
      className="w-full flex justify-center px-4"
      aria-hidden="true"
      style={{ minHeight: DEFAULT_SLOT_MIN_HEIGHT_PX }}
    >
      {cfg.adSlotId ? (
        <div className="w-full max-w-4xl">
          <ins
            key={pathname}
            className="adsbygoogle"
            style={{ display: 'block' }}
            data-ad-client={pubId}
            data-ad-slot={cfg.adSlotId}
            data-ad-format="auto"
            data-full-width-responsive="true"
          />
        </div>
      ) : null}
    </div>
  );
}

