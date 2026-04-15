import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { RecaptchaProvider } from '@/components/RecaptchaProvider';

const googleReCaptchaProviderMock = jest.fn(
  ({ children, reCaptchaKey }: { children: React.ReactNode; reCaptchaKey: string }) => (
    <div data-testid="grecaptcha-wrapper" data-sitekey={reCaptchaKey}>
      {children}
    </div>
  )
);

jest.mock('react-google-recaptcha-v3', () => ({
  GoogleReCaptchaProvider: (props: { children: React.ReactNode; reCaptchaKey: string }) =>
    googleReCaptchaProviderMock(props),
}));

describe('RecaptchaProvider', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('renders children only when site key is unset', () => {
    delete process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
    render(
      <RecaptchaProvider>
        <span data-testid="inner">x</span>
      </RecaptchaProvider>
    );
    expect(screen.getByTestId('inner')).toBeInTheDocument();
    expect(screen.queryByTestId('grecaptcha-wrapper')).not.toBeInTheDocument();
    expect(googleReCaptchaProviderMock).not.toHaveBeenCalled();
  });

  it('renders children only when site key is whitespace', () => {
    process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY = '   \t  ';
    render(
      <RecaptchaProvider>
        <span data-testid="inner">y</span>
      </RecaptchaProvider>
    );
    expect(screen.getByTestId('inner')).toBeInTheDocument();
    expect(screen.queryByTestId('grecaptcha-wrapper')).not.toBeInTheDocument();
  });

  it('wraps children with GoogleReCaptchaProvider when site key is set', () => {
    process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY = 'site-key-123';
    render(
      <RecaptchaProvider>
        <span data-testid="inner">z</span>
      </RecaptchaProvider>
    );
    expect(screen.getByTestId('grecaptcha-wrapper')).toHaveAttribute('data-sitekey', 'site-key-123');
    expect(screen.getByTestId('inner')).toBeInTheDocument();
    expect(googleReCaptchaProviderMock).toHaveBeenCalledWith(
      expect.objectContaining({ reCaptchaKey: 'site-key-123' })
    );
  });

  it('trims site key before passing to provider', () => {
    process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY = '  trimmed-key  ';
    render(
      <RecaptchaProvider>
        <span data-testid="inner">z</span>
      </RecaptchaProvider>
    );
    expect(screen.getByTestId('grecaptcha-wrapper')).toHaveAttribute('data-sitekey', 'trimmed-key');
  });
});
