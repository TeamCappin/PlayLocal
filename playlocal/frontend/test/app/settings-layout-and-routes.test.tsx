import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import SettingsLayout from '@/app/settings/layout';
import SettingsHubPage from '@/app/settings/page';
import AccountSettingsPage from '@/app/settings/account/page';
import PrivacySettingsPage from '@/app/settings/privacy/page';
import NotificationsSettingsPage from '@/app/settings/notifications/page';
import ProfileSettingsPage from '@/app/settings/profile/page';
import DeactivationSettingsPage from '@/app/settings/deactivation/page';
import { useAuth } from '@/context/AuthContext';

jest.mock('@/lib/api', () => {
  const actual = jest.requireActual<typeof import('@/lib/api')>('@/lib/api');
  return {
    ...actual,
    privacyApi: {
      ...actual.privacyApi,
      getSettings: jest.fn().mockResolvedValue({
        profileVisibility: 'public',
        skillsVisibility: 'public',
        historyVisibility: 'public',
        mediaDefaultVisibility: 'participants',
        locationVisibilityRule: 'confirmed_only',
        allowProfileSearch: true,
      }),
    },
  };
});

jest.mock('next/link', () => ({
  __esModule: true,
  default({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
  }) {
    return (
      <a href={href} {...rest}>
        {children}
      </a>
    );
  },
}));

jest.mock('@/components/PasswordChangeCard', () => ({
  PasswordChangeCard: () => <div data-testid="password-change-card" />,
}));

jest.mock('@/context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({ replace: jest.fn() }),
  usePathname: () => '/settings',
}));

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

function baseAuth(): ReturnType<typeof useAuth> {
  return {
    user: {
      userId: 'u1',
      email: 'test@example.com',
      displayName: 'Test User',
      reliabilityScore: 80,
      gamesCount: 1,
    },
    isAuthenticated: true,
    isLoading: false,
    login: jest.fn(),
    verifyMfa: jest.fn(),
    register: jest.fn(),
    logout: jest.fn(),
    refreshUser: jest.fn(),
    retryAuthCheck: jest.fn(),
    error: null,
  };
}

describe('SettingsLayout (app/settings/layout)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows SettingsLoading while auth is loading', () => {
    mockUseAuth.mockReturnValue({
      ...baseAuth(),
      user: null,
      isAuthenticated: false,
      isLoading: true,
    });

    render(
      <SettingsLayout>
        <p>child</p>
      </SettingsLayout>
    );

    expect(screen.getByText('Loading settings…')).toBeInTheDocument();
  });

  it('shows SettingsError with retry when auth error is set', async () => {
    const retryAuthCheck = jest.fn().mockResolvedValue(undefined);
    mockUseAuth.mockReturnValue({
      ...baseAuth(),
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: 'Session check failed',
      retryAuthCheck,
    });

    render(
      <SettingsLayout>
        <p>child</p>
      </SettingsLayout>
    );

    expect(screen.getByText('Session check failed')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /try again/i }));
    expect(retryAuthCheck).toHaveBeenCalled();
  });

  it('renders children when authenticated', () => {
    mockUseAuth.mockReturnValue(baseAuth());

    render(
      <SettingsLayout>
        <p>inside-settings</p>
      </SettingsLayout>
    );

    expect(screen.getByText('inside-settings')).toBeInTheDocument();
  });
});

describe('Settings route pages', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue(baseAuth());
  });

  it('settings/page renders Settings hub', () => {
    render(<SettingsHubPage />);
    expect(screen.getByRole('heading', { name: 'Settings' })).toBeInTheDocument();
    expect(
      screen.getByText(/Manage your account and privacy preferences/i)
    ).toBeInTheDocument();
  });

  it('account page renders back link and account section', () => {
    render(<AccountSettingsPage />);
    expect(screen.getByRole('link', { name: /back to settings/i })).toHaveAttribute(
      'href',
      '/settings'
    );
    expect(screen.getByTestId('password-change-card')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Safety & Moderation' })
    ).toBeInTheDocument();
  });

  it('privacy page renders back link and privacy heading', async () => {
    render(<PrivacySettingsPage />);
    expect(screen.getByRole('link', { name: /back to settings/i })).toHaveAttribute(
      'href',
      '/settings'
    );
    expect(
      await screen.findByRole('heading', { name: 'Profile Visibility' })
    ).toBeInTheDocument();
  });

  it('notifications page renders back link and notification heading', () => {
    render(<NotificationsSettingsPage />);
    expect(screen.getByRole('link', { name: /back to settings/i })).toHaveAttribute(
      'href',
      '/settings'
    );
    expect(
      screen.getByRole('heading', { name: 'Notification Preferences' })
    ).toBeInTheDocument();
  });

  it('profile page renders profile information heading', () => {
    render(<ProfileSettingsPage />);
    expect(screen.getByRole('link', { name: /back to settings/i })).toHaveAttribute(
      'href',
      '/settings'
    );
    expect(
      screen.getByRole('heading', { name: 'Profile Information' })
    ).toBeInTheDocument();
  });

  it('deactivation page renders back link and account actions', () => {
    render(<DeactivationSettingsPage />);
    expect(screen.getByRole('link', { name: /back to settings/i })).toHaveAttribute(
      'href',
      '/settings'
    );
    expect(screen.getByText('Deactivate Account')).toBeInTheDocument();
    expect(screen.getByText('Delete Account')).toBeInTheDocument();
  });
});
