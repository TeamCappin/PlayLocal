interface ConfirmLeaveGameDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  gameTitle: string;
  isLoading?: boolean;
}

export function ConfirmLeaveGameDialog({
  isOpen,
  onClose,
  onConfirm,
  gameTitle,
  isLoading = false,
}: ConfirmLeaveGameDialogProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 p-4"
      onClick={() => !isLoading && onClose()}
      role="presentation"
    >
      <div
        className="w-full max-w-lg rounded-xl border border-gray-200 bg-white p-6 shadow-xl"
        onClick={(event) => event.stopPropagation()}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="leave-game-title"
        aria-describedby="leave-game-description"
      >
        <div className="space-y-2">
          <h2 id="leave-game-title" className="text-lg font-semibold text-gray-900">
            Leave Game?
          </h2>
          <p id="leave-game-description" className="text-sm text-gray-600">
            Are you sure you want to leave &quot;{gameTitle}&quot;?
          </p>
          <p className="text-sm text-gray-600">
            You can rejoin if spots are available and the game hasn&apos;t started yet.
          </p>
        </div>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="inline-flex items-center justify-center rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Stay in Game
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="inline-flex items-center justify-center rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
            style={{
              backgroundColor: '#dc2626',
              color: '#ffffff',
            }}
          >
            {isLoading ? 'Leaving...' : 'Leave Game'}
          </button>
        </div>
      </div>
    </div>
  );
}
