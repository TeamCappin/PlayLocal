import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import NewPasswordPage from  '../../../../app/reset-password/new/page';
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

jest.mock('lucide-react', () => ({
  CheckCircle2: (props: any) => <svg data-testid="check-icon" {...props} />,
  XCircle: (props: any) => <svg data-testid="x-icon" {...props} />,
  Eye: (props: any) => <svg data-testid="eye-icon" {...props} />,
  EyeOff: (props: any) => <svg data-testid="eyeoff-icon" {...props} />,
}));

jest.mock('@/lib/api', () => ({
  authApi: {
    resetPassword: jest.fn(),
  },
}));

describe('NewPasswordPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockGet.mockImplementation((key: string) => {
      if (key === 'email') return 'test@example.com';
      if (key === 'code') return '123456';
      return null;
    });
  });

  it('renders new password form', () => {
    render(<NewPasswordPage />);

    expect(screen.getByText('Set new password')).toBeInTheDocument();
    expect(screen.getByLabelText('New password')).toBeInTheDocument();
    expect(screen.getByLabelText('Confirm new password')).toBeInTheDocument();
  });

  it('toggles confirm password visibility', () => {
    render(<NewPasswordPage />);

    const confirmInput = screen.getByLabelText(
      'Confirm new password'
    ) as HTMLInputElement;
    const buttons = screen.getAllByRole('button', { name: 'Show password' });

    expect(confirmInput.type).toBe('password');

    fireEvent.click(buttons[1]);
    expect(confirmInput.type).toBe('text');

    fireEvent.click(screen.getByRole('button', { name: 'Hide password' }));
    expect(confirmInput.type).toBe('password');
  });

  it('shows password rules when password field is focused', () => {
    render(<NewPasswordPage />);

    fireEvent.focus(screen.getByLabelText('New password'));

    expect(screen.getByText('At least 8 characters')).toBeInTheDocument();
    expect(screen.getByText('At least 1 uppercase letter')).toBeInTheDocument();
    expect(screen.getByText('At least 1 lowercase letter')).toBeInTheDocument();
    expect(screen.getByText('At least 1 number')).toBeInTheDocument();
    expect(screen.getByText('At least 1 special character')).toBeInTheDocument();
    expect(screen.getByText('Not all the same character')).toBeInTheDocument();
  });

  it('shows password rules when password has content even after blur', () => {
    render(<NewPasswordPage />);

    const input = screen.getByLabelText('New password');
    fireEvent.change(input, { target: { value: 'Abc123!' } });
    fireEvent.blur(input);

    expect(screen.getByText('At least 8 characters')).toBeInTheDocument();
  });

  it('shows match helper when confirm password field is focused', () => {
    render(<NewPasswordPage />);

    fireEvent.focus(screen.getByLabelText('Confirm new password'));

    expect(screen.getByText('Passwords must match')).toBeInTheDocument();
  });

  it('shows passwords match when both passwords are equal', () => {
    render(<NewPasswordPage />);

    fireEvent.change(screen.getByLabelText('New password'), {
      target: { value: 'Strong1!' },
    });

    fireEvent.change(screen.getByLabelText('Confirm new password'), {
      target: { value: 'Strong1!' },
    });

    expect(screen.getByText('Passwords match')).toBeInTheDocument();
  });

  it('shows validation error for password too short', async () => {
    render(<NewPasswordPage />);

    fireEvent.change(screen.getByLabelText('New password'), {
      target: { value: 'Ab1!' },
    });

    fireEvent.change(screen.getByLabelText('Confirm new password'), {
      target: { value: 'Ab1!' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));

    expect(
      await screen.findByText(
        'Password does not meet requirements: at least 8 characters.'
      )
    ).toBeInTheDocument();

    expect(authApi.resetPassword).not.toHaveBeenCalled();
  });

  it('shows validation error for missing uppercase', async () => {
    render(<NewPasswordPage />);

    fireEvent.change(screen.getByLabelText('New password'), {
      target: { value: 'strong1!' },
    });

    fireEvent.change(screen.getByLabelText('Confirm new password'), {
      target: { value: 'strong1!' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));

    expect(
      await screen.findByText(
        'Password does not meet requirements: at least 1 uppercase letter.'
      )
    ).toBeInTheDocument();
  });

  it('shows validation error when passwords do not match', async () => {
    render(<NewPasswordPage />);

    fireEvent.change(screen.getByLabelText('New password'), {
      target: { value: 'Strong1!' },
    });

    fireEvent.change(screen.getByLabelText('Confirm new password'), {
      target: { value: 'Strong2!' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));

    expect(await screen.findByText('Passwords do not match.')).toBeInTheDocument();
    expect(authApi.resetPassword).not.toHaveBeenCalled();
  });

  it('calls resetPassword with email, code and new password', async () => {
    (authApi.resetPassword as jest.Mock).mockResolvedValueOnce({});

    render(<NewPasswordPage />);

    fireEvent.change(screen.getByLabelText('New password'), {
      target: { value: 'Strong1!' },
    });

    fireEvent.change(screen.getByLabelText('Confirm new password'), {
      target: { value: 'Strong1!' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));

    await waitFor(() => {
      expect(authApi.resetPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        code: '123456',
        newPassword: 'Strong1!',
      });
    });

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/login?reset=success');
    });
  });

  it('shows api error message on reset failure', async () => {
    (authApi.resetPassword as jest.Mock).mockRejectedValueOnce({
      message: 'Code expired',
    });

    render(<NewPasswordPage />);

    fireEvent.change(screen.getByLabelText('New password'), {
      target: { value: 'Strong1!' },
    });

    fireEvent.change(screen.getByLabelText('Confirm new password'), {
      target: { value: 'Strong1!' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));

    expect(await screen.findByText('Code expired')).toBeInTheDocument();
  });

  it('shows fallback api error when reset fails without message', async () => {
    (authApi.resetPassword as jest.Mock).mockRejectedValueOnce({});

    render(<NewPasswordPage />);

    fireEvent.change(screen.getByLabelText('New password'), {
      target: { value: 'Strong1!' },
    });

    fireEvent.change(screen.getByLabelText('Confirm new password'), {
      target: { value: 'Strong1!' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));

    expect(
      await screen.findByText('Unable to reset password.')
    ).toBeInTheDocument();
  });

  it('shows loading state during successful submit', async () => {
    let resolvePromise!: () => void;
    (authApi.resetPassword as jest.Mock).mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolvePromise = resolve;
        })
    );

    render(<NewPasswordPage />);

    fireEvent.change(screen.getByLabelText('New password'), {
      target: { value: 'Strong1!' },
    });

    fireEvent.change(screen.getByLabelText('Confirm new password'), {
      target: { value: 'Strong1!' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));

    expect(screen.getByRole('button', { name: 'Updating...' })).toBeDisabled();

    resolvePromise();
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalled();
    });
  });

  it('renders back to login link', () => {
    render(<NewPasswordPage />);

    expect(screen.getByRole('link', { name: 'Back to login' })).toHaveAttribute(
      'href',
      '/login'
    );
  });

  it('clears previous error before successful retry', async () => {
    (authApi.resetPassword as jest.Mock)
      .mockRejectedValueOnce({ message: 'Temporary failure' })
      .mockResolvedValueOnce({});

    render(<NewPasswordPage />);

    fireEvent.change(screen.getByLabelText('New password'), {
      target: { value: 'Strong1!' },
    });

    fireEvent.change(screen.getByLabelText('Confirm new password'), {
      target: { value: 'Strong1!' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    expect(await screen.findByText('Temporary failure')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/login?reset=success');
    });
  });
});