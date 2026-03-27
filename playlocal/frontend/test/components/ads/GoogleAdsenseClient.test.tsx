import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { GoogleAdsenseClient } from '@/components/ads/GoogleAdsenseClient';

const mockPathname = jest.fn(() => '/discover');

jest.mock('next/navigation', () => ({
  usePathname: () => mockPathname(),
}));

describe('GoogleAdsenseClient', () => {
  const originalEnv = process.env;

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
    process.env = { ...originalEnv };
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
    const { container } = render(<GoogleAdsenseClient />);
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when publisher id is missing', () => {
    process.env.NEXT_PUBLIC_ADS_ENABLED = 'true';
    delete process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_PUB_ID;
    const { container } = render(<GoogleAdsenseClient />);
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing on restricted pathname when includeSensitive is false', () => {
    mockPathname.mockReturnValue('/login');
    process.env.NEXT_PUBLIC_ADS_ENABLED = 'true';
    process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_PUB_ID = 'ca-pub-test';
    process.env.NEXT_PUBLIC_ADS_INCLUDE_SENSITIVE = '';
    const { container } = render(<GoogleAdsenseClient />);
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

    render(<GoogleAdsenseClient />);

    await waitFor(() => {
      expect(window.adsbygoogle?.push).toHaveBeenCalled();
    });

    expect(pushes.some((p) => (p as { google_ad_client?: string })?.google_ad_client === 'ca-pub-test')).toBe(true);
    expect(pushes.some((p) => (p as { enable_page_level_ads?: boolean })?.enable_page_level_ads)).toBe(true);

    const wrapper = document.querySelector('[aria-hidden="true"].w-full.flex');
    expect(wrapper).toBeInTheDocument();
  });

  it('renders ins.adsbygoogle when slot id is set and pushes empty object', async () => {
    process.env.NEXT_PUBLIC_ADS_ENABLED = 'true';
    process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_PUB_ID = 'ca-pub-test';
    process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_AD_SLOT_ID = '1234567890';

    window.adsbygoogle = [];
    window.adsbygoogle.push = jest.fn(() => 0);

    render(<GoogleAdsenseClient />);

    await waitFor(() => {
      expect(document.querySelector('ins.adsbygoogle')).toBeInTheDocument();
    });
    expect(document.querySelector('ins')?.getAttribute('data-ad-slot')).toBe('1234567890');

    await waitFor(() => {
      expect(window.adsbygoogle?.push).toHaveBeenCalled();
    });
    expect(window.adsbygoogle?.push).toHaveBeenCalledWith({});
  });

  it('injects ads script when none exists and completes after load event', async () => {
    document.head.querySelectorAll('#google-adsense-script').forEach((n) => n.remove());

    process.env.NEXT_PUBLIC_ADS_ENABLED = 'true';
    process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_PUB_ID = 'ca-pub-dynamic';
    process.env.NEXT_PUBLIC_ADS_ENABLE_PAGE_LEVEL = 'true';
    delete process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_AD_SLOT_ID;

    window.adsbygoogle = [];
    window.adsbygoogle.push = jest.fn(() => 0);

    render(<GoogleAdsenseClient />);

    let script: HTMLScriptElement;
    await waitFor(() => {
      const el = document.getElementById('google-adsense-script');
      expect(el).not.toBeNull();
      expect((el as HTMLScriptElement).src || '').toContain(
        'pagead2.googlesyndication.com'
      );
      expect((el as HTMLScriptElement).src || '').toContain('ca-pub-dynamic');
      script = el as HTMLScriptElement;
    });

    await act(async () => {
      script.dispatchEvent(new Event('load'));
    });

    await waitFor(() => {
      expect(window.adsbygoogle?.push).toHaveBeenCalled();
    });
  });

  it('injects ads script when none exists and completes after error event', async () => {
    document.head.querySelectorAll('#google-adsense-script').forEach((n) => n.remove());

    process.env.NEXT_PUBLIC_ADS_ENABLED = 'true';
    process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_PUB_ID = 'ca-pub-err';
    process.env.NEXT_PUBLIC_ADS_ENABLE_PAGE_LEVEL = 'true';
    delete process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_AD_SLOT_ID;

    window.adsbygoogle = [];
    window.adsbygoogle.push = jest.fn(() => 0);

    render(<GoogleAdsenseClient />);

    const script = await waitFor(() =>
      document.getElementById('google-adsense-script') as HTMLScriptElement
    );

    await act(async () => {
      script.dispatchEvent(new Event('error'));
    });

    await waitFor(() => {
      expect(window.adsbygoogle?.push).toHaveBeenCalled();
    });
  });

  it('does not push page-level when enablePageLevelAds is false and no slot', async () => {
    process.env.NEXT_PUBLIC_ADS_ENABLED = 'true';
    process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_PUB_ID = 'ca-pub-test';
    process.env.NEXT_PUBLIC_ADS_ENABLE_PAGE_LEVEL = 'false';
    delete process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_AD_SLOT_ID;

    window.adsbygoogle = [];
    window.adsbygoogle.push = jest.fn(() => 0);

    render(<GoogleAdsenseClient />);

    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });

    expect(window.adsbygoogle?.push).not.toHaveBeenCalled();
    const wrapper = document.querySelector('[aria-hidden="true"].w-full.flex');
    expect(wrapper).toBeInTheDocument();
  });
});
