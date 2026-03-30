import type { ReactNode } from 'react';

/** Shared shell for Leave Game, Delete Photo, and similar confirm flows (dimmed backdrop, dismiss on overlay click). */
export type ConfirmActionDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
  title: string;
  titleId: string;
  descriptionId: string;
  overlayAriaLabel: string;
  cancelLabel: string;
  confirmLabel: string;
  confirmLoadingLabel: string;
  children: ReactNode;
};

const secondaryButtonClass =
  'inline-flex items-center justify-center rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50';

const primaryDestructiveClass =
  'inline-flex items-center justify-center rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50';

const primaryDestructiveStyle = {
  backgroundColor: '#dc2626',
  color: '#ffffff',
} as const;

export function ConfirmActionDialog({
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
  title,
  titleId,
  descriptionId,
  overlayAriaLabel,
  cancelLabel,
  confirmLabel,
  confirmLoadingLabel,
  children,
}: ConfirmActionDialogProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label={overlayAriaLabel}
        className="absolute inset-0 bg-black/50"
        onClick={() => !isLoading && onClose()}
      />
      <div
        className="relative w-full max-w-lg rounded-xl border border-gray-200 bg-white p-6 shadow-xl"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
      >
        <div className="space-y-2">
          <h2 id={titleId} className="text-lg font-semibold text-gray-900">
            {title}
          </h2>
          <div id={descriptionId} className="space-y-2 text-sm text-gray-600">
            {children}
          </div>
        </div>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className={secondaryButtonClass}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={primaryDestructiveClass}
            style={primaryDestructiveStyle}
          >
            {isLoading ? confirmLoadingLabel : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
