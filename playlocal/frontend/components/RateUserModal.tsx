import React, { useState } from 'react';
import { Star, X, Loader2 } from 'lucide-react';
import { usePlayerRatings } from '@/hooks/usePlayerRatings';

interface RateUserModalProps {
  gameId: string;
  targetUserId: string;
  targetUserName: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function RateUserModal({
  gameId,
  targetUserId,
  targetUserName,
  isOpen,
  onClose,
  onSuccess,
}: RateUserModalProps) {
  const [rating, setRating] = useState<number>(0);
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  const { createRating, isLoading: isSubmitting } = usePlayerRatings();

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (rating < 1 || rating > 5) return;

    try {
      await createRating({ gameId, rateeId: targetUserId, rating });
      onSuccess?.();
      onClose();
    } catch (err) {
      // Error is handled by the hook via toast
      console.error('Failed to submit rating', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">
            Rate {targetUserName}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isSubmitting}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <p className="text-gray-600 mb-6 text-center text-sm">
            How was your experience playing with {targetUserName}? Please provide a rating based on sportsmanship and attitude.
          </p>

          <div className="flex justify-center gap-2 mb-8">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                className="focus:outline-none transition-transform hover:scale-110"
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                onClick={() => setRating(star)}
                disabled={isSubmitting}
              >
                <Star
                  className={`w-10 h-10 transition-colors ${
                    (hoveredRating || rating) >= star
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-gray-200'
                  }`}
                />
              </button>
            ))}
          </div>

          <button
            onClick={handleSubmit}
            disabled={rating === 0 || isSubmitting}
            className={`w-full py-3 rounded-lg font-medium text-white transition-all flex items-center justify-center gap-2 ${
              rating === 0 || isSubmitting
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98]'
            }`}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Submitting...
              </>
            ) : (
              'Submit Rating'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}