import {
  getAdsRuntimeConfig,
  isAdsAllowedForPathname,
} from '@/components/ads/adsConfig';

describe('adsConfig', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    delete process.env.NEXT_PUBLIC_ADS_ENABLED;
    delete process.env.NEXT_PUBLIC_ADS_INCLUDE_SENSITIVE;
    delete process.env.NEXT_PUBLIC_ADS_ENABLE_PAGE_LEVEL;
    delete process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_PUB_ID;
    delete process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_AD_SLOT_ID;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('getAdsRuntimeConfig', () => {
    it('returns disabled when NEXT_PUBLIC_ADS_ENABLED is unset', () => {
      process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_PUB_ID = 'ca-pub-123';
      const cfg = getAdsRuntimeConfig();
      expect(cfg.enabled).toBe(false);
      expect(cfg.pubId).toBe('ca-pub-123');
    });

    it('parses NEXT_PUBLIC_ADS_ENABLED truthy variants', () => {
      for (const v of ['true', '1', 'yes', 'on', 'Y']) {
        process.env.NEXT_PUBLIC_ADS_ENABLED = v;
        expect(getAdsRuntimeConfig().enabled).toBe(true);
      }
    });

    it('trims empty pubId and slot to null', () => {
      process.env.NEXT_PUBLIC_ADS_ENABLED = 'true';
      process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_PUB_ID = '   ';
      process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_AD_SLOT_ID = '\t';
      const cfg = getAdsRuntimeConfig();
      expect(cfg.pubId).toBeNull();
      expect(cfg.adSlotId).toBeNull();
    });

    it('returns includeSensitive and enablePageLevelAds from env', () => {
      process.env.NEXT_PUBLIC_ADS_INCLUDE_SENSITIVE = 'true';
      process.env.NEXT_PUBLIC_ADS_ENABLE_PAGE_LEVEL = '1';
      const cfg = getAdsRuntimeConfig();
      expect(cfg.includeSensitive).toBe(true);
      expect(cfg.enablePageLevelAds).toBe(true);
    });
  });

  describe('isAdsAllowedForPathname', () => {
    it('allows all paths when includeSensitive is true', () => {
      expect(isAdsAllowedForPathname('/login', true)).toBe(true);
      expect(isAdsAllowedForPathname('/register', true)).toBe(true);
    });

    it('blocks known restricted routes when includeSensitive is false', () => {
      expect(isAdsAllowedForPathname('/login', false)).toBe(false);
      expect(isAdsAllowedForPathname('/register', false)).toBe(false);
      expect(isAdsAllowedForPathname('/forgot-password', false)).toBe(false);
      expect(isAdsAllowedForPathname('/reset-password/new', false)).toBe(false);
      expect(isAdsAllowedForPathname('/games/create', false)).toBe(false);
      expect(isAdsAllowedForPathname('/rsvpRoster/abc', false)).toBe(false);
      expect(isAdsAllowedForPathname('/profile/edit', false)).toBe(false);
      expect(isAdsAllowedForPathname('/notifications', false)).toBe(false);
      expect(isAdsAllowedForPathname('/settings', false)).toBe(false);
    });

    it('allows discover and public browsing routes', () => {
      expect(isAdsAllowedForPathname('/discover', false)).toBe(true);
      expect(isAdsAllowedForPathname('/calendar', false)).toBe(true);
    });

    it('does not allow game detail or other non-allow-listed paths', () => {
      expect(isAdsAllowedForPathname('/games/xyz', false)).toBe(false);
    });

    it('allows allow-listed routes with query-string boundaries', () => {
      expect(isAdsAllowedForPathname('/discover?radius=25', false)).toBe(true);
      expect(isAdsAllowedForPathname('/discover?', false)).toBe(true);
    });

    it('blocks near-match prefixes that are not allow-listed routes', () => {
      expect(isAdsAllowedForPathname('/discover-alt', false)).toBe(false);
      expect(isAdsAllowedForPathname('/calendarized', false)).toBe(false);
    });
  });
});
