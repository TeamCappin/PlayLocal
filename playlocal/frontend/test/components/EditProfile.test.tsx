// test/components/EditProfile.test.tsx
import React from 'react';
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from '@testing-library/react';
import '@testing-library/jest-dom';
import { EditProfile } from '@/components/EditProfile';
import { useAuth } from '@/context/AuthContext';
import { usersApi } from '@/lib/api';

const pushMock = jest.fn();
const replaceMock = jest.fn();
const backMock = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: pushMock,
    replace: replaceMock,
    back: backMock,
  }),
}));

// next/link in tests
jest.mock('next/link', () => {
  return ({ href, children, ...rest }: any) => (
    <a href={href} {...rest}>
      {children}
    </a>
  );
});

jest.mock('@/context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

jest.mock('@/lib/api', () => ({
  usersApi: {
    updateProfile: jest.fn(),
  },
}));

// Provide small constant option sets so tests can click buttons deterministically.
jest.mock('@/lib/constants', () => {
  const DummyIcon = (props: any) => <svg data-testid="DummyIcon" {...props} />;
  return {
    INTENSITY_OPTIONS: [
      { id: 'CASUAL', label: 'Casual', description: 'desc', icon: DummyIcon },
      {
        id: 'COMPETITIVE',
        label: 'Competitive',
        description: 'desc',
        icon: DummyIcon,
      },
      {
        id: 'BEGINNER',
        label: 'Beginner',
        description: 'desc',
        icon: DummyIcon,
      },
    ],
    AVAILABILITY_OPTIONS: [
      { id: 'MORNINGS', label: 'Mornings', icon: DummyIcon },
      { id: 'EVENINGS', label: 'Evenings', icon: DummyIcon },
    ],
  };
});

const mockedUseAuth = useAuth as unknown as jest.Mock;
const mockedUsersApi = usersApi as unknown as { updateProfile: jest.Mock };

function setAuthState({
  isAuthenticated,
  user,
  refreshUser,
}: {
  isAuthenticated: boolean;
  user: any;
  refreshUser?: jest.Mock;
}) {
  mockedUseAuth.mockReturnValue({
    user,
    isAuthenticated,
    refreshUser: refreshUser ?? jest.fn().mockResolvedValue(undefined),
  });
}

describe('EditProfile', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUsersApi.updateProfile.mockResolvedValue({
      slug: 'john-doe',
    });
  });

  it('returns null when not authenticated', () => {
    setAuthState({
      isAuthenticated: false,
      user: null,
    });

    const { container } = render(<EditProfile />);
    expect(container.firstChild).toBeNull();
    expect(mockedUsersApi.updateProfile).not.toHaveBeenCalled();
  });

  it('initializes form fields from user data and renders reliability score', async () => {
    setAuthState({
      isAuthenticated: true,
      user: {
        displayName: 'John Doe',
        defaultIntensity: 'CASUAL',
        availability: 'MORNINGS,EVENINGS',
        bio: 'Hello!',
        location: 'Montreal',
        reliabilityScore: 87.6,
      },
    });

    render(<EditProfile />);
    expect(
      screen.getByPlaceholderText(/your display name/i)
    ).toBeInTheDocument();
    expect(screen.getByText('88%')).toBeInTheDocument(); // rounded

    // Back link should point to slugified display name
    expect(screen.getByRole('link', { name: /back/i })).toHaveAttribute(
      'href',
      '/profile/john-doe'
    );
  });

  it('toggles availability on click', async () => {
    setAuthState({
      isAuthenticated: true,
      user: {
        displayName: 'John Doe',
        defaultIntensity: '',
        availability: '',
        bio: '',
        location: '',
        reliabilityScore: 100,
      },
    });

    render(<EditProfile />);

    // Click "Mornings" availability button to add it.
    fireEvent.click(screen.getByRole('button', { name: /mornings/i }));
    // Click again to remove it.
    fireEvent.click(screen.getByRole('button', { name: /mornings/i }));

    // No direct UI state text, but we can ensure save payload reflects final state.
    mockedUsersApi.updateProfile.mockResolvedValueOnce({ slug: 'john-doe' });

    // Required fields: displayName required; set it and intensity at least one
    fireEvent.click(screen.getByRole('button', { name: /casual/i })); // intensity

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /save changes/i }));
    });

    expect(mockedUsersApi.updateProfile).toHaveBeenCalledWith(
      expect.objectContaining({
        availability: '', // toggled twice => empty
      })
    );
  });

  it('preview public profile button navigates to current user profile slug', () => {
    setAuthState({
      isAuthenticated: true,
      user: {
        displayName: 'John Doe',
        reliabilityScore: 90,
      },
    });

    render(<EditProfile />);

    fireEvent.click(
      screen.getByRole('button', { name: /preview public profile/i })
    );
    expect(pushMock).toHaveBeenCalledWith('/profile/john-doe');
  });

  it('cancel button calls router.back()', () => {
    setAuthState({
      isAuthenticated: true,
      user: {
        displayName: 'John Doe',
        reliabilityScore: 90,
      },
    });

    render(<EditProfile />);

    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(backMock).toHaveBeenCalledTimes(1);
  });

  it('save error: shows error message and does not navigate', async () => {
    setAuthState({
      isAuthenticated: true,
      user: {
        displayName: 'John Doe',
        defaultIntensity: 'CASUAL',
        availability: '',
        bio: '',
        location: '',
        reliabilityScore: 95,
      },
      refreshUser: jest.fn().mockResolvedValue(undefined),
    });

    mockedUsersApi.updateProfile.mockRejectedValueOnce(new Error('Boom'));

    render(<EditProfile />);

    // required: display name already has value from user.
    // intensity required (UI marks it required but not HTML required). Choose one.
    fireEvent.click(screen.getByRole('button', { name: /casual/i }));

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /save changes/i }));
    });

    expect(mockedUsersApi.updateProfile).toHaveBeenCalledTimes(1);
    expect(replaceMock).not.toHaveBeenCalled();
  });

  it("save shows 'Saving...' while request is in flight and disables submit button", async () => {
    setAuthState({
      isAuthenticated: true,
      user: {
        displayName: 'John Doe',
        defaultIntensity: 'CASUAL',
        availability: '',
        bio: '',
        location: '',
        reliabilityScore: 95,
      },
      refreshUser: jest.fn().mockResolvedValue(undefined),
    });

    let resolveFn: (v?: any) => void = () => {};
    mockedUsersApi.updateProfile.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveFn = resolve;
        })
    );

    render(<EditProfile />);

    fireEvent.click(screen.getByRole('button', { name: /casual/i }));

    fireEvent.click(screen.getByRole('button', { name: /save changes/i }));

    // button becomes disabled and shows Saving...
    expect(screen.getByRole('button', { name: /saving/i })).toBeDisabled();

    // finish request
    await act(async () => {
      resolveFn(undefined);
    });

    await waitFor(() => {
      // back to enabled "Save Changes"
      expect(
        screen.getByRole('button', { name: /save changes/i })
      ).toBeEnabled();
    });
  });

  it('keeps the current profile slug after saving', async () => {
    const refreshUser = jest.fn().mockResolvedValue(undefined);
    setAuthState({
      isAuthenticated: true,
      user: {
        displayName: 'John Doe',
        defaultIntensity: 'CASUAL',
        availability: '',
        bio: '',
        location: '',
        reliabilityScore: 95,
        slug: 'john-doe',
      },
      refreshUser,
    });

    mockedUsersApi.updateProfile.mockResolvedValueOnce({
      slug: 'john-doe-2',
    });

    render(<EditProfile />);

    fireEvent.change(screen.getByPlaceholderText(/your display name/i), {
      target: { value: 'John Doe' },
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /save changes/i }));
    });

    await waitFor(() => {
      expect(refreshUser).toHaveBeenCalled();
      expect(replaceMock).toHaveBeenCalledWith('/profile/john-doe');
    });
  });
});
