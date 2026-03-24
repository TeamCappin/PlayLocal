import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import ForgotPasswordPage from  '../../../app/forgot-password/page';
import { authApi } from '@/lib/api';

const mockPush = jest.fn();

jest.mock('next/link', () => {
  return function MockLink({
    children,
    href,
    ...props
  }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) {
    return (
      <a href={href} {...props}>
        {children}
      </a>
    );
  };
});

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

jest.mock('@/lib/api', () => ({
  authApi: {
    forgotPassword: jest.fn(),
  },
}));

jest.mock('react-google-recaptcha-v3', () => ({
  useGoogleReCaptcha: () => ({ executeRecaptcha: jest.fn().mockResolvedValue('mock-captcha-token') }),
}));

describe('ForgotPasswordPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('renders forgot password form', () => {
    render(<ForgotPasswordPage />);

    expect(screen.getByText('Reset password')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Continue' })).toBeInTheDocument();
  });

  it('disables continue button when email is empty', () => {
    render(<ForgotPasswordPage />);

    expect(screen.getByRole('button', { name: 'Continue' })).toBeDisabled();
  });

  it('enables continue button when email is filled', () => {
    render(<ForgotPasswordPage />);

    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'user@example.com' },
    });

    expect(screen.getByRole('button', { name: 'Continue' })).not.toBeDisabled();
  });

  it('calls forgotPassword with entered email', async () => {
    (authApi.forgotPassword as jest.Mock).mockResolvedValueOnce({});

    render(<ForgotPasswordPage />);

    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'user@example.com' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));

    await waitFor(() => {
      expect(authApi.forgotPassword).toHaveBeenCalledWith({
        email: 'user@example.com',
        captchaToken: 'mock-captcha-token',
      });
    });
  });

  it('shows sending state while request is in progress', async () => {
    let resolvePromise!: () => void;
    (authApi.forgotPassword as jest.Mock).mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolvePromise = resolve;
        })
    );

    render(<ForgotPasswordPage />);

    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'user@example.com' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Sending...' })).toBeDisabled();
    });

    resolvePromise();
    await waitFor(() => {
      expect(
        screen.getByText('If an account exists, a reset link/code has been sent.')
      ).toBeInTheDocument();
    });
  });

  it('shows success message after successful submit', async () => {
    (authApi.forgotPassword as jest.Mock).mockResolvedValueOnce({});

    render(<ForgotPasswordPage />);

    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'user@example.com' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));

    expect(
      await screen.findByText('If an account exists, a reset link/code has been sent.')
    ).toBeInTheDocument();
  });

  it('still shows success message if api call fails for security reasons', async () => {
    (authApi.forgotPassword as jest.Mock).mockRejectedValueOnce(
      new Error('User not found')
    );

    render(<ForgotPasswordPage />);

    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'unknown@example.com' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));

    expect(
      await screen.findByText('If an account exists, a reset link/code has been sent.')
    ).toBeInTheDocument();
  });

  it('redirects to validate page after timeout', async () => {
    (authApi.forgotPassword as jest.Mock).mockResolvedValueOnce({});

    render(<ForgotPasswordPage />);

    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'user@example.com' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));

    await screen.findByText('If an account exists, a reset link/code has been sent.');

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(mockPush).toHaveBeenCalledWith(
      '/reset-password/validate?email=user%40example.com'
    );
  });

  it('renders navigation links', () => {
    render(<ForgotPasswordPage />);

    expect(screen.getByRole('link', { name: 'Back to login' })).toHaveAttribute(
      'href',
      '/login'
    );
    expect(screen.getByRole('link', { name: 'Terms of Use' })).toHaveAttribute(
      'href',
      '/terms'
    );
    expect(screen.getByRole('link', { name: 'Privacy Policy' })).toHaveAttribute(
      'href',
      '/privacy'
    );
  });

  it('treats whitespace-only email as invalid for submit button', () => {
    render(<ForgotPasswordPage />);

    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: '   ' },
    });

    expect(screen.getByRole('button', { name: 'Continue' })).toBeDisabled();
  });
});