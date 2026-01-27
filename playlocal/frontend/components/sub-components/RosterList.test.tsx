import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { RosterList } from './RosterList';
import { usersApi } from '@/lib/api';

jest.mock('@/lib/api', () => ({
  usersApi: {
    getProfile: jest.fn(),
  },
}));

const mockGetProfile = usersApi.getProfile as jest.MockedFunction<typeof usersApi.getProfile>;

describe('RosterList', () => {
  const onStatusChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders profile name and triggers onStatusChange when Attended is clicked', async () => {
    mockGetProfile.mockResolvedValue({
      displayName: 'Jane Doe',
      defaultIntensity: 'Competitive',
    } as any);

    render(
      <RosterList
        userId="u1"
        participationId="p1"
        currentStatus="UNKNOWN"
        onStatusChange={onStatusChange}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    });

    expect(screen.getByText('Attended')).toBeInTheDocument();
    expect(screen.getByText('No show')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Attended'));
    expect(onStatusChange).toHaveBeenCalledWith('p1', 'ATTENDED');
  });

  it('calls onStatusChange with NO_SHOW when No show is clicked', async () => {
    mockGetProfile.mockResolvedValue({ displayName: 'John', defaultIntensity: 'Casual' } as any);

    render(
      <RosterList
        userId="u2"
        participationId="p2"
        currentStatus="UNKNOWN"
        onStatusChange={onStatusChange}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('John')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('No show'));
    expect(onStatusChange).toHaveBeenCalledWith('p2', 'NO_SHOW');
  });

  it('shows MR initials when profile has not loaded', () => {
    mockGetProfile.mockResolvedValue({} as any);

    render(
      <RosterList
        userId="u3"
        participationId="p3"
        currentStatus="UNKNOWN"
        onStatusChange={onStatusChange}
      />
    );

    expect(screen.getByText('MR')).toBeInTheDocument();
  });
});
