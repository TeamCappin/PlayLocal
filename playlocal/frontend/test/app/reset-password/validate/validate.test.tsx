import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ValidateResetCodePage from  '../../../../app/reset-password/validate/page';
import { authApi } from '@/lib/api';

const mockPush = jest.fn();
const mockGet = jest.fn();

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
  useSearchParams: () => ({
    get: mockGet,
  }),
}));

jest.mock('@/lib/api', () => ({
  authApi: {
    verifyResetCode: jest.fn(),
    resendResetCode: jest.fn(),
  },
}));

describe('ValidateResetCodePage', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockGet.mockImplementation((key: string) => {
      if (key === 'email') return 'test@example.com';
      return null;
    });
  });

  it('renders email from query params', () => {
    render(<ValidateResetCodePage />);

    expect(screen.getByText('Check your inbox')).toBeInTheDocument();
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
  });

  it('sanitizes code input to digits only and max 6 chars', () => {
    render(<ValidateResetCodePage />);

    const input = screen.getByLabelText('Code') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '12ab34cd5678' } });

    expect(input.value).toBe('123456');
  });

  it('disables continue button when code is not 6 digits', () => {
    render(<ValidateResetCodePage />);

    const button = screen.getByRole('button', { name: 'Continue' });
    expect(button).toBeDisabled();

    const input = screen.getByLabelText('Code');
    fireEvent.change(input, { target: { value: '12345' } });

    expect(button).toBeDisabled();
  });

  it('enables continue button when code is 6 digits', () => {
    render(<ValidateResetCodePage />);

    const input = screen.getByLabelText('Code');
    const button = screen.getByRole('button', { name: 'Continue' });

    fireEvent.change(input, { target: { value: '123456' } });

    expect(button).not.toBeDisabled();
  });

  it('calls verifyResetCode and redirects on success', async () => {
    (authApi.verifyResetCode as jest.Mock).mockResolvedValueOnce({});

    render(<ValidateResetCodePage />);

    fireEvent.change(screen.getByLabelText('Code'), {
      target: { value: '123456' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));

    await waitFor(() => {
      expect(authApi.verifyResetCode).toHaveBeenCalledWith({
        email: 'test@example.com',
        code: '123456',
      });
    });

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith(
        '/reset-password/new?email=test%40example.com&code=123456'
      );
    });
  });

  it('shows api error message when verify fails', async () => {
    (authApi.verifyResetCode as jest.Mock).mockRejectedValueOnce({
      message: 'Wrong code',
    });

    render(<ValidateResetCodePage />);

    fireEvent.change(screen.getByLabelText('Code'), {
      target: { value: '123456' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));

    expect(await screen.findByText('Wrong code')).toBeInTheDocument();
  });

  it('shows fallback error when verify fails without message', async () => {
    (authApi.verifyResetCode as jest.Mock).mockRejectedValueOnce({});

    render(<ValidateResetCodePage />);

    fireEvent.change(screen.getByLabelText('Code'), {
      target: { value: '123456' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));

    expect(
      await screen.findByText('Invalid or expired code.')
    ).toBeInTheDocument();
  });

  it('shows verifying state while submitting', async () => {
    let resolvePromise!: () => void;
    (authApi.verifyResetCode as jest.Mock).mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolvePromise = resolve;
        })
    );

    render(<ValidateResetCodePage />);

    fireEvent.change(screen.getByLabelText('Code'), {
      target: { value: '123456' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));

    expect(screen.getByRole('button', { name: 'Verifying...' })).toBeDisabled();

    resolvePromise();
    await waitFor(() =>
      expect(mockPush).toHaveBeenCalled()
    );
  });

  it('calls resendResetCode on resend click', async () => {
    (authApi.resendResetCode as jest.Mock).mockResolvedValueOnce({});

    render(<ValidateResetCodePage />);

    fireEvent.click(screen.getByRole('button', { name: 'Resend email' }));

    await waitFor(() => {
      expect(authApi.resendResetCode).toHaveBeenCalledWith({
        email: 'test@example.com',
      });
    });
  });

  it('shows resend error message from api', async () => {
    (authApi.resendResetCode as jest.Mock).mockRejectedValueOnce({
      message: 'Too many attempts',
    });

    render(<ValidateResetCodePage />);

    fireEvent.click(screen.getByRole('button', { name: 'Resend email' }));

    expect(await screen.findByText('Too many attempts')).toBeInTheDocument();
  });

  it('shows fallback resend error when resend fails without message', async () => {
    (authApi.resendResetCode as jest.Mock).mockRejectedValueOnce({});

    render(<ValidateResetCodePage />);

    fireEvent.click(screen.getByRole('button', { name: 'Resend email' }));

    expect(
      await screen.findByText('Unable to resend code right now.')
    ).toBeInTheDocument();
  });

  it('shows resending state while resend is in progress', async () => {
    let resolvePromise!: () => void;
    (authApi.resendResetCode as jest.Mock).mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolvePromise = resolve;
        })
    );

    render(<ValidateResetCodePage />);

    fireEvent.click(screen.getByRole('button', { name: 'Resend email' }));

    expect(screen.getByRole('button', { name: 'Resending...' })).toBeDisabled();

    resolvePromise();
    await waitFor(() => {
      expect(authApi.resendResetCode).toHaveBeenCalled();
    });
  });

  it('clears previous error before resubmitting successfully', async () => {
    (authApi.verifyResetCode as jest.Mock)
      .mockRejectedValueOnce({ message: 'Wrong code' })
      .mockResolvedValueOnce({});

    render(<ValidateResetCodePage />);

    fireEvent.change(screen.getByLabelText('Code'), {
      target: { value: '123456' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    expect(await screen.findByText('Wrong code')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalled();
    });
  });
});