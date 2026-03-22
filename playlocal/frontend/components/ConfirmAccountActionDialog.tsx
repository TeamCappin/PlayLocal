import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

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

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <AlertDialogContent className="max-w-lg">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-xl">
            {isDeactivate ? 'Deactivate Account?' : 'Permanently Delete Account?'}
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-3 text-left">
            {isDeactivate ? (
              <>
                <p className="text-gray-700">
                  Deactivating your account will:
                </p>
                <ul className="list-disc list-inside space-y-1 text-gray-600 text-sm">
                  <li>Hide your profile from other users</li>
                  <li>Remove you from all upcoming games</li>
                  <li>Prevent you from creating or joining games</li>
                </ul>
                <p className="text-emerald-700 font-medium text-sm">
                  ✓ You can reactivate within 30 days by logging back in
                </p>
              </>
            ) : (
              <>
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-800 font-semibold">
                    ⚠ This action is IRREVERSIBLE
                  </p>
                </div>
                <p className="text-gray-700">
                  Deleting your account will permanently:
                </p>
                <ul className="list-disc list-inside space-y-1 text-gray-600 text-sm">
                  <li>Delete all your personal information</li>
                  <li>Remove you from all games</li>
                  <li>Erase your game history and statistics</li>
                  <li>Delete all your photos and content</li>
                  <li>Cannot be recovered under any circumstances</li>
                </ul>
                <div className="pt-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type <span className="font-mono bg-gray-100 px-1 py-0.5 rounded">DELETE</span> to confirm:
                  </label>
                  <input
                    type="text"
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    disabled={isLoading}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    placeholder="DELETE"
                    autoFocus
                  />
                </div>
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading} onClick={handleClose}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isLoading || !isDeleteConfirmed}
            className={
              isDeactivate
                ? 'bg-orange-600 hover:bg-orange-700'
                : 'bg-red-600 hover:bg-red-700'
            }
          >
            {isLoading
              ? isDeactivate
                ? 'Deactivating...'
                : 'Deleting...'
              : isDeactivate
                ? 'Deactivate Account'
                : 'Delete Forever'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
