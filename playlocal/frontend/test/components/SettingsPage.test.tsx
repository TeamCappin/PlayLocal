import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SettingsPage } from '@/components/SettingsPage';
import { privacyApi, usersApi } from '@/lib/api';
import { toast } from '@/lib/toast';

const mockPush = jest.fn();
const mockLogout = jest.fn().mockResolvedValue(undefined);

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    get push() {
      return mockPush;
    },
  }),
}));

jest.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    user: {
      userId: 'user-1',
      displayName: 'Test User',
      email: 'test@example.com',
    },
    get logout() {
      return mockLogout;
    },
  }),
}));

jest.mock('@/lib/api', () => ({
  privacyApi: {
    getSettings: jest.fn(),
    updateSettings: jest.fn(),
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

describe('SettingsPage - Security account actions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSettings.mockResolvedValue(defaultSettings);
    mockUpdateSettings.mockResolvedValue(defaultSettings);
    mockDeactivateAccount.mockResolvedValue(undefined);
    mockDeleteAccount.mockResolvedValue(undefined);
  });

  async function openSecurityTab() {
    render(<SettingsPage />);
    fireEvent.click(screen.getByText('Security & Safety'));
    await waitFor(() =>
      expect(screen.getByText('Account Actions')).toBeInTheDocument()
    );
  }

  it('deactivates account, toasts, logs out, and redirects home', async () => {
    await openSecurityTab();

    fireEvent.click(screen.getByText('Deactivate Account'));
    expect(await screen.findByText('Deactivate Account?')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Deactivate Account' }));

    await waitFor(() => {
      expect(mockDeactivateAccount).toHaveBeenCalled();
    });

    expect(toast.success).toHaveBeenCalledWith('Account deactivated');
    await waitFor(() => {
      expect(mockLogout).toHaveBeenCalled();
    });
    expect(mockPush).toHaveBeenCalledWith('/');
  });

  it('deletes account after typing DELETE, then logs out', async () => {
    await openSecurityTab();

    fireEvent.click(screen.getByText('Delete Account'));
    expect(
      await screen.findByText('Permanently Delete Account?')
    ).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText('DELETE'), {
      target: { value: 'DELETE' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Delete Forever' }));

    await waitFor(() => {
      expect(mockDeleteAccount).toHaveBeenCalled();
    });

    expect(toast.success).toHaveBeenCalledWith('Account deleted');
    await waitFor(() => {
      expect(mockLogout).toHaveBeenCalled();
    });
    expect(mockPush).toHaveBeenCalledWith('/');
  });

  it('shows toast error when deactivate fails', async () => {
    mockDeactivateAccount.mockRejectedValueOnce(new Error('server said no'));
    await openSecurityTab();

    fireEvent.click(screen.getByText('Deactivate Account'));
    fireEvent.click(
      await screen.findByRole('button', { name: 'Deactivate Account' })
    );

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalled();
    });
  });
});
