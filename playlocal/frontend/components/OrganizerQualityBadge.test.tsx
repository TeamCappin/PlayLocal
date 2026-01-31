import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { OrganizerQualityBadge } from './OrganizerQualityBadge';
import { organizerQualityApi } from '@/lib/api';

// Mock the API
jest.mock('@/lib/api', () => ({
    organizerQualityApi: {
        getOqs: jest.fn(),
        getMyOqs: jest.fn(),
        getOqsSummary: jest.fn(),
        getOqsInfoCard: jest.fn(),
        getMyOqsInfoCard: jest.fn(),
    },
}));

const mockOqs = {
    userId: 'test-user-id',
    displayName: 'Test Organizer',
    oqsScore: 85.0,
    gameCompletionRate: 90.0,
    repeatPlayerRate: 75.0,
    totalGamesHosted: 10,
    completedGames: 9,
    cancelledGames: 1,
    totalUniquePlayers: 50,
    repeatPlayers: 20,
    confidenceLevel: 'HIGH',
    confidenceDescription: 'Based on 10 games - score is highly reliable',
    lastCalculatedAt: '2024-01-15T10:00:00Z',
};

const mockInfoCard = {
    oqsScore: 85.0,
    overallDescription: 'Good organizer with reliable game history',
    gameCompletionRate: 90.0,
    completionRateDescription: 'Good reliability: 9 of 10 games completed',
    completedGames: 9,
    totalGames: 10,
    repeatPlayerRate: 75.0,
    repeatRateDescription: 'Great retention! 20 of 50 players have returned',
    repeatPlayers: 20,
    totalUniquePlayers: 50,
    confidenceLevel: 'HIGH',
    confidenceDescription: 'Based on 10 games - score is highly reliable',
    gamesForNextLevel: 0,
};

describe('OrganizerQualityBadge', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (organizerQualityApi.getOqs as jest.Mock).mockResolvedValue(mockOqs);
        (organizerQualityApi.getOqsInfoCard as jest.Mock).mockResolvedValue(mockInfoCard);
    });

    describe('Compact Variant', () => {
        it('should render OQS score in compact mode', async () => {
            render(
                <OrganizerQualityBadge 
                    userId="test-user-id" 
                    variant="compact" 
                />
            );

            await waitFor(() => {
                expect(screen.getByText(/OQS: 85%/)).toBeInTheDocument();
            });
        });

        it('should show info card on click', async () => {
            render(
                <OrganizerQualityBadge 
                    userId="test-user-id" 
                    variant="compact"
                    showInfoCard={true}
                />
            );

            await waitFor(() => {
                expect(screen.getByText(/OQS: 85%/)).toBeInTheDocument();
            });

            // Click to expand
            fireEvent.click(screen.getByText(/OQS: 85%/));

            await waitFor(() => {
                expect(screen.getByText('OQS Breakdown')).toBeInTheDocument();
            });
        });
    });

    describe('Inline Variant', () => {
        it('should render OQS score inline', async () => {
            render(
                <OrganizerQualityBadge 
                    userId="test-user-id" 
                    variant="inline" 
                />
            );

            await waitFor(() => {
                expect(screen.getByText('85%')).toBeInTheDocument();
            });
        });

        it('should show confidence indicator', async () => {
            render(
                <OrganizerQualityBadge 
                    userId="test-user-id" 
                    variant="inline" 
                />
            );

            await waitFor(() => {
                // High confidence shows 3 dots
                expect(screen.getByText('●●●')).toBeInTheDocument();
            });
        });
    });

    describe('Full Variant', () => {
        it('should render full OQS card', async () => {
            render(
                <OrganizerQualityBadge 
                    userId="test-user-id" 
                    variant="full"
                    displayName="Test Organizer"
                />
            );

            await waitFor(() => {
                expect(screen.getByText('Organizer Quality Score')).toBeInTheDocument();
                expect(screen.getByText('Test Organizer')).toBeInTheDocument();
                expect(screen.getByText('85%')).toBeInTheDocument();
            });
        });

        it('should show game completion rate', async () => {
            render(
                <OrganizerQualityBadge 
                    userId="test-user-id" 
                    variant="full" 
                />
            );

            await waitFor(() => {
                expect(screen.getByText('Game Completion Rate')).toBeInTheDocument();
                expect(screen.getByText('90.0%')).toBeInTheDocument();
            });
        });

        it('should show repeat player rate', async () => {
            render(
                <OrganizerQualityBadge 
                    userId="test-user-id" 
                    variant="full" 
                />
            );

            await waitFor(() => {
                expect(screen.getByText('Repeat Player Rate')).toBeInTheDocument();
                expect(screen.getByText('75.0%')).toBeInTheDocument();
            });
        });

        it('should show confidence level', async () => {
            render(
                <OrganizerQualityBadge 
                    userId="test-user-id" 
                    variant="full" 
                />
            );

            await waitFor(() => {
                expect(screen.getByText('Confidence Level')).toBeInTheDocument();
                expect(screen.getByText('10 games hosted')).toBeInTheDocument();
            });
        });

        it('should toggle info card explanation', async () => {
            render(
                <OrganizerQualityBadge 
                    userId="test-user-id" 
                    variant="full"
                    showInfoCard={true}
                />
            );

            await waitFor(() => {
                expect(screen.getByText('How is OQS calculated?')).toBeInTheDocument();
            });

            fireEvent.click(screen.getByText('How is OQS calculated?'));

            await waitFor(() => {
                expect(screen.getByText('Good organizer with reliable game history')).toBeInTheDocument();
                expect(screen.getByText('Game Completion Rate (60%)')).toBeInTheDocument();
                expect(screen.getByText('Repeat Player Rate (40%)')).toBeInTheDocument();
            });
        });
    });

    describe('Loading State', () => {
        it('should show loading state while fetching', () => {
            (organizerQualityApi.getOqs as jest.Mock).mockImplementation(
                () => new Promise(() => {})
            );

            render(
                <OrganizerQualityBadge 
                    userId="test-user-id" 
                    variant="full" 
                />
            );

            // Check for loading animation class
            expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
        });
    });

    describe('Error State', () => {
        it('should show error state when fetch fails', async () => {
            (organizerQualityApi.getOqs as jest.Mock).mockRejectedValue(
                new Error('Failed to fetch')
            );

            render(
                <OrganizerQualityBadge 
                    userId="test-user-id" 
                    variant="full" 
                />
            );

            await waitFor(() => {
                expect(screen.getByText('Unable to load OQS')).toBeInTheDocument();
            });
        });

        it('should show compact error for inline variant', async () => {
            (organizerQualityApi.getOqs as jest.Mock).mockRejectedValue(
                new Error('Failed to fetch')
            );

            render(
                <OrganizerQualityBadge 
                    userId="test-user-id" 
                    variant="inline" 
                />
            );

            await waitFor(() => {
                expect(screen.getByText('—')).toBeInTheDocument();
            });
        });
    });

    describe('Color Coding', () => {
        it('should show green for high OQS', async () => {
            (organizerQualityApi.getOqs as jest.Mock).mockResolvedValue({
                ...mockOqs,
                oqsScore: 95.0,
            });

            render(
                <OrganizerQualityBadge 
                    userId="test-user-id" 
                    variant="compact" 
                />
            );

            await waitFor(() => {
                const badge = screen.getByText(/OQS: 95%/).closest('button');
                expect(badge).toHaveClass('bg-emerald-100');
            });
        });

        it('should show yellow for medium OQS', async () => {
            (organizerQualityApi.getOqs as jest.Mock).mockResolvedValue({
                ...mockOqs,
                oqsScore: 65.0,
            });

            render(
                <OrganizerQualityBadge 
                    userId="test-user-id" 
                    variant="compact" 
                />
            );

            await waitFor(() => {
                const badge = screen.getByText(/OQS: 65%/).closest('button');
                expect(badge).toHaveClass('bg-yellow-100');
            });
        });

        it('should show red for low OQS', async () => {
            (organizerQualityApi.getOqs as jest.Mock).mockResolvedValue({
                ...mockOqs,
                oqsScore: 35.0,
            });

            render(
                <OrganizerQualityBadge 
                    userId="test-user-id" 
                    variant="compact" 
                />
            );

            await waitFor(() => {
                const badge = screen.getByText(/OQS: 35%/).closest('button');
                expect(badge).toHaveClass('bg-red-100');
            });
        });
    });
});

describe('OQS Utility Functions', () => {
    // Import utilities from hook
    const { 
        formatOqsScore, 
        getOqsColorClass, 
        getConfidenceLevelInfo,
        formatOqsDelta 
    } = require('@/hooks/useOrganizerQuality');

    describe('formatOqsScore', () => {
        it('should format score as percentage', () => {
            expect(formatOqsScore(85.5)).toBe('86%');
            expect(formatOqsScore(100)).toBe('100%');
            expect(formatOqsScore(0)).toBe('0%');
        });
    });

    describe('getOqsColorClass', () => {
        it('should return emerald for 90+', () => {
            expect(getOqsColorClass(95)).toBe('text-emerald-600');
        });

        it('should return green for 75-89', () => {
            expect(getOqsColorClass(80)).toBe('text-green-600');
        });

        it('should return yellow for 60-74', () => {
            expect(getOqsColorClass(65)).toBe('text-yellow-600');
        });

        it('should return orange for 40-59', () => {
            expect(getOqsColorClass(50)).toBe('text-orange-600');
        });

        it('should return red for below 40', () => {
            expect(getOqsColorClass(30)).toBe('text-red-600');
        });
    });

    describe('getConfidenceLevelInfo', () => {
        it('should return HIGH info correctly', () => {
            const info = getConfidenceLevelInfo('HIGH');
            expect(info.label).toBe('High Confidence');
            expect(info.icon).toBe('●●●');
        });

        it('should return MEDIUM info correctly', () => {
            const info = getConfidenceLevelInfo('MEDIUM');
            expect(info.label).toBe('Medium Confidence');
            expect(info.icon).toBe('●●○');
        });

        it('should return LOW info correctly', () => {
            const info = getConfidenceLevelInfo('LOW');
            expect(info.label).toBe('Low Confidence');
            expect(info.icon).toBe('●○○');
        });
    });

    describe('formatOqsDelta', () => {
        it('should format positive delta', () => {
            expect(formatOqsDelta(5.5)).toBe('+5.5%');
        });

        it('should format negative delta', () => {
            expect(formatOqsDelta(-3.2)).toBe('-3.2%');
        });

        it('should format zero delta', () => {
            expect(formatOqsDelta(0)).toBe('0%');
        });
    });
});
