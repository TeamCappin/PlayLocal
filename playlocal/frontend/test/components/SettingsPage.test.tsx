import type { ReactNode } from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import {
  SettingsPage,
  SettingsHub,
  SettingsLoading,
  SettingsError,
  AccountSettings,
  PrivacySettings,
  ProfileSettings,
} from '@/components/SettingsPage';
import { privacyApi, usersApi, authApi } from '@/lib/api';
import { toast } from '@/lib/toast';

const mockPerformLogoutRedirect = jest.fn();
const mockUseAuth = jest.fn();

jest.mock('next/link', () => ({
  __esModule: true,
  default({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: ReactNode;
  }) {
    return (
      <a href={href} {...rest}>
        {children}
      </a>
    );
  },
}));

jest.mock('@/context/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock('@/lib/api', () => ({
  privacyApi: {
    getSettings: jest.fn(),
    updateSettings: jest.fn(),
  },
  authApi: {
    getMfaStatus: jest.fn(),
    enableMfa: jest.fn(),
    disableMfa: jest.fn(),
  },
  usersApi: {
    deactivateAccount: jest.fn(),
    deleteAccount: jest.fn(),
  },
}));

jest.mock('@/components/PasswordChangeCard', () => ({
  PasswordChangeCard: () => (
    <div data-testid="password-change-card">
      <input placeholder="Enter current password" />
      <input placeholder="Enter new password" />
      <button type="button">Update Password</button>
    </div>
  ),
}));

jest.mock('@/lib/toast', () => {
  const actual = jest.requireActual('@/lib/toast');
  return {
    ...actual,
    toast: {
      ...actual.toast,
      success: jest.fn(),
      error: jest.fn(),
    },
  };
});

jest.mock('@/lib/authRedirect', () => ({
  performLogoutRedirect: (...args: unknown[]) =>
    mockPerformLogoutRedirect(...args),
}));

const mockGetSettings = privacyApi.getSettings as jest.Mock;
const mockUpdateSettings = privacyApi.updateSettings as jest.Mock;
const mockDeactivateAccount = usersApi.deactivateAccount as jest.Mock;
const mockDeleteAccount = usersApi.deleteAccount as jest.Mock;

const defaultSettings = {
  profileVisibility: 'public',
  skillsVisibility: 'public',
  historyVisibility: 'friends',
  mediaDefaultVisibility: 'participants',
  locationVisibilityRule: 'confirmed_only',
  allowProfileSearch: true,
};

describe('SettingsPage - Privacy Tab', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({
      user: {
        userId: 'user-1',
        displayName: 'Test User',
        email: 'test@example.com',
      },
      logout: jest.fn(),
    });
    mockGetSettings.mockResolvedValue(defaultSettings);
    mockUpdateSettings.mockResolvedValue(defaultSettings);
  });

  it('renders the settings page with navigation tabs', () => {
    render(<SettingsPage />);
    expect(screen.getByText('Account')).toBeInTheDocument();
    expect(screen.getByText('Privacy')).toBeInTheDocument();
    expect(screen.getByText('Notifications')).toBeInTheDocument();
    expect(screen.getByText('Security & Safety')).toBeInTheDocument();
  });

  it('loads privacy settings when Privacy tab is clicked', async () => {
    render(<SettingsPage />);

    fireEvent.click(screen.getByText('Privacy'));

    expect(screen.getByText('Loading privacy settings...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Allow Profile Search')).toBeInTheDocument();
    });

    expect(mockGetSettings).toHaveBeenCalledTimes(1);
  });

  it('displays loaded privacy settings with correct selects', async () => {
    render(<SettingsPage />);
    fireEvent.click(screen.getByText('Privacy'));

    await waitFor(() => {
      expect(screen.getByText('Allow Profile Search')).toBeInTheDocument();
    });

    const selects = screen.getAllByRole('combobox');
    expect(selects).toHaveLength(5);
    expect(selects[0]).toHaveValue('Public');
    expect(selects[1]).toHaveValue('Public');
    expect(selects[2]).toHaveValue('Friends Only');
    expect(selects[3]).toHaveValue('Participants');
    expect(selects[4]).toHaveValue('After Accepted');
  });

  it('toggles ad personalization boundary from disabled to enabled payload', async () => {
    mockGetSettings.mockResolvedValue({
      ...defaultSettings,
      adPersonalizationEnabled: false,
    });
    mockUpdateSettings.mockResolvedValue({
      ...defaultSettings,
      adPersonalizationEnabled: true,
    });

    render(<SettingsPage />);
    fireEvent.click(screen.getByText('Privacy'));

    const toggle = await screen.findByRole('button', {
      name: 'Disable Ad Personalization',
    });
    expect(toggle).toHaveAttribute('aria-pressed', 'true');

    fireEvent.click(toggle);

    await waitFor(() => {
      expect(mockUpdateSettings).toHaveBeenCalledWith({
        adPersonalizationEnabled: true,
      });
    });
  });

  it('builds DSAR mailto with boundary missing optional user fields', () => {
    mockUseAuth.mockReturnValue({
      user: {
        userId: 'user-1',
        email: 'test@example.com',
      },
      logout: jest.fn(),
    });

    render(
      <PrivacySettings
        initialSettings={defaultSettings as any}
        initialLoading={false}
      />
    );

    const dsarLink = screen.getByRole('link', { name: /Request My Data/i });
    const href = dsarLink.getAttribute('href') || '';
    const bodyParam = href.split('&body=')[1] || '';
    const decodedBody = decodeURIComponent(bodyParam);

    expect(href.startsWith('mailto:playlocal.mgdfd@simplelogin.com?subject=')).toBe(true);
    expect(decodedBody).toContain('Account email: test@example.com');
    expect(decodedBody).toContain('User ID: user-1');
    expect(decodedBody).not.toContain('Display name:');
  });

  it('calls updateSettings when a privacy setting is changed', async () => {
    const updatedSettings = { ...defaultSettings, profileVisibility: 'private' };
    mockUpdateSettings.mockResolvedValue(updatedSettings);

    render(<SettingsPage />);
    fireEvent.click(screen.getByText('Privacy'));

    await waitFor(() => {
      expect(screen.getByText('Allow Profile Search')).toBeInTheDocument();
    });

    const selects = screen.getAllByRole('combobox');
    fireEvent.change(selects[0], { target: { value: 'Private' } });

    await waitFor(() => {
      expect(mockUpdateSettings).toHaveBeenCalledWith({
        profileVisibility: 'private',
      });
    });
  });

  it('shows error message when loading fails', async () => {
    mockGetSettings.mockRejectedValue(new Error('Network error'));

    render(<SettingsPage />);

    await waitFor(() => {
      expect(mockGetSettings).toHaveBeenCalled();
    });

    fireEvent.click(screen.getByText('Privacy'));

    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });
  });

  it('shows success message after saving', async () => {
    const updatedSettings = { ...defaultSettings, allowProfileSearch: false };
    mockUpdateSettings.mockResolvedValue(updatedSettings);

    render(<SettingsPage />);
    fireEvent.click(screen.getByText('Privacy'));

    await waitFor(() => {
      expect(screen.getByText('Allow Profile Search')).toBeInTheDocument();
    });

    const allButtons = screen.getAllByRole('button');
    const toggleButton = allButtons.find((btn) => {
      const parent = btn.closest('.flex.items-start');
      return parent?.textContent?.includes('Allow Profile Search');
    });

    expect(toggleButton).toBeDefined();
    fireEvent.click(toggleButton!);

    await waitFor(() => {
      expect(mockUpdateSettings).toHaveBeenCalledWith({
        allowProfileSearch: false,
      });
    });

    await waitFor(() => {
      expect(screen.getByText('Privacy settings saved')).toBeInTheDocument();
    });
  });
});

const mockGetMfaStatus = authApi.getMfaStatus as jest.Mock;
const mockEnableMfa = authApi.enableMfa as jest.Mock;
const mockDisableMfa = authApi.disableMfa as jest.Mock;

describe('SettingsPage - Security Tab (MFA)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSettings.mockResolvedValue(defaultSettings);
  });

  it('renders MFA section with "Enable MFA" button when MFA is disabled', async () => {
    mockGetMfaStatus.mockResolvedValue({ mfaEnabled: false });

    render(<SettingsPage />);
    fireEvent.click(screen.getByText('Security & Safety'));

    await waitFor(() => {
      expect(screen.getByText('Currently disabled')).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: 'Enable MFA' })).toBeInTheDocument();
  });

  it('renders "Disable MFA" button when MFA is enabled', async () => {
    mockGetMfaStatus.mockResolvedValue({ mfaEnabled: true });

    render(<SettingsPage />);
    fireEvent.click(screen.getByText('Security & Safety'));

    await waitFor(() => {
      expect(screen.getByText('Currently enabled')).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: 'Disable MFA' })).toBeInTheDocument();
  });

  it('enables MFA when "Enable MFA" button is clicked', async () => {
    mockGetMfaStatus.mockResolvedValue({ mfaEnabled: false });
    mockEnableMfa.mockResolvedValue(undefined);

    render(<SettingsPage />);
    fireEvent.click(screen.getByText('Security & Safety'));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Enable MFA' })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Enable MFA' }));

    await waitFor(() => {
      expect(mockEnableMfa).toHaveBeenCalledTimes(1);
    });

    await waitFor(() => {
      expect(screen.getByText(/MFA has been enabled/i)).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: 'Disable MFA' })).toBeInTheDocument();
  });

  it('disables MFA when "Disable MFA" button is clicked', async () => {
    mockGetMfaStatus.mockResolvedValue({ mfaEnabled: true });
    mockDisableMfa.mockResolvedValue(undefined);

    render(<SettingsPage />);
    fireEvent.click(screen.getByText('Security & Safety'));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Disable MFA' })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Disable MFA' }));

    await waitFor(() => {
      expect(mockDisableMfa).toHaveBeenCalledTimes(1);
    });

    await waitFor(() => {
      expect(screen.getByText(/MFA has been disabled/i)).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: 'Enable MFA' })).toBeInTheDocument();
  });

  it('shows error message when MFA toggle fails', async () => {
    mockGetMfaStatus.mockResolvedValue({ mfaEnabled: false });
    mockEnableMfa.mockRejectedValue(new Error('Server error'));

    render(<SettingsPage />);
    fireEvent.click(screen.getByText('Security & Safety'));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Enable MFA' })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Enable MFA' }));

    await waitFor(() => {
      expect(screen.getByText(/Failed to update MFA setting/i)).toBeInTheDocument();
    });
  });

  it('shows "Updating..." while MFA toggle is in progress', async () => {
    mockGetMfaStatus.mockResolvedValue({ mfaEnabled: false });
    let resolveEnable!: () => void;
    mockEnableMfa.mockImplementation(
      () => new Promise<void>((resolve) => { resolveEnable = resolve; })
    );

    render(<SettingsPage />);
    fireEvent.click(screen.getByText('Security & Safety'));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Enable MFA' })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Enable MFA' }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Updating...' })).toBeInTheDocument();
    });

    resolveEnable();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Disable MFA' })).toBeInTheDocument();
    });
  });
});

describe('Settings hub UI', () => {
  describe('SettingsHub', () => {
    it('renders Settings heading and description', () => {
      render(<SettingsHub />);
      expect(screen.getByRole('heading', { name: 'Settings' })).toBeInTheDocument();
      expect(
        screen.getByText(/Manage your account and privacy preferences/i)
      ).toBeInTheDocument();
    });

    it('renders all five section links with correct labels', () => {
      render(<SettingsHub />);
      expect(screen.getByText('Account')).toBeInTheDocument();
      expect(screen.getByText('Privacy / Visibility')).toBeInTheDocument();
      expect(screen.getByText('Profile')).toBeInTheDocument();
      expect(screen.getByText('Notifications')).toBeInTheDocument();
      expect(screen.getByText('Deactivation')).toBeInTheDocument();
    });

    it('renders section descriptions', () => {
      render(<SettingsHub />);
      expect(screen.getByText(/Password & security/i)).toBeInTheDocument();
      expect(screen.getByText(/Profile and location privacy/i)).toBeInTheDocument();
      expect(screen.getByText(/Display name, bio, preferences/i)).toBeInTheDocument();
      expect(screen.getByText(/Game, social & email preferences/i)).toBeInTheDocument();
      expect(screen.getByText(/Deactivate or delete account/i)).toBeInTheDocument();
    });
  });

  describe('SettingsLoading', () => {
    it('renders loading message', () => {
      render(<SettingsLoading />);
      expect(screen.getByText(/Loading settings…/i)).toBeInTheDocument();
    });
  });

  describe('SettingsError', () => {
    it('renders error heading and message', () => {
      render(<SettingsError message="Network error" onRetry={() => {}} />);
      expect(screen.getByText(/Couldn't load settings/i)).toBeInTheDocument();
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });

    it('renders Try again button and calls onRetry when clicked', () => {
      const onRetry = jest.fn();
      render(<SettingsError message="Something went wrong" onRetry={onRetry} />);
      const button = screen.getByRole('button', { name: /Try again/i });
      expect(button).toBeInTheDocument();
      fireEvent.click(button);
      expect(onRetry).toHaveBeenCalledTimes(1);
    });
  });

  describe('AccountSettings', () => {
    it('renders PasswordChangeCard and Safety & Moderation', () => {
      render(<AccountSettings />);
      expect(screen.getByTestId('password-change-card')).toBeInTheDocument();
      expect(
        screen.getByRole('heading', { name: 'Safety & Moderation' })
      ).toBeInTheDocument();
    });
  });

  describe('PrivacySettings', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      mockGetSettings.mockResolvedValue(defaultSettings);
    });

    it('renders profile visibility card heading', async () => {
      render(<PrivacySettings />);
      await waitFor(() => {
        expect(
          screen.getByRole('heading', { name: 'Profile Visibility' })
        ).toBeInTheDocument();
      });
    });

    it('shows rejected string as error message for standalone load', async () => {
      mockGetSettings.mockRejectedValue('bad');
      render(<PrivacySettings />);
      await waitFor(() => {
        expect(screen.getByText('bad')).toBeInTheDocument();
      });
    });

    it('shows fallback when getSettings rejects a non-Error object', async () => {
      mockGetSettings.mockRejectedValue({ notAnError: true });
      render(<PrivacySettings />);
      await waitFor(() => {
        expect(
          screen.getByText('Failed to load privacy settings')
        ).toBeInTheDocument();
      });
    });
  });

  describe('ProfileSettings', () => {
    it('renders profile information heading and fields', () => {
      render(
        <ProfileSettings
          user={{ displayName: 'Test User', email: 'test@example.com' }}
        />
      );
      expect(
        screen.getByRole('heading', { name: 'Profile Information' })
      ).toBeInTheDocument();
    });

    it('shows an error toast when Save Changes is clicked', () => {
      render(
        <ProfileSettings
          user={{ displayName: 'Test User', email: 'test@example.com' }}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }));

      expect(toast.error).toHaveBeenCalledWith(
        'Phone edit is not available at this time.'
      );
    });
  });
});

describe('SettingsHub navigation', () => {
  it('SettingsHub links point to correct settings subpaths', () => {
    render(<SettingsHub />);
    const links = screen.getAllByRole('link');
    const hrefs = links.map((el) => el.getAttribute('href'));
    expect(hrefs).toContain('/settings/account');
    expect(hrefs).toContain('/settings/privacy');
    expect(hrefs).toContain('/settings/profile');
    expect(hrefs).toContain('/settings/notifications');
    expect(hrefs).toContain('/settings/deactivation');
  });

  it('each section link is clickable (has href)', () => {
    render(<SettingsHub />);
    const accountLink = screen
      .getAllByRole('link')
      .find((el) => el.getAttribute('href') === '/settings/account');
    expect(accountLink).toBeInTheDocument();
    const privacyLink = screen
      .getAllByRole('link')
      .find((el) => el.getAttribute('href') === '/settings/privacy');
    expect(privacyLink).toBeInTheDocument();
  });
});
