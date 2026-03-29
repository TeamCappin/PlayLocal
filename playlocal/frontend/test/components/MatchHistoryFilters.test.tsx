import { fireEvent, render, screen } from '@testing-library/react';
import { MatchHistoryFilters } from '../../components/sub-components/MatchHistoryFilters';
import {
  defaultMatchHistoryFilters,
  type MatchHistoryFilterState,
} from '@/lib/matchHistoryUtils';
import type { GameResponse } from '@/lib/api';

jest.mock('lucide-react', () => ({
  Filter: () => <span data-testid="icon-filter" />,
  X: () => <span data-testid="icon-x" />,
}));

function minimalGame(
  partial: Partial<GameResponse> & Pick<GameResponse, 'gameId' | 'sportName'>
): GameResponse {
  return {
    title: 'Game',
    location: { name: 'Park' },
    minPlayers: 2,
    maxPlayers: 10,
    allowWaitlist: false,
    startTime: '2025-06-01T12:00:00Z',
    status: 'COMPLETED',
    organizer: { userId: 'o1', displayName: 'Org' },
    confirmedCount: 2,
    waitlistCount: 0,
    createdAt: '2025-01-01T00:00:00Z',
    hasExactLocationAccess: true,
    ...partial,
  };
}

describe('MatchHistoryFilters', () => {
  const games = [
    minimalGame({ gameId: '1', sportName: 'Soccer' }),
    minimalGame({ gameId: '2', sportName: 'Basketball' }),
  ];

  it('renders sport options from games and updates sport', () => {
    const onChange = jest.fn();
    const value = defaultMatchHistoryFilters();

    render(
      <MatchHistoryFilters games={games} value={value} onChange={onChange} />
    );

    expect(screen.getByText('Filters')).toBeInTheDocument();
    expect(screen.getByLabelText('Sport')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Sport'), {
      target: { value: 'Soccer' },
    });
    expect(onChange).toHaveBeenCalledWith({ ...value, sport: 'Soccer' });
  });

  it('updates result, dates, and sort', () => {
    const onChange = jest.fn();
    let value: MatchHistoryFilterState = defaultMatchHistoryFilters();

    const { rerender } = render(
      <MatchHistoryFilters games={games} value={value} onChange={onChange} />
    );

    fireEvent.change(screen.getByLabelText('Result'), {
      target: { value: 'win' },
    });
    expect(onChange).toHaveBeenLastCalledWith({ ...value, result: 'win' });
    value = { ...value, result: 'win' };
    rerender(
      <MatchHistoryFilters games={games} value={value} onChange={onChange} />
    );

    fireEvent.change(screen.getByLabelText('From date'), {
      target: { value: '2025-01-01' },
    });
    expect(onChange).toHaveBeenLastCalledWith({
      ...value,
      dateFrom: '2025-01-01',
    });
    value = { ...value, dateFrom: '2025-01-01' };
    rerender(
      <MatchHistoryFilters games={games} value={value} onChange={onChange} />
    );

    fireEvent.change(screen.getByLabelText('To date'), {
      target: { value: '2025-12-31' },
    });
    expect(onChange).toHaveBeenLastCalledWith({
      ...value,
      dateTo: '2025-12-31',
    });
    value = { ...value, dateTo: '2025-12-31' };
    rerender(
      <MatchHistoryFilters games={games} value={value} onChange={onChange} />
    );

    fireEvent.change(
      screen.getByRole('combobox', { name: /Sort match history by date/i }),
      { target: { value: 'oldest_first' } }
    );
    expect(onChange).toHaveBeenLastCalledWith({
      ...value,
      sortOrder: 'oldest_first',
    });
  });

  it('shows Clear filters when active and clears sport/result/dates but keeps sort', () => {
    const onChange = jest.fn();
    const value: MatchHistoryFilterState = {
      sport: 'Soccer',
      result: 'loss',
      dateFrom: '2025-01-01',
      dateTo: '2025-02-01',
      sortOrder: 'oldest_first',
    };

    render(
      <MatchHistoryFilters games={games} value={value} onChange={onChange} />
    );

    fireEvent.click(screen.getByRole('button', { name: /Clear filters/i }));

    expect(onChange).toHaveBeenCalledWith({
      sport: '',
      result: 'all',
      dateFrom: '',
      dateTo: '',
      sortOrder: 'oldest_first',
    });
  });

  it('does not show Clear filters when nothing is narrowed', () => {
    render(
      <MatchHistoryFilters
        games={games}
        value={defaultMatchHistoryFilters()}
        onChange={jest.fn()}
      />
    );

    expect(
      screen.queryByRole('button', { name: /Clear filters/i })
    ).not.toBeInTheDocument();
  });
});
