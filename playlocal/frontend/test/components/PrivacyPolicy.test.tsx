import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { PrivacyPolicy } from '@/components/legal/PrivacyPolicy';
import { PrivacyPolicyBanner } from '@/components/legal/PrivacyPolicyBanner';
import { useAuth } from '@/context/AuthContext';
import { privacyPolicyApi } from '@/lib/api';
import { toast } from '@/lib/toast';

const POLICY_UPDATE_ADMIN_EMAIL = 'playlocal.mgdfd@simplelogin.com';

jest.mock('@/context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

jest.mock('@/lib/api', () => ({
  privacyPolicyApi: {
    getStatus: jest.fn(),
    triggerUpdate: jest.fn(),
  },
}));

jest.mock('@/lib/toast', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
  getActionableErrorMessage: jest.fn((error: unknown, fallback: string) =>
    error instanceof Error ? error.message : fallback
  ),
}));

const mockUseAuth = useAuth as jest.Mock;
const mockGetStatus = privacyPolicyApi.getStatus as jest.Mock;
const mockTriggerUpdate = privacyPolicyApi.triggerUpdate as jest.Mock;

describe('PrivacyPolicy', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: {
        userId: 'admin-user-id',
        email: POLICY_UPDATE_ADMIN_EMAIL,
      },
    });
    mockGetStatus.mockResolvedValue({
      lastUpdated: '2026-04-15',
      effectiveDate: '2026-05-15',
      updatedByEmail: null,
      bannerVisible: false,
      notice: 'Continued use of the Service after 2026-04-15 constitutes acknowledgement and acceptance of these changes.',
    });
  });

  it('renders the trigger button for authenticated users and calls the update endpoint', async () => {
    mockTriggerUpdate.mockResolvedValue({
      lastUpdated: '2026-05-07',
      effectiveDate: '2026-06-06',
      updatedByEmail: 'user@example.com',
      bannerVisible: true,
      notice: 'Continued use of the Service after 2026-05-07 constitutes acknowledgement and acceptance of these changes.',
      recipientsTargeted: 3,
      emailsSent: 3,
      emailsFailed: 0,
    });

    render(<PrivacyPolicy />);

    await waitFor(() => {
      expect(screen.getByText('Date effective: 2026-04-15')).toBeInTheDocument();
    });

    const button = screen.getByRole('button', {
      name: /Trigger privacy policy update/i,
    });
    fireEvent.click(button);

    await waitFor(() => {
      expect(mockTriggerUpdate).toHaveBeenCalledWith({
        triggeredByEmail: POLICY_UPDATE_ADMIN_EMAIL,
      });
    });

    expect(toast.success).not.toHaveBeenCalled();
  });

  it('hides the trigger button for unauthenticated users', async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      user: null,
    });

    render(<PrivacyPolicy />);

    await waitFor(() => {
      expect(screen.getByText('Date effective: 2026-04-15')).toBeInTheDocument();
    });

    expect(
      screen.queryByRole('button', { name: /Trigger privacy policy update/i })
    ).not.toBeInTheDocument();
  });

  it('hides the trigger button for authenticated non-admin email', async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: {
        userId: 'regular-user-id',
        email: 'user@example.com',
      },
    });

    render(<PrivacyPolicy />);

    await waitFor(() => {
      expect(screen.getByText('Date effective: 2026-04-15')).toBeInTheDocument();
    });

    expect(
      screen.queryByRole('button', { name: /Trigger privacy policy update/i })
    ).not.toBeInTheDocument();
  });
});

describe('PrivacyPolicyBanner', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    sessionStorage.clear();
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: {
        userId: 'some-user-id',
        email: 'user@example.com',
      },
    });
    mockGetStatus.mockResolvedValue({
      lastUpdated: '2026-05-07',
      effectiveDate: '2026-06-06',
      updatedByEmail: 'user@example.com',
      bannerVisible: true,
      notice: 'Continued use of the Service after 2026-05-07 constitutes acknowledgement and acceptance of these changes.',
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('shows the login banner then fully hides after 20 seconds', async () => {
    render(<PrivacyPolicyBanner />);

    await waitFor(() => {
      expect(document.getElementById('privacy-policy-login-banner')).toBeInTheDocument();
      expect(screen.getByText('Policy Updated')).toBeInTheDocument();
    });

    act(() => {
      jest.advanceTimersByTime(20_000);
    });

    await waitFor(() => {
      expect(document.getElementById('privacy-policy-login-banner')).toBeNull();
    });
  });

  it('does not reopen forever for same user/policy after dismissal', async () => {
    render(<PrivacyPolicyBanner />);

    await waitFor(() => {
      expect(document.getElementById('privacy-policy-login-banner')).toBeInTheDocument();
    });

    act(() => {
      jest.advanceTimersByTime(20_000);
    });

    await waitFor(() => {
      expect(document.getElementById('privacy-policy-login-banner')).toBeNull();
    });

    act(() => {
      window.dispatchEvent(new Event('playlocal-privacy-policy-updated'));
    });

    await waitFor(() => {
      expect(mockGetStatus).toHaveBeenCalledTimes(2);
    });

    expect(document.getElementById('privacy-policy-login-banner')).toBeNull();
  });

  it('does not reopen after remount in the same session for the same user/policy', async () => {
    const { unmount } = render(<PrivacyPolicyBanner />);

    await waitFor(() => {
      expect(document.getElementById('privacy-policy-login-banner')).toBeInTheDocument();
    });

    act(() => {
      jest.advanceTimersByTime(20_000);
    });

    await waitFor(() => {
      expect(document.getElementById('privacy-policy-login-banner')).toBeNull();
    });

    unmount();
    render(<PrivacyPolicyBanner />);

    await waitFor(() => {
      expect(mockGetStatus).toHaveBeenCalledTimes(2);
    });

    expect(document.getElementById('privacy-policy-login-banner')).toBeNull();
  });

  it('does not render for unauthenticated users', async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      user: null,
    });

    const { container } = render(<PrivacyPolicyBanner />);

    await waitFor(() => {
      expect(mockGetStatus).not.toHaveBeenCalled();
    });

    expect(container.firstChild).toBeNull();
  });
});