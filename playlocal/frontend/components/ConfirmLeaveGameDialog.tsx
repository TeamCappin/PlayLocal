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
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Leave Game?</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to leave &quot;{gameTitle}&quot;?
            {'\n\n'}
            You can rejoin if spots are available and the game hasn&apos;t started yet.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Stay in Game</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isLoading}
            className="bg-red-600 hover:bg-red-700"
          >
            {isLoading ? 'Leaving...' : 'Leave Game'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
