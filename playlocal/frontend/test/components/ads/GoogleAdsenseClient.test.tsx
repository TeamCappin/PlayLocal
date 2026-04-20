import React from 'react';
import { render, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { GoogleAdsenseClient } from '@/components/ads/GoogleAdsenseClient';

const mockPathname = jest.fn(() => '/discover');
const mockGetAuthToken = jest.fn<null | string, []>(() => null);
const mockPrivacyGetSettings = jest.fn<
  Promise<{ adPersonalizationEnabled: boolean }>,
  []
>(() => Promise.resolve({ adPersonalizationEnabled: true }));
const mockGetAdsSwitch = jest.fn<
  Promise<{ adminAdsSwitchOn: boolean }>,
  []
>(() => Promise.resolve({ adminAdsSwitchOn: true }));

jest.mock('next/navigation', () => ({
  usePathname: () => mockPathname(),
}));

jest.mock('@/lib/api', () => ({
  getAuthToken: () => mockGetAuthToken(),
  privacyApi: {
    getSettings: () => mockPrivacyGetSettings(),
  },
  featureFlagsApi: {
    getAdsSwitch: () => mockGetAdsSwitch(),
  },
}));

describe('GoogleAdsenseClient', () => {
  const originalEnv = process.env;

  function renderAdsClient() {
    return render(
      <GoogleAdsenseClient
        developerAdsReady={process.env.NEXT_PUBLIC_ADS_ENABLED === 'true'}
        pubId={process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_PUB_ID}
      />
    );
  }

  function ensureAdsenseScriptStubInDom() {
    if (!document.getElementById('google-adsense-script')) {
      const s = document.createElement('script');
      s.id = 'google-adsense-script';
      document.head.appendChild(s);
    }
  }

  beforeEach(() => {
    jest.clearAllMocks();
    mockPathname.mockReturnValue('/discover');
    mockGetAuthToken.mockReturnValue(null);
    mockPrivacyGetSettings.mockResolvedValue({ adPersonalizationEnabled: true });
    mockGetAdsSwitch.mockResolvedValue({ adminAdsSwitchOn: true });
    process.env = { ...originalEnv };
    process.env.NEXT_PUBLIC_GOOGLE_ADS_DEV = 'false';
    document.head.querySelectorAll('#google-adsense-script').forEach((n) => n.remove());
    window.adsbygoogle = undefined;
    ensureAdsenseScriptStubInDom();
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('renders nothing when ads are disabled', () => {
    delete process.env.NEXT_PUBLIC_ADS_ENABLED;
    process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_PUB_ID = 'ca-pub-test';
    const { container } = renderAdsClient();
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when publisher id is missing', () => {
    process.env.NEXT_PUBLIC_ADS_ENABLED = 'true';
    delete process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_PUB_ID;
    const { container } = renderAdsClient();
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing on restricted pathname when includeSensitive is false', () => {
    mockPathname.mockReturnValue('/login');
    process.env.NEXT_PUBLIC_ADS_ENABLED = 'true';
    process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_PUB_ID = 'ca-pub-test';
    process.env.NEXT_PUBLIC_ADS_INCLUDE_SENSITIVE = '';
    const { container } = renderAdsClient();
    expect(container.firstChild).toBeNull();
  });

  it('renders ad wrapper on allowed path when enabled and pushes page-level ads', async () => {
    process.env.NEXT_PUBLIC_ADS_ENABLED = 'true';
    process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_PUB_ID = 'ca-pub-test';
    process.env.NEXT_PUBLIC_ADS_ENABLE_PAGE_LEVEL = 'true';
    delete process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_AD_SLOT_ID;

    const pushes: unknown[] = [];
    window.adsbygoogle = [];
    window.adsbygoogle.push = jest.fn((...args: unknown[]) => {
      pushes.push(args[0]);
      return 0;
    });

    renderAdsClient();

    await waitFor(() => {
      expect(window.adsbygoogle?.push).toHaveBeenCalled();
    });

    // Anonymous user: no account = no personalization possible.
    expect((window.adsbygoogle as any).requestNonPersonalizedAds).toBe(1);

    expect(pushes.some((p) => (p as { google_ad_client?: string })?.google_ad_client === 'ca-pub-test')).toBe(true);
    expect(pushes.some((p) => (p as { enable_page_level_ads?: boolean })?.enable_page_level_ads)).toBe(true);

    // Page-level mode: component renders null and lets Google inject ad units.
    const wrapper = document.querySelector('[aria-hidden="true"]');
    expect(wrapper).not.toBeInTheDocument();
  });

  it('renders nothing when admin ads switch is off', async () => {
    mockGetAdsSwitch.mockResolvedValue({ adminAdsSwitchOn: false });
    process.env.NEXT_PUBLIC_ADS_ENABLED = 'true';
    process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_PUB_ID = 'ca-pub-test';
    process.env.NEXT_PUBLIC_ADS_ENABLE_PAGE_LEVEL = 'true';

    window.adsbygoogle = [];
    window.adsbygoogle.push = jest.fn(() => 0);

    const { container } = renderAdsClient();

    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });

    expect(window.adsbygoogle?.push).not.toHaveBeenCalled();
    expect(container.firstChild).toBeNull();
  });

  it('fails closed when admin ads switch lookup fails', async () => {
    mockGetAdsSwitch.mockRejectedValue(new Error('flags unavailable'));
    process.env.NEXT_PUBLIC_ADS_ENABLED = 'true';
    process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_PUB_ID = 'ca-pub-test';
    process.env.NEXT_PUBLIC_ADS_ENABLE_PAGE_LEVEL = 'true';

    window.adsbygoogle = [];
    window.adsbygoogle.push = jest.fn(() => 0);

    const { container } = renderAdsClient();

    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });

    expect(window.adsbygoogle?.push).not.toHaveBeenCalled();
    expect(container.firstChild).toBeNull();
  });

  it('renders ins.adsbygoogle when slot id is set and pushes empty object', async () => {
    process.env.NEXT_PUBLIC_ADS_ENABLED = 'true';
    process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_PUB_ID = 'ca-pub-test';
    process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_AD_SLOT_ID = '1234567890';

    window.adsbygoogle = [];
    window.adsbygoogle.push = jest.fn(() => 0);

    renderAdsClient();

    await waitFor(() => {
      expect(document.querySelector('ins.adsbygoogle')).toBeInTheDocument();
    });
    expect(document.querySelector('ins')?.getAttribute('data-ad-slot')).toBe('1234567890');

    await waitFor(() => {
      expect(window.adsbygoogle?.push).toHaveBeenCalled();
    });
    expect(window.adsbygoogle?.push).toHaveBeenCalledWith({});
  });

  it('fails closed when ads script is missing', async () => {
    document.head.querySelectorAll('#google-adsense-script').forEach((n) => n.remove());

    process.env.NEXT_PUBLIC_ADS_ENABLED = 'true';
    process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_PUB_ID = 'ca-pub-dynamic';
    process.env.NEXT_PUBLIC_ADS_ENABLE_PAGE_LEVEL = 'true';
    delete process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_AD_SLOT_ID;

    window.adsbygoogle = [];
    window.adsbygoogle.push = jest.fn(() => 0);

    const { container } = renderAdsClient();

    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });

    expect(window.adsbygoogle?.push).not.toHaveBeenCalled();
    expect(container.firstChild).toBeNull();
  });

  it('fails closed when ads script is missing and does not push', async () => {
    document.head.querySelectorAll('#google-adsense-script').forEach((n) => n.remove());

    process.env.NEXT_PUBLIC_ADS_ENABLED = 'true';
    process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_PUB_ID = 'ca-pub-err';
    process.env.NEXT_PUBLIC_ADS_ENABLE_PAGE_LEVEL = 'true';
    delete process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_AD_SLOT_ID;

    window.adsbygoogle = [];
    window.adsbygoogle.push = jest.fn(() => 0);

    const { container } = renderAdsClient();

    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });

    // Script failed to load: scriptReady stays false, so no ad push is made.
    expect(window.adsbygoogle?.push).not.toHaveBeenCalled();
    // Page does not crash and renders nothing.
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing and does not push when no slot and page-level ads disabled', async () => {
    process.env.NEXT_PUBLIC_ADS_ENABLED = 'true';
    process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_PUB_ID = 'ca-pub-test';
    process.env.NEXT_PUBLIC_ADS_ENABLE_PAGE_LEVEL = 'false';
    delete process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_AD_SLOT_ID;

    window.adsbygoogle = [];
    window.adsbygoogle.push = jest.fn(() => 0);

    const { container } = renderAdsClient();

    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });

    expect(window.adsbygoogle?.push).not.toHaveBeenCalled();
    expect(container.firstChild).toBeNull();
  });

  it('keeps ads on and requests non-personalized mode when user opted out', async () => {
    mockGetAuthToken.mockReturnValue('jwt-token');
    mockPrivacyGetSettings.mockResolvedValue({ adPersonalizationEnabled: false });

    process.env.NEXT_PUBLIC_ADS_ENABLED = 'true';
    process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_PUB_ID = 'ca-pub-test';
    process.env.NEXT_PUBLIC_ADS_ENABLE_PAGE_LEVEL = 'true';
    delete process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_AD_SLOT_ID;

    window.adsbygoogle = [];
    window.adsbygoogle.push = jest.fn(() => 0);

    const { container } = renderAdsClient();

    await waitFor(() => {
      expect(window.adsbygoogle?.push).toHaveBeenCalled();
    });

    expect((window.adsbygoogle as any).requestNonPersonalizedAds).toBe(1);
    // Page-level mode: component renders null; Google injects ad units directly.
    expect(container.firstChild).toBeNull();
  });

  it('falls back to non-personalized ads when privacy lookup fails', async () => {
    mockGetAuthToken.mockReturnValue('jwt-token');
    mockPrivacyGetSettings.mockRejectedValue(new Error('network'));

    process.env.NEXT_PUBLIC_ADS_ENABLED = 'true';
    process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_PUB_ID = 'ca-pub-test';
    process.env.NEXT_PUBLIC_ADS_ENABLE_PAGE_LEVEL = 'true';
    delete process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_AD_SLOT_ID;

    window.adsbygoogle = [];
    window.adsbygoogle.push = jest.fn(() => 0);

    const { container } = renderAdsClient();

    await waitFor(() => {
      expect(window.adsbygoogle?.push).toHaveBeenCalled();
    });

    expect((window.adsbygoogle as any).requestNonPersonalizedAds).toBe(1);
    // Page-level mode: component renders null; Google injects ad units directly.
    expect(container.firstChild).toBeNull();
  });

  it('renders fake ad in dev mode with personalization boundary text', async () => {
    mockGetAuthToken.mockReturnValue('jwt-token');
    mockPrivacyGetSettings.mockResolvedValue({ adPersonalizationEnabled: true });

    process.env.NEXT_PUBLIC_ADS_ENABLED = 'true';
    process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_PUB_ID = 'ca-pub-test';
    process.env.NEXT_PUBLIC_GOOGLE_ADS_DEV = 'true';

    const { rerender } = render(
      <GoogleAdsenseClient developerAdsReady={true} pubId="ca-pub-test" />
    );

    expect(
      await waitFor(() => document.body.textContent?.includes('This is a personalized ad.'))
    ).toBe(true);

    mockGetAuthToken.mockReturnValue('jwt-token');
    mockPrivacyGetSettings.mockResolvedValue({ adPersonalizationEnabled: false });
    rerender(<GoogleAdsenseClient developerAdsReady={true} pubId="ca-pub-test" />);

    expect(
      await waitFor(() => document.body.textContent?.includes('This is a non-personalized ad.'))
    ).toBe(true);
  });
});
