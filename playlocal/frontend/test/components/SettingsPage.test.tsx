import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SettingsPage } from '@/components/SettingsPage';
import { privacyApi } from '@/lib/api';

// Mock the auth context
jest.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    user: {
      userId: 'user-1',
      displayName: 'Test User',
      email: 'test@example.com',
    },
  }),
}));

// Mock the privacy API
jest.mock('@/lib/api', () => ({
  privacyApi: {
    getSettings: jest.fn(),
    updateSettings: jest.fn(),
  },
}));

const mockGetSettings = privacyApi.getSettings as jest.Mock;
const mockUpdateSettings = privacyApi.updateSettings as jest.Mock;

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

    // Should have 1 select element (profile visibility)
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

    // First select is Profile Visibility
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

    // Wait for the error to be captured by the parent component
    await waitFor(() => {
      expect(mockGetSettings).toHaveBeenCalled();
    });

    // Click Privacy tab to see the error
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

    // Find the toggle button for "Allow Profile Search"
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
