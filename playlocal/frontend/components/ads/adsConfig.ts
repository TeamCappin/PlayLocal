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

// Allow-list of routes where ads are permitted by default.
// Only paths matching these entries (exact root, or prefix for others) will show ads.
// Everything else — auth flows, settings, legal pages, game rooms, profiles, etc. — is ad-free.
// Set NEXT_PUBLIC_ADS_INCLUDE_SENSITIVE=true to bypass the allow-list entirely.
const AD_ALLOWED_ROUTES: string[] = [
  '/discover',
  '/players',
  '/stats',
  '/friends',
  '/calendar',
];

export function isAdsAllowedForPathname(
  pathname: string,
  includeSensitive: boolean
): boolean {
  if (includeSensitive) return true;

  return AD_ALLOWED_ROUTES.some((allowed) => {
    if (allowed === '/') return pathname === '/';
    return (
      pathname === allowed ||
      pathname.startsWith(allowed + '/') ||
      pathname.startsWith(allowed + '?')
    );
  });
}

