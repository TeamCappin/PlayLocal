import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { PasswordChangeCard } from '@/components/PasswordChangeCard';
import { authApi } from '@/lib/api';

// Mocks
const mockPerformLogoutRedirect = jest.fn();

jest.mock('@/lib/api', () => ({
  authApi: {
    changePassword: jest.fn(),
  },
}));

jest.mock('@/lib/authRedirect', () => ({
  performLogoutRedirect: (...args: unknown[]) =>
    mockPerformLogoutRedirect(...args),
}));

const mockChangePassword = authApi.changePassword as jest.Mock;

// Helpers
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: any) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function setup() {
  render(<PasswordChangeCard />);

  const currentPasswordInput = screen.getByPlaceholderText(/enter current password/i);
  const newPasswordInput = screen.getByPlaceholderText(/enter new password/i);
  const confirmNewPasswordInput = screen.getByPlaceholderText(/confirm new password/i);
  const submitButton = screen.getByRole('button', { name: /update password/i });

  return {
    currentPasswordInput,
    newPasswordInput,
    confirmNewPasswordInput,
    submitButton,
  };
}

describe('PasswordChangeCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    mockChangePassword.mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('renders all password fields and submit button', () => {
    setup();

    expect(screen.getByText(/password & security/i)).toBeInTheDocument();
    expect(screen.getByText(/current password/i)).toBeInTheDocument();
    expect(screen.getByText(/confirm new password/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /update password/i })
    ).toBeInTheDocument();
  });

  it('renders password inputs hidden by default', () => {
    const {
      currentPasswordInput,
      newPasswordInput,
      confirmNewPasswordInput,
    } = setup();

    expect(currentPasswordInput).toHaveAttribute('type', 'password');
    expect(newPasswordInput).toHaveAttribute('type', 'password');
    expect(confirmNewPasswordInput).toHaveAttribute('type', 'password');
  });

  it('toggles current password visibility', () => {
    const { currentPasswordInput } = setup();

    const toggleButton = screen.getByRole('button', {
      name: /show current password/i,
    });

    expect(currentPasswordInput).toHaveAttribute('type', 'password');

    fireEvent.click(toggleButton);
    expect(currentPasswordInput).toHaveAttribute('type', 'text');
    expect(
      screen.getByRole('button', { name: /hide current password/i })
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /hide current password/i }));
    expect(currentPasswordInput).toHaveAttribute('type', 'password');
  });

  it('toggles new password visibility', () => {
    const { newPasswordInput } = setup();

    const toggleButton = screen.getByRole('button', {
      name: /show new password/i,
    });

    expect(newPasswordInput).toHaveAttribute('type', 'password');

    fireEvent.click(toggleButton);
    expect(newPasswordInput).toHaveAttribute('type', 'text');
    expect(
      screen.getByRole('button', { name: /hide new password/i })
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /hide new password/i }));
    expect(newPasswordInput).toHaveAttribute('type', 'password');
  });

  it('toggles confirm new password visibility', () => {
    const { confirmNewPasswordInput } = setup();

    const toggleButton = screen.getByRole('button', {
      name: /show confirm new password/i,
    });

    expect(confirmNewPasswordInput).toHaveAttribute('type', 'password');

    fireEvent.click(toggleButton);
    expect(confirmNewPasswordInput).toHaveAttribute('type', 'text');
    expect(
      screen.getByRole('button', { name: /hide confirm new password/i })
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole('button', { name: /hide confirm new password/i })
    );
    expect(confirmNewPasswordInput).toHaveAttribute('type', 'password');
  });

  it('does not show password checklist initially', () => {
    setup();

    expect(screen.queryByText(/at least 8 characters/i)).not.toBeInTheDocument();
    expect(
      screen.queryByText(/at least 1 uppercase letter/i)
    ).not.toBeInTheDocument();
  });

  it('shows password checklist when new password input is focused', () => {
    const { newPasswordInput } = setup();

    fireEvent.focus(newPasswordInput);

    expect(screen.getByText(/at least 8 characters/i)).toBeInTheDocument();
    expect(screen.getByText(/at least 1 uppercase letter/i)).toBeInTheDocument();
    expect(screen.getByText(/at least 1 lowercase letter/i)).toBeInTheDocument();
    expect(screen.getByText(/at least 1 number/i)).toBeInTheDocument();
    expect(screen.getByText(/at least 1 special character/i)).toBeInTheDocument();
    expect(screen.getByText(/not all the same character/i)).toBeInTheDocument();
  });

  it('hides password checklist when blurred and empty', () => {
    const { newPasswordInput } = setup();

    fireEvent.focus(newPasswordInput);
    expect(screen.getByText(/at least 8 characters/i)).toBeInTheDocument();

    fireEvent.blur(newPasswordInput);
    expect(screen.queryByText(/at least 8 characters/i)).not.toBeInTheDocument();
  });

  it('keeps password checklist visible after blur if new password has content', () => {
    const { newPasswordInput } = setup();

    fireEvent.change(newPasswordInput, { target: { value: 'Pass' } });
    fireEvent.blur(newPasswordInput);

    expect(screen.getByText(/at least 8 characters/i)).toBeInTheDocument();
  });

  it('updates checklist dynamically as password becomes valid', () => {
    const { newPasswordInput } = setup();

    fireEvent.focus(newPasswordInput);
    fireEvent.change(newPasswordInput, { target: { value: 'Password1!' } });

    const lengthRule = screen.getByText(/at least 8 characters/i).closest('li');
    const upperRule = screen.getByText(/at least 1 uppercase letter/i).closest('li');
    const lowerRule = screen.getByText(/at least 1 lowercase letter/i).closest('li');
    const numberRule = screen.getByText(/at least 1 number/i).closest('li');
    const specialRule = screen.getByText(/at least 1 special character/i).closest('li');
    const varietyRule = screen.getByText(/not all the same character/i).closest('li');

    expect(lengthRule).toHaveClass('text-emerald-600');
    expect(upperRule).toHaveClass('text-emerald-600');
    expect(lowerRule).toHaveClass('text-emerald-600');
    expect(numberRule).toHaveClass('text-emerald-600');
    expect(specialRule).toHaveClass('text-emerald-600');
    expect(varietyRule).toHaveClass('text-emerald-600');
  });

  it('shows error when any field is empty', async () => {
    const { submitButton } = setup();

    fireEvent.click(submitButton);

    expect(screen.getByText(/all password fields are required/i)).toBeInTheDocument();
    expect(mockChangePassword).not.toHaveBeenCalled();
  });

  it('shows error for short password', async () => {
    const { currentPasswordInput, newPasswordInput, confirmNewPasswordInput, submitButton } = setup();

    fireEvent.change(currentPasswordInput, { target: { value: 'OldPassword1!' } });
    fireEvent.change(newPasswordInput, { target: { value: 'Pwd1!' } });
    fireEvent.change(confirmNewPasswordInput, { target: { value: 'Pwd1!' } });

    fireEvent.click(submitButton);

    expect(
      screen.getByText(/password does not meet requirements: at least 8 characters/i)
    ).toBeInTheDocument();
    expect(mockChangePassword).not.toHaveBeenCalled();
  });

  it('shows error when password is missing uppercase letter', () => {
    const { currentPasswordInput, newPasswordInput, confirmNewPasswordInput, submitButton } = setup();

    fireEvent.change(currentPasswordInput, { target: { value: 'OldPassword1!' } });
    fireEvent.change(newPasswordInput, { target: { value: 'password1!' } });
    fireEvent.change(confirmNewPasswordInput, { target: { value: 'password1!' } });

    fireEvent.click(submitButton);

    expect(
      screen.getByText(/password does not meet requirements: at least 1 uppercase letter/i)
    ).toBeInTheDocument();
  });

  it('shows error when password is missing lowercase letter', () => {
    const { currentPasswordInput, newPasswordInput, confirmNewPasswordInput, submitButton } = setup();

    fireEvent.change(currentPasswordInput, { target: { value: 'OldPassword1!' } });
    fireEvent.change(newPasswordInput, { target: { value: 'PASSWORD1!' } });
    fireEvent.change(confirmNewPasswordInput, { target: { value: 'PASSWORD1!' } });

    fireEvent.click(submitButton);

    expect(
      screen.getByText(/password does not meet requirements: at least 1 lowercase letter/i)
    ).toBeInTheDocument();
  });

  it('shows error when password is missing a number', () => {
    const { currentPasswordInput, newPasswordInput, confirmNewPasswordInput, submitButton } = setup();

    fireEvent.change(currentPasswordInput, { target: { value: 'OldPassword1!' } });
    fireEvent.change(newPasswordInput, { target: { value: 'Password!!' } });
    fireEvent.change(confirmNewPasswordInput, { target: { value: 'Password!!' } });

    fireEvent.click(submitButton);

    expect(
      screen.getByText(/password does not meet requirements: at least 1 number/i)
    ).toBeInTheDocument();
  });

  it('shows error when password is missing a special character', () => {
    const { currentPasswordInput, newPasswordInput, confirmNewPasswordInput, submitButton } = setup();

    fireEvent.change(currentPasswordInput, { target: { value: 'OldPassword1!' } });
    fireEvent.change(newPasswordInput, { target: { value: 'Password12' } });
    fireEvent.change(confirmNewPasswordInput, { target: { value: 'Password12' } });

    fireEvent.click(submitButton);

    expect(
      screen.getByText(/password does not meet requirements: at least 1 special character/i)
    ).toBeInTheDocument();
  });

  it('shows error when password is all the same character', () => {
    const { currentPasswordInput, newPasswordInput, confirmNewPasswordInput, submitButton } = setup();

    fireEvent.change(currentPasswordInput, { target: { value: 'OldPassword1!' } });
    fireEvent.change(newPasswordInput, { target: { value: '!!!!!!!!' } });
    fireEvent.change(confirmNewPasswordInput, { target: { value: '!!!!!!!!' } });

    fireEvent.click(submitButton);

    expect(
      screen.getByText(/password does not meet requirements/i)
    ).toBeInTheDocument();
  });

  it('shows error when new password and confirmation do not match', () => {
    const { currentPasswordInput, newPasswordInput, confirmNewPasswordInput, submitButton } = setup();

    fireEvent.change(currentPasswordInput, { target: { value: 'OldPassword1!' } });
    fireEvent.change(newPasswordInput, { target: { value: 'Password1!' } });
    fireEvent.change(confirmNewPasswordInput, { target: { value: 'Password2!' } });

    fireEvent.click(submitButton);

    expect(
      screen.getByText(/new password and confirmation do not match/i)
    ).toBeInTheDocument();
    expect(mockChangePassword).not.toHaveBeenCalled();
  });

  it('shows error when new password equals current password', () => {
    const { currentPasswordInput, newPasswordInput, confirmNewPasswordInput, submitButton } = setup();

    fireEvent.change(currentPasswordInput, { target: { value: 'Password1!' } });
    fireEvent.change(newPasswordInput, { target: { value: 'Password1!' } });
    fireEvent.change(confirmNewPasswordInput, { target: { value: 'Password1!' } });

    fireEvent.click(submitButton);

    expect(
      screen.getByText(/new password must be different from current password/i)
    ).toBeInTheDocument();
    expect(mockChangePassword).not.toHaveBeenCalled();
  });


  it('clears previous error before validating again', () => {
    const { submitButton, currentPasswordInput, newPasswordInput, confirmNewPasswordInput } = setup();

    fireEvent.click(submitButton);
    expect(screen.getByText(/all password fields are required/i)).toBeInTheDocument();

    fireEvent.change(currentPasswordInput, { target: { value: 'OldPassword1!' } });
    fireEvent.change(newPasswordInput, { target: { value: 'NewPassword1!' } });
    fireEvent.change(confirmNewPasswordInput, { target: { value: 'Mismatch1!' } });

    fireEvent.click(submitButton);

    expect(
      screen.queryByText(/all password fields are required/i)
    ).not.toBeInTheDocument();
    expect(
      screen.getByText(/new password and confirmation do not match/i)
    ).toBeInTheDocument();
  });

  it('clears previous success message before a new submit attempt', async () => {
    const { currentPasswordInput, newPasswordInput, confirmNewPasswordInput, submitButton } = setup();

    fireEvent.change(currentPasswordInput, { target: { value: 'OldPassword1!' } });
    fireEvent.change(newPasswordInput, { target: { value: 'NewPassword1!' } });
    fireEvent.change(confirmNewPasswordInput, { target: { value: 'NewPassword1!' } });

    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText(/password changed successfully/i)
      ).toBeInTheDocument();
    });

    fireEvent.click(submitButton);

    expect(
      screen.queryByText(/password changed successfully/i)
    ).not.toBeInTheDocument();
    expect(screen.getByText(/all password fields are required/i)).toBeInTheDocument();
  });

  it('disables submit button and shows loading state while request is pending', async () => {
    const pending = deferred<void>();
    mockChangePassword.mockReturnValue(pending.promise);

    const { currentPasswordInput, newPasswordInput, confirmNewPasswordInput, submitButton } = setup();

    fireEvent.change(currentPasswordInput, { target: { value: 'OldPassword1!' } });
    fireEvent.change(newPasswordInput, { target: { value: 'NewPassword1!' } });
    fireEvent.change(confirmNewPasswordInput, { target: { value: 'NewPassword1!' } });

    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockChangePassword).toHaveBeenCalled();
    });

    expect(submitButton).toBeDisabled();

    await act(async () => {
      pending.resolve(undefined);
    });
  });

  it('queues a logout redirect to /login after 1200ms on success', async () => {
    const { currentPasswordInput, newPasswordInput, confirmNewPasswordInput, submitButton } = setup();

    fireEvent.change(currentPasswordInput, { target: { value: 'OldPassword1!' } });
    fireEvent.change(newPasswordInput, { target: { value: 'NewPassword1!' } });
    fireEvent.change(confirmNewPasswordInput, { target: { value: 'NewPassword1!' } });

    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockChangePassword).toHaveBeenCalled();
    });

    expect(mockPerformLogoutRedirect).not.toHaveBeenCalled();

    await act(async () => {
      jest.advanceTimersByTime(1199);
    });

    expect(mockPerformLogoutRedirect).not.toHaveBeenCalled();

    await act(async () => {
      jest.advanceTimersByTime(1);
    });

    await waitFor(() => {
      expect(mockPerformLogoutRedirect).toHaveBeenCalledWith('/login', {
        message: 'Password changed. Sign in again.',
        type: 'success',
      });
    });
  });

  it('does not logout or redirect when validation fails', () => {
    const { submitButton } = setup();

    fireEvent.click(submitButton);

    expect(mockChangePassword).not.toHaveBeenCalled();
    expect(mockPerformLogoutRedirect).not.toHaveBeenCalled();
  });

  it('does not logout or redirect when API call fails', async () => {
    mockChangePassword.mockRejectedValue(new Error('API failure'));

    const { currentPasswordInput, newPasswordInput, confirmNewPasswordInput, submitButton } = setup();

    fireEvent.change(currentPasswordInput, { target: { value: 'OldPassword1!' } });
    fireEvent.change(newPasswordInput, { target: { value: 'NewPassword1!' } });
    fireEvent.change(confirmNewPasswordInput, { target: { value: 'NewPassword1!' } });

    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockChangePassword).toHaveBeenCalled();
    });

    await act(async () => {
      jest.advanceTimersByTime(1200);
    });

    expect(mockPerformLogoutRedirect).not.toHaveBeenCalled();
  });

  it('re-enables submit button after a failed request', async () => {
    mockChangePassword.mockRejectedValue(new Error('API failure'));

    const { currentPasswordInput, newPasswordInput, confirmNewPasswordInput, submitButton } = setup();

    fireEvent.change(currentPasswordInput, { target: { value: 'OldPassword1!' } });
    fireEvent.change(newPasswordInput, { target: { value: 'NewPassword1!' } });
    fireEvent.change(confirmNewPasswordInput, { target: { value: 'NewPassword1!' } });

    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockChangePassword).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(submitButton).not.toBeDisabled();
    });
  });

  it('re-enables submit button after a successful request', async () => {
    const { currentPasswordInput, newPasswordInput, confirmNewPasswordInput, submitButton } = setup();

    fireEvent.change(currentPasswordInput, { target: { value: 'OldPassword1!' } });
    fireEvent.change(newPasswordInput, { target: { value: 'NewPassword1!' } });
    fireEvent.change(confirmNewPasswordInput, { target: { value: 'NewPassword1!' } });

    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockChangePassword).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(submitButton).not.toBeDisabled();
    });
  });
});
