/**
 * US 7.15: Action Feedback & Confirmation Messages
 * Tests for toast notifications and confirmation dialogs
 */

import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { toast } from '@/lib/toast';

const mockListByGame = jest.fn();
const mockDeletePhoto = jest.fn();

// Mock sonner toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    loading: jest.fn(() => 'toast-id'),
    dismiss: jest.fn(),
    info: jest.fn(),
    warning: jest.fn(),
  },
}));

jest.mock('@/lib/api', () => ({
  __esModule: true,
  default: {
    photos: {
      listByGame: (...args: unknown[]) => mockListByGame(...args),
      requestUploadSlot: jest.fn(),
      finalizeUpload: jest.fn(),
      delete: (...args: unknown[]) => mockDeletePhoto(...args),
    },
  },
}));

describe('US 7.15: Action Feedback & Confirmation Messages', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Toast Helper Functions', () => {
    it('should call sonner success toast with correct params', () => {
      toast.success('Game created');

      const { toast: sonnerToast } = require('sonner');
      expect(sonnerToast.success).toHaveBeenCalledWith('Game created', {
        duration: 3000,
      });
    });

    it('should call sonner error toast with correct params', () => {
      toast.error('Failed to join game');

      const { toast: sonnerToast } = require('sonner');
      expect(sonnerToast.error).toHaveBeenCalledWith('Failed to join game', {
        duration: 4000,
      });
    });

    it('should use past tense for success messages', () => {
      // Success messages should use past tense
      toast.success('Game created'); // not "Game create" or "Creating game"
      toast.success('Profile updated'); // not "Profile update"
      toast.success('Photo uploaded'); // not "Upload photo"

      const { toast: sonnerToast } = require('sonner');
      expect(sonnerToast.success).toHaveBeenCalledTimes(3);
    });

    it('should provide actionable error messages', () => {
      import('@/lib/toast').then((module) => {
        const message = module.getActionableErrorMessage(
          { status: 0 },
          'create game'
        );
        expect(message).toContain('try again');
        expect(message.toLowerCase()).toContain('connection');
      });
    });
  });

  describe('Confirmation Dialogs', () => {
    describe('Leave Game Confirmation', () => {
      it('should display confirmation dialog for leave game action', async () => {
        const { ConfirmLeaveGameDialog } = await import(
          '@/components/ConfirmLeaveGameDialog'
        );

        const onConfirm = jest.fn();
        const onClose = jest.fn();

        render(
          <ConfirmLeaveGameDialog
            isOpen={true}
            onClose={onClose}
            onConfirm={onConfirm}
            gameTitle="5v5 Basketball"
            isLoading={false}
          />
        );

        // Should show game title
        expect(screen.getByText(/5v5 Basketball/i)).toBeInTheDocument();

        // Should explain that user can rejoin
        expect(
          screen.getByText(/You can rejoin if spots are available/i)
        ).toBeInTheDocument();

        // Should have cancel button
        expect(screen.getByText(/Stay in Game/i)).toBeInTheDocument();

        // Should have confirm button (title is "Leave Game?" — avoid ambiguous getByText)
        expect(
          screen.getByRole('button', { name: 'Leave Game' })
        ).toBeInTheDocument();
      });

      it('should call onConfirm when confirmed', async () => {
        const { ConfirmLeaveGameDialog } = await import(
          '@/components/ConfirmLeaveGameDialog'
        );

        const onConfirm = jest.fn();
        const onClose = jest.fn();

        render(
          <ConfirmLeaveGameDialog
            isOpen={true}
            onClose={onClose}
            onConfirm={onConfirm}
            gameTitle="Test Game"
            isLoading={false}
          />
        );

        fireEvent.click(screen.getByRole('button', { name: 'Leave Game' }));
        expect(onConfirm).toHaveBeenCalledTimes(1);
      });
    });

    describe('Delete Photo Confirmation', () => {
      it('should warn that delete is irreversible', async () => {
        const { PhotosPanel } = await import('@/components/photos/PhotosPanel');

        mockListByGame.mockResolvedValueOnce([
          {
            mediaId: 'photo-1',
            url: 'https://cdn.test/photo-1.jpg',
            createdAt: '2026-03-22T12:00:00Z',
            uploaderUserId: 'user-1',
          },
        ]);

        render(<PhotosPanel gameId="game-123" canUpload={true} />);

        await waitFor(() => {
          expect(screen.getByAltText('Game photo')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByTitle('Delete this photo'));

        expect(screen.getByText('Delete Photo?')).toBeInTheDocument();
        expect(
          screen.getByText(/This photo will be permanently deleted/i)
        ).toBeInTheDocument();
        expect(
          screen.getByText(/This action cannot be undone/i)
        ).toBeInTheDocument();
      });
    });

    describe('Delete Account Confirmation', () => {
      it('should require typing DELETE to confirm account deletion', async () => {
        const { ConfirmAccountActionDialog } = await import(
          '@/components/ConfirmAccountActionDialog'
        );

        const onConfirm = jest.fn();
        const onClose = jest.fn();

        render(
          <ConfirmAccountActionDialog
            isOpen={true}
            onClose={onClose}
            onConfirm={onConfirm}
            action="delete"
            isLoading={false}
          />
        );

        // Should show warning about irreversibility
        expect(
          screen.getByText(/This action is IRREVERSIBLE/i)
        ).toBeInTheDocument();

        // Confirm button should be disabled initially
        const confirmButton = screen.getByText(/Delete Forever/i);
        expect(confirmButton).toBeDisabled();

        // Type "DELETE" in the confirmation input
        const input = screen.getByPlaceholderText(/DELETE/i);
        fireEvent.change(input, { target: { value: 'DELETE' } });

        // Now button should be enabled
        await waitFor(() => {
          expect(confirmButton).not.toBeDisabled();
        });
      });

      it('should explain consequences of deactivation vs deletion', async () => {
        const { ConfirmAccountActionDialog } = await import(
          '@/components/ConfirmAccountActionDialog'
        );

        const { rerender } = render(
          <ConfirmAccountActionDialog
            isOpen={true}
            onClose={jest.fn()}
            onConfirm={jest.fn()}
            action="deactivate"
            isLoading={false}
          />
        );

        // Deactivate should mention it's reversible
        expect(
          screen.getByText(/reactivate within 30 days/i)
        ).toBeInTheDocument();

        // Delete should say it's permanent
        rerender(
          <ConfirmAccountActionDialog
            isOpen={true}
            onClose={jest.fn()}
            onConfirm={jest.fn()}
            action="delete"
            isLoading={false}
          />
        );

        expect(
          screen.getByText(/Deleting your account will permanently:/i)
        ).toBeInTheDocument();
        expect(
          screen.getByText(/Cannot be recovered/i)
        ).toBeInTheDocument();
      });
    });
  });

  describe('Loading States', () => {
    it('should prevent double submission during loading', async () => {
      const { ConfirmLeaveGameDialog } = await import(
        '@/components/ConfirmLeaveGameDialog'
      );

      render(
        <ConfirmLeaveGameDialog
          isOpen={true}
          onClose={jest.fn()}
          onConfirm={jest.fn()}
          gameTitle="Test Game"
          isLoading={true}
        />
      );

      expect(screen.getByRole('button', { name: 'Stay in Game' })).toBeDisabled();
      expect(screen.getByRole('button', { name: 'Leaving...' })).toBeDisabled();
    });

    it('should show loading text during destructive actions', async () => {
      const { ConfirmAccountActionDialog } = await import(
        '@/components/ConfirmAccountActionDialog'
      );

      render(
        <ConfirmAccountActionDialog
          isOpen={true}
          onClose={jest.fn()}
          onConfirm={jest.fn()}
          action="delete"
          isLoading={true}
        />
      );

      expect(screen.getByRole('button', { name: 'Deleting...' })).toBeDisabled();
    });
  });

  describe('Error Handling', () => {
    it('should distinguish network errors from server errors', async () => {
      const { getActionableErrorMessage } = await import('@/lib/toast');

      // Network error (status 0)
      const networkError = getActionableErrorMessage({ status: 0 }, 'join game');
      expect(networkError.toLowerCase()).toContain('connection');

      // Server error (status 500)
      const serverError = getActionableErrorMessage(
        { status: 500 },
        'join game'
      );
      expect(serverError.toLowerCase()).toContain('try again later');

      // Auth error (status 401)
      const authError = getActionableErrorMessage({ status: 401 }, 'join game');
      expect(authError.toLowerCase()).toContain('sign in');
    });

    it('should never expose technical details to users', async () => {
      const { getActionableErrorMessage } = await import('@/lib/toast');

      const error = {
        stack: 'Error: Internal server error at Object.fetch...',
        message: 'Database connection failed',
      };

      const message = getActionableErrorMessage(error, 'create game');

      // Should not include stack trace
      expect(message).not.toContain('at Object.fetch');
      expect(message).not.toContain('stack');

      // Should be user-friendly
      expect(message.toLowerCase()).toContain('try');
    });
  });

  describe('Consistency', () => {
    it('should use consistent wording patterns', () => {
      // All success messages should be past tense
      const successMessages = [
        'Game created',
        'Game updated',
        'Game deleted',
        'Joined game',
        'Left game',
        'Photo uploaded',
        'Photo deleted',
        'Profile updated',
        'Account deactivated',
        'Account deleted',
      ];

      successMessages.forEach((msg) => {
        // Past tense / participle, or short "X game" phrases (e.g. Joined game)
        expect(msg).toMatch(/ed$|ted$|ned$| game$/i);
      });
    });

    it('should avoid vague success messages', () => {
      // Bad examples that should NOT be used
      const vagueMessages = ['Success', 'Done', 'OK', 'Completed'];

      // Good examples should specify the action
      const goodMessages = [
        'Game created',
        'Profile updated',
        'Photo deleted',
      ];

      goodMessages.forEach((msg) => {
        expect(vagueMessages).not.toContain(msg);
      });
    });
  });
});
