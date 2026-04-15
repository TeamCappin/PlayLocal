describe('useGoogleReCaptcha', () => {
  const envSnapshot = { ...process.env };

  beforeEach(() => {
    process.env = { ...envSnapshot };
    jest.resetModules();
  });

  it('uses fallback when NEXT_PUBLIC_RECAPTCHA_SITE_KEY is unset', () => {
    delete process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('@/hooks/useGoogleReCaptcha');
    expect(mod.useGoogleReCaptcha()).toEqual({ executeRecaptcha: undefined });
  });

  it('uses fallback when key is whitespace only', () => {
    process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY = '  \t ';
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('@/hooks/useGoogleReCaptcha');
    expect(mod.useGoogleReCaptcha()).toEqual({ executeRecaptcha: undefined });
  });

  it('re-exports react-google-recaptcha-v3 hook when key is set', () => {
    process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY = 'my-site-key';
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const actual = require('react-google-recaptcha-v3');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('@/hooks/useGoogleReCaptcha');
    expect(mod.useGoogleReCaptcha).toBe(actual.useGoogleReCaptcha);
  });
});
