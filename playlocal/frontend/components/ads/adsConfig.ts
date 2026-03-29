export type AdsRuntimeConfig = {
  enabled: boolean;
  includeSensitive: boolean;
  enablePageLevelAds: boolean;
  pubId: string | null;
  adSlotId: string | null;
};

function parseBooleanEnv(value: string | undefined): boolean {
  if (!value) return false;
  return ['true', '1', 'yes', 'y', 'on'].includes(value.toLowerCase());
}

export function getAdsRuntimeConfig(): AdsRuntimeConfig {
  const enabled = parseBooleanEnv(process.env.NEXT_PUBLIC_ADS_ENABLED);
  const includeSensitive = parseBooleanEnv(
    process.env.NEXT_PUBLIC_ADS_INCLUDE_SENSITIVE
  );
  const enablePageLevelAds = parseBooleanEnv(
    process.env.NEXT_PUBLIC_ADS_ENABLE_PAGE_LEVEL
  );

  const pubId = process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_PUB_ID || null;
  const adSlotId = process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_AD_SLOT_ID || null;

  return {
    enabled,
    includeSensitive,
    enablePageLevelAds,
    pubId: pubId && pubId.trim().length > 0 ? pubId : null,
    adSlotId: adSlotId && adSlotId.trim().length > 0 ? adSlotId : null,
  };
}

// Restricted/sensitive pages where ads should not appear.
// Keep this list strict by default; you can override via `NEXT_PUBLIC_ADS_INCLUDE_SENSITIVE=true`.
const RESTRICTED_ROUTE_PREFIXES: string[] = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/games/create',
  '/rsvpRoster/',
  '/profile/edit',
  '/notifications',
  '/settings',
];

export function isAdsAllowedForPathname(
  pathname: string,
  includeSensitive: boolean
): boolean {
  if (includeSensitive) return true;

  return !RESTRICTED_ROUTE_PREFIXES.some((prefix) => {
    if (prefix.endsWith('/')) return pathname.startsWith(prefix);
    return pathname === prefix || pathname.startsWith(prefix);
  });
}

