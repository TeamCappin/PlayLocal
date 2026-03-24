import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SettingsPage } from '@/components/SettingsPage';
import { privacyApi, usersApi } from '@/lib/api';
import { toast } from '@/lib/toast';

const mockPerformLogoutRedirect = jest.fn();

jest.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    user: {
      userId: 'user-1',
      displayName: 'Test User',
      email: 'test@example.com',
    },
    logout: jest.fn(),
  }),
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

// Mock the APIs
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
    expect(selects.length).toBe(1);
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
