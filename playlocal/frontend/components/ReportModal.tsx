import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, AlertTriangle, Loader2, CheckCircle } from 'lucide-react';
import { useReportUser } from '@/hooks/useReportUser';
import { CreateReportRequest } from '@/lib/api';

export interface ReportModalProps {
    isOpen: boolean;
    onClose: () => void;
    reportedUserId?: string;
    gameId?: string;
    endorsementId?: string;
    targetName: string;
    reportType?: 'user' | 'game' | 'endorsement';  // Explicitly specify what type of report
}

const REPORT_REASONS: { value: CreateReportRequest['reportType']; label: string }[] = [
    { value: 'HARASSMENT', label: 'Harassment or bullying' },
    { value: 'SPORTSMANSHIP', label: 'Unsportsmanlike behavior' },
    { value: 'SAFETY', label: 'Safety concern' },
    { value: 'SPAM', label: 'Spam or fake account' },
    { value: 'OTHER', label: 'Other' },
];

export function ReportModal({ isOpen, onClose, reportedUserId, gameId, endorsementId, targetName, reportType }: ReportModalProps) {
    const { submitReport, isSubmitting, error: apiError } = useReportUser();
    const [reason, setReason] = useState<CreateReportRequest['reportType'] | ''>('');
    const [details, setDetails] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Don't render on server or if not open
    if (!mounted || !isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!reason) {
            setError('Please select a reason for your report');
            return;
        }

        if (!details.trim()) {
            setError('Please provide details about your report');
            return;
        }

        try {
            await submitReport({
                reportedUserId,
                gameId,
                endorsementId,
                reportType: reason,
                details: details.trim(),
            });
            setSuccess(true);
            setTimeout(() => {
                onClose();
                setSuccess(false);
                setReason('');
                setDetails('');
            }, 2000);
        } catch (err: any) {
            setError(err.message || 'Failed to submit report');
        }
    };

    if (success) {
        return createPortal(
            <div
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 9999,
                }}
            >
                <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4 text-center">
                    <CheckCircle className="w-16 h-16 text-emerald-600 mx-auto mb-4" />
                    <h2 className="text-xl text-gray-900 mb-2">Report Submitted</h2>
                    <p className="text-gray-600">Thank you for helping keep our community safe.</p>
                </div>
            </div>,
            document.body
        );
    }

    return createPortal(
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 9999,
            }}
        >
            <div className="bg-white rounded-xl max-w-md w-full mx-4 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                        <AlertTriangle className="w-6 h-6 text-amber-500" />
                        <h2 className="text-lg font-semibold text-gray-900">
                            Report {reportType === 'user' ? 'User' : reportType === 'game' ? 'Game' : (gameId && !reportedUserId) ? 'Game' : 'User'}
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <form onSubmit={handleSubmit} className="p-6">
                    {(error || apiError) && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                            {error || apiError}
                        </div>
                    )}

                    <p className="text-gray-600 mb-4">
                        You are reporting <span className="font-medium text-gray-900">{targetName}</span>.
                        Please select a reason and provide details.
                    </p>

                    {/* Reason Selection */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Reason for report *
                        </label>
                        <select
                            value={reason}
                            onChange={(e) => setReason(e.target.value as CreateReportRequest['reportType'])}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            disabled={isSubmitting}
                        >
                            <option value="">Select a reason</option>
                            {REPORT_REASONS.map((r) => (
                                <option key={r.value} value={r.value}>
                                    {r.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Details */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Details *
                        </label>
                        <textarea
                            value={details}
                            onChange={(e) => setDetails(e.target.value)}
                            placeholder="Please provide context that would help us review this report..."
                            rows={4}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            disabled={isSubmitting}
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                            disabled={isSubmitting}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting || !reason}
                            className="flex-1 px-4 py-2 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                            style={{
                                backgroundColor: isSubmitting || !reason ? '#dc262680' : '#dc2626',
                                color: 'white',
                            }}
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Submitting...
                                </>
                            ) : (
                                'Submit Report'
                            )}
                        </button>
                    </div>
                </form>

                <div className="px-6 pb-6">
                    <p className="text-xs text-gray-500">
                        Reports are reviewed by our moderation team. False or abusive reports may result in action against your account.
                    </p>
                </div>
            </div>
        </div>,
        document.body
    );
}
