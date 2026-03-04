import { useState } from 'react';
import { AlertCircle, X } from 'lucide-react';

interface Tag {
  tagId: string;
  name: string;
  isRestricted: boolean;
}

interface JoinConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (confirmedTagIds: string[]) => void;
  restrictedTags: Tag[];
  minAge?: number;
  maxAge?: number;
  isJoining: boolean;
}

export function JoinConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  restrictedTags,
  minAge,
  maxAge,
  isJoining,
}: JoinConfirmationModalProps) {
  const [confirmedTags, setConfirmedTags] = useState<Set<string>>(new Set());

  if (!isOpen) return null;

  const handleToggleTag = (tagId: string) => {
    const newConfirmed = new Set(confirmedTags);
    if (newConfirmed.has(tagId)) {
      newConfirmed.delete(tagId);
    } else {
      newConfirmed.add(tagId);
    }
    setConfirmedTags(newConfirmed);
  };

  const handleConfirm = () => {
    // Check if all restricted tags are confirmed
    const allConfirmed = restrictedTags.every((tag) =>
      confirmedTags.has(tag.tagId)
    );
    if (!allConfirmed) {
      return; // Button should be disabled anyway
    }
    onConfirm(Array.from(confirmedTags));
  };

  const allConfirmed = restrictedTags.every((tag) =>
    confirmedTags.has(tag.tagId)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Confirm Game Requirements
          </h2>
          <button
            onClick={onClose}
            disabled={isJoining}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Age Requirements */}
          {(minAge || maxAge) && (
            <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <h3 className="text-sm font-medium text-purple-900 mb-2">
                Age Requirement
              </h3>
              <p className="text-sm text-purple-700">
                This game requires participants to be{' '}
                {minAge && maxAge
                  ? `between ${minAge} and ${maxAge} years old`
                  : minAge
                    ? `at least ${minAge} years old`
                    : `under ${maxAge} years old`}
                .
              </p>
            </div>
          )}

          {/* Restricted Tags */}
          {restrictedTags.length > 0 && (
            <div>
              <div className="flex items-start gap-2 mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-amber-800">
                  <p className="font-medium mb-1">Community-Specific Game</p>
                  <p>
                    This game has been marked for specific communities. Please
                    confirm that you meet the requirements before joining.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-sm font-medium text-gray-700">
                  Please confirm the following:
                </p>
                {restrictedTags.map((tag) => (
                  <label
                    key={tag.tagId}
                    className="flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition-colors hover:bg-gray-50"
                    style={{
                      borderColor: confirmedTags.has(tag.tagId)
                        ? '#10b981'
                        : '#d1d5db',
                      backgroundColor: confirmedTags.has(tag.tagId)
                        ? '#f0fdf4'
                        : 'white',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={confirmedTags.has(tag.tagId)}
                      onChange={() => handleToggleTag(tag.tagId)}
                      disabled={isJoining}
                      className="mt-1 w-5 h-5 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500 disabled:opacity-50"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-gray-900 capitalize">
                          {tag.name.replace('-', ' ')}
                        </span>
                        <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-xs rounded-full">
                          Required
                        </span>
                      </div>
                      <p className="text-xs text-gray-600">
                        I confirm that I meet this community requirement
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            disabled={isJoining}
            className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!allConfirmed || isJoining}
            className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isJoining ? 'Joining...' : 'Confirm & Join'}
          </button>
        </div>
      </div>
    </div>
  );
}
