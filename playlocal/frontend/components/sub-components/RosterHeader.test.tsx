import { render, screen } from '@testing-library/react';
import { RosterHeader } from './RosterHeader';

describe('RosterHeader', () => {
  it('renders game title, sport, and location when game is provided', () => {
    const game = {
      title: 'Weekend Basketball',
      skillBand: 'Intermediate',
      intensityBand: 'Competitive',
      sportName: 'Basketball',
      startTime: '2025-02-15T14:00:00Z',
      location: { name: 'Central Park Courts' },
    };

    render(<RosterHeader game={game} />);

    expect(screen.getByText('Weekend Basketball')).toBeInTheDocument();
    expect(screen.getByText('Basketball')).toBeInTheDocument();
    expect(screen.getByText('Intermediate')).toBeInTheDocument();
    expect(screen.getByText('Competitive Intensity')).toBeInTheDocument();
    expect(screen.getByText('Central Park Courts')).toBeInTheDocument();
  });

  it('renders mock fallbacks when game is null', () => {
    render(<RosterHeader game={null} />);

    expect(screen.getByText('Sunday Soccer Match')).toBeInTheDocument();
    expect(screen.getByText('Basketball')).toBeInTheDocument();
    expect(screen.getByText('Golden Gate Park Basketball Courts')).toBeInTheDocument();
  });
});
