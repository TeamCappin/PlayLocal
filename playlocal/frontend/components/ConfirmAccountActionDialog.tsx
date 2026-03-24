import { useState } from 'react';

interface ConfirmAccountActionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  action: 'deactivate' | 'delete';
  isLoading?: boolean;
}

export function ConfirmAccountActionDialog({
  isOpen,
  onClose,
  onConfirm,
  action,
  isLoading = false,
}: ConfirmAccountActionDialogProps) {
  const [confirmText, setConfirmText] = useState('');

  const isDeactivate = action === 'deactivate';
  const isDelete = action === 'delete';

  // For delete, require typing "DELETE" to confirm
  const isDeleteConfirmed = !isDelete || confirmText.toUpperCase() === 'DELETE';

  const handleConfirm = () => {
    if (!isDeleteConfirmed) return;
    onConfirm();
  };

  const handleClose = () => {
    setConfirmText('');
    onClose();
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close account action dialog"
        className="absolute inset-0 bg-black/50"
        onClick={() => !isLoading && handleClose()}
      />
      <div
        className="relative w-full max-w-lg rounded-xl border border-gray-200 bg-white p-6 shadow-xl"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="account-action-title"
        aria-describedby="account-action-description"
      >
        <div className="space-y-4 text-left">
          <div className="space-y-2">
            <h2 id="account-action-title" className="text-xl font-semibold text-gray-900">
              {isDeactivate
                ? 'Deactivate Account?'
                : 'Permanently Delete Account?'}
            </h2>
            <div id="account-action-description" className="space-y-3">
              {isDeactivate ? (
                <>
                  <p className="text-gray-700">
                    Deactivating your account will:
                  </p>
                  <ul className="list-inside list-disc space-y-1 text-sm text-gray-600">
                    <li>Hide your profile from other users</li>
                    <li>Remove you from all upcoming games</li>
                    <li>Prevent you from creating or joining games</li>
                  </ul>
                  <p className="text-sm font-medium text-emerald-700">
                    You can reactivate within 30 days by logging back in
                  </p>
                </>
              ) : (
                <>
                  <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                    <p className="font-semibold text-red-800">
                      This action is irreversible.
                    </p>
                  </div>
                  <p className="text-gray-700">
                    Deleting your account will permanently:
                  </p>
                  <ul className="list-inside list-disc space-y-1 text-sm text-gray-600">
                    <li>Delete all your personal information</li>
                    <li>Remove you from all games</li>
                    <li>Erase your game history and statistics</li>
                    <li>Delete all your photos and content</li>
                    <li>Cannot be recovered under any circumstances</li>
                  </ul>
                  <div className="pt-2">
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Type{' '}
                      <span className="rounded bg-gray-100 px-1 py-0.5 font-mono">
                        DELETE
                      </span>{' '}
                      to confirm:
                    </label>
                    <input
                      type="text"
                      value={confirmText}
                      onChange={(e) => setConfirmText(e.target.value)}
                      disabled={isLoading}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-red-500 focus:ring-2 focus:ring-red-500"
                      placeholder="DELETE"
                      autoFocus
                    />
                  </div>
                </>
              )}
            </div>
          </div>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              disabled={isLoading}
              onClick={handleClose}
              className="inline-flex items-center justify-center rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isLoading || !isDeleteConfirmed}
              className={[
                'inline-flex min-w-[11rem] items-center justify-center rounded-md px-4 py-2 text-sm font-medium text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50',
                isDeactivate
                  ? 'bg-orange-600 hover:bg-orange-700'
                  : 'bg-red-600 hover:bg-red-700',
              ].join(' ')}
              style={{
                backgroundColor: isDeactivate ? '#ea580c' : '#dc2626',
                color: '#ffffff',
              }}
            >
              {isLoading
                ? isDeactivate
                  ? 'Deactivating...'
                  : 'Deleting...'
                : isDeactivate
                  ? 'Deactivate Account'
                  : 'Delete Forever'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
