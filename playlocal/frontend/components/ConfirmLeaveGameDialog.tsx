import { ConfirmActionDialog } from './ConfirmActionDialog';

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
  return (
    <ConfirmActionDialog
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      isLoading={isLoading}
      title="Leave Game?"
      titleId="leave-game-title"
      descriptionId="leave-game-description"
      overlayAriaLabel="Close leave game dialog"
      cancelLabel="Stay in Game"
      confirmLabel="Leave Game"
      confirmLoadingLabel="Leaving..."
    >
      <p>Are you sure you want to leave &quot;{gameTitle}&quot;?</p>
      <p>You can rejoin if spots are available and the game hasn&apos;t started yet.</p>
    </ConfirmActionDialog>
  );
}
