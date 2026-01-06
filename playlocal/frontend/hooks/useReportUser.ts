import { useState } from 'react';
import { reportsApi, CreateReportRequest, ReportResponse } from '@/lib/api';

export function useReportUser() {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const submitReport = async (data: CreateReportRequest): Promise<ReportResponse> => {
        setIsSubmitting(true);
        setError(null);
        setSuccess(false);
        try {
            const response = await reportsApi.create(data);
            setSuccess(true);
            return response;
        } catch (err: any) {
            if (err.status === 429) {
                setError('You have submitted too many reports. Please try again later.');
            } else {
                setError('Failed to submit report. Please try again.');
            }
            throw err;
        } finally {
            setIsSubmitting(false);
        }
    };

    const resetState = () => {
        setError(null);
        setSuccess(false);
    };

    return { submitReport, isSubmitting, error, success, resetState };
}
