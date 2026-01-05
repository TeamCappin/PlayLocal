import { useState, useCallback } from 'react';
import { attendanceApi, AttendanceEntry, AttendanceResponse } from '@/lib/api';

export function useAttendance(gameId: string | undefined) {
    const [pendingAttendance, setPendingAttendance] = useState<AttendanceEntry[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchPending = useCallback(async () => {
        if (!gameId) return;

        setIsLoading(true);
        setError(null);
        try {
            const data = await attendanceApi.getPending(gameId);
            setPendingAttendance(data);
        } catch (err) {
            setError('Failed to load attendance data');
            console.error('Error fetching attendance:', err);
        } finally {
            setIsLoading(false);
        }
    }, [gameId]);

    const confirmAttendance = async (attendances: AttendanceEntry[]): Promise<AttendanceResponse> => {
        if (!gameId) throw new Error('Game ID required');

        setIsSubmitting(true);
        setError(null);
        try {
            const response = await attendanceApi.confirm(gameId, attendances);
            // Clear pending after successful confirmation
            setPendingAttendance([]);
            return response;
        } catch (err) {
            setError('Failed to confirm attendance');
            throw err;
        } finally {
            setIsSubmitting(false);
        }
    };

    return {
        pendingAttendance,
        isLoading,
        isSubmitting,
        error,
        fetchPending,
        confirmAttendance,
    };
}
