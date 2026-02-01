import {
    formatOqsScore,
    getOqsColorClass,
    getOqsBgColorClass,
    getConfidenceLevelInfo,
    formatOqsDelta,
    getOqsDeltaColor,
    formatOqsReason,
} from '@/hooks/useOrganizerQuality';

/**
 * Unit tests for useOrganizerQuality utility functions.
 * Implements: US-6.1 - Organizer Quality Score display utilities
 */

describe('useOrganizerQuality utility functions', () => {
    
    // ==================== formatOqsScore ====================
    describe('formatOqsScore', () => {
        it('should format whole numbers correctly', () => {
            expect(formatOqsScore(100)).toBe('100%');
            expect(formatOqsScore(85)).toBe('85%');
            expect(formatOqsScore(0)).toBe('0%');
        });

        it('should round decimal values', () => {
            expect(formatOqsScore(85.4)).toBe('85%');
            expect(formatOqsScore(85.5)).toBe('86%');
            expect(formatOqsScore(85.9)).toBe('86%');
        });
    });

    // ==================== getOqsColorClass ====================
    describe('getOqsColorClass', () => {
        it('should return emerald for scores >= 90', () => {
            expect(getOqsColorClass(90)).toBe('text-emerald-600');
            expect(getOqsColorClass(95)).toBe('text-emerald-600');
            expect(getOqsColorClass(100)).toBe('text-emerald-600');
        });

        it('should return green for scores >= 75 and < 90', () => {
            expect(getOqsColorClass(75)).toBe('text-green-600');
            expect(getOqsColorClass(80)).toBe('text-green-600');
            expect(getOqsColorClass(89)).toBe('text-green-600');
        });

        it('should return yellow for scores >= 60 and < 75', () => {
            expect(getOqsColorClass(60)).toBe('text-yellow-600');
            expect(getOqsColorClass(65)).toBe('text-yellow-600');
            expect(getOqsColorClass(74)).toBe('text-yellow-600');
        });

        it('should return orange for scores >= 40 and < 60', () => {
            expect(getOqsColorClass(40)).toBe('text-orange-600');
            expect(getOqsColorClass(50)).toBe('text-orange-600');
            expect(getOqsColorClass(59)).toBe('text-orange-600');
        });

        it('should return red for scores < 40', () => {
            expect(getOqsColorClass(39)).toBe('text-red-600');
            expect(getOqsColorClass(20)).toBe('text-red-600');
            expect(getOqsColorClass(0)).toBe('text-red-600');
        });
    });

    // ==================== getOqsBgColorClass ====================
    describe('getOqsBgColorClass', () => {
        it('should return emerald background for scores >= 90', () => {
            expect(getOqsBgColorClass(90)).toBe('bg-emerald-100');
            expect(getOqsBgColorClass(100)).toBe('bg-emerald-100');
        });

        it('should return green background for scores >= 75 and < 90', () => {
            expect(getOqsBgColorClass(75)).toBe('bg-green-100');
            expect(getOqsBgColorClass(89)).toBe('bg-green-100');
        });

        it('should return yellow background for scores >= 60 and < 75', () => {
            expect(getOqsBgColorClass(60)).toBe('bg-yellow-100');
            expect(getOqsBgColorClass(74)).toBe('bg-yellow-100');
        });

        it('should return orange background for scores >= 40 and < 60', () => {
            expect(getOqsBgColorClass(40)).toBe('bg-orange-100');
            expect(getOqsBgColorClass(59)).toBe('bg-orange-100');
        });

        it('should return red background for scores < 40', () => {
            expect(getOqsBgColorClass(39)).toBe('bg-red-100');
            expect(getOqsBgColorClass(0)).toBe('bg-red-100');
        });
    });

    // ==================== getConfidenceLevelInfo ====================
    describe('getConfidenceLevelInfo', () => {
        it('should return HIGH confidence info', () => {
            const result = getConfidenceLevelInfo('HIGH');
            expect(result.label).toBe('High Confidence');
            expect(result.color).toBe('text-emerald-600');
        });

        it('should return MEDIUM confidence info', () => {
            const result = getConfidenceLevelInfo('MEDIUM');
            expect(result.label).toBe('Medium Confidence');
            expect(result.color).toBe('text-yellow-600');
        });

        it('should return LOW confidence info', () => {
            const result = getConfidenceLevelInfo('LOW');
            expect(result.label).toBe('Low Confidence');
            expect(result.color).toBe('text-gray-500');
        });

        it('should return LOW confidence info for unknown values', () => {
            const result = getConfidenceLevelInfo('UNKNOWN');
            expect(result.label).toBe('Low Confidence');
            expect(result.color).toBe('text-gray-500');
        });
    });

    // ==================== formatOqsDelta ====================
    describe('formatOqsDelta', () => {
        it('should format positive deltas with + sign', () => {
            expect(formatOqsDelta(5)).toBe('+5.0%');
            expect(formatOqsDelta(2.5)).toBe('+2.5%');
            expect(formatOqsDelta(0.1)).toBe('+0.1%');
        });

        it('should format negative deltas with - sign', () => {
            expect(formatOqsDelta(-5)).toBe('-5.0%');
            expect(formatOqsDelta(-2.5)).toBe('-2.5%');
            expect(formatOqsDelta(-0.1)).toBe('-0.1%');
        });

        it('should format zero delta without sign', () => {
            expect(formatOqsDelta(0)).toBe('0%');
        });
    });

    // ==================== getOqsDeltaColor ====================
    describe('getOqsDeltaColor', () => {
        it('should return emerald for positive deltas', () => {
            expect(getOqsDeltaColor(5)).toBe('text-emerald-600');
            expect(getOqsDeltaColor(0.1)).toBe('text-emerald-600');
        });

        it('should return red for negative deltas', () => {
            expect(getOqsDeltaColor(-5)).toBe('text-red-600');
            expect(getOqsDeltaColor(-0.1)).toBe('text-red-600');
        });

        it('should return gray for zero delta', () => {
            expect(getOqsDeltaColor(0)).toBe('text-gray-600');
        });
    });

    // ==================== formatOqsReason ====================
    describe('formatOqsReason', () => {
        it('should format GAME_COMPLETED reason', () => {
            const result = formatOqsReason('GAME_COMPLETED');
            expect(result.label).toBe('Game Completed');
            expect(result.color).toBe('text-emerald-600');
        });

        it('should format GAME_CANCELLED reason', () => {
            const result = formatOqsReason('GAME_CANCELLED');
            expect(result.label).toBe('Game Cancelled');
            expect(result.color).toBe('text-red-600');
        });

        it('should format PLAYER_RETURNED reason', () => {
            const result = formatOqsReason('PLAYER_RETURNED');
            expect(result.label).toBe('Returning Player');
            expect(result.color).toBe('text-blue-600');
        });

        it('should format INITIAL_CALCULATION reason', () => {
            const result = formatOqsReason('INITIAL_CALCULATION');
            expect(result.label).toBe('Initial Score');
            expect(result.color).toBe('text-gray-600');
        });

        it('should format MANUAL_ADJUSTMENT reason', () => {
            const result = formatOqsReason('MANUAL_ADJUSTMENT');
            expect(result.label).toBe('Admin Adjustment');
            expect(result.color).toBe('text-purple-600');
        });

        it('should format RECALCULATION reason', () => {
            const result = formatOqsReason('RECALCULATION');
            expect(result.label).toBe('Recalculated');
            expect(result.color).toBe('text-gray-600');
        });

        it('should return raw reason for unknown values', () => {
            const result = formatOqsReason('UNKNOWN_REASON');
            expect(result.label).toBe('UNKNOWN_REASON');
            expect(result.color).toBe('text-gray-600');
        });
    });
});
