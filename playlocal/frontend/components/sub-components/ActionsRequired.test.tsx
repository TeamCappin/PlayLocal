import { render, screen, waitFor } from '@testing-library/react';
import { ActionsRequired } from './ActionsRequired';

const mockPush = jest.fn();

jest.mock('next/link', () => {
  return function MockLink({ children, href }: { children: React.ReactNode; href: string }) {
    return <a href={href}>{children}</a>;
  };
});

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock('@/context/AuthContext', () => ({
  useAuth: () => ({ isAuthenticated: true, user: { userId: 'u1' } }),
}));

jest.mock('@/hooks/useGames', () => ({
  usePastGamesByUserNeedingAttendanceUpdate: () => ({
    games: [
      {
        gameId: 'g1',
        title: 'Past Basketball Game',
        startTime: '2025-01-20T14:00:00Z',
      },
    ],
    isLoading: false,
    error: null,
  }),
}));

describe('ActionsRequired', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders Actions Required section when games need attendance update', async () => {
    render(<ActionsRequired />);

    await waitFor(() => {
      expect(screen.getByText('Actions Required')).toBeInTheDocument();
    });

    expect(screen.getByText('Past Basketball Game')).toBeInTheDocument();
    expect(screen.getByText('Confirm Attendance')).toBeInTheDocument();

    const link = screen.getByRole('link', { name: /Confirm Attendance/i });
    expect(link).toHaveAttribute('href', '/rsvpRoster/g1');
  });
});
