import { toast as sonnerToast } from 'sonner';

/**
 * Centralized toast notification helpers for consistent user feedback
 * across all major actions in the application.
 *
 * Usage guidelines:
 * - Use past tense for success messages ("Game created", "Profile updated")
 * - Include specific details when helpful ("Added to waitlist #3")
 * - For errors, include actionable next steps
 * - Keep messages concise (1-2 lines max)
 */

export const toast = {
  /**
   * Show a success message (green checkmark, 3 second duration)
   * @param message - Past tense action description (e.g., "Game created")
   */
  success: (message: string) => {
    sonnerToast.success(message, {
      duration: 3000,
    });
  },

  /**
   * Show an error message (red X, 4 second duration)
   * @param message - Error description with suggested action (e.g., "Couldn't join game. Check your connection and try again.")
   */
  error: (message: string) => {
    sonnerToast.error(message, {
      duration: 4000,
    });
  },

  /**
   * Show a loading message (spinner, requires manual dismiss)
   * Returns a function to dismiss the toast
   * @param message - Present continuous action (e.g., "Uploading photo...")
   */
  loading: (message: string) => {
    const id = sonnerToast.loading(message);
    return () => sonnerToast.dismiss(id);
  },

  /**
   * Show an info message (blue info icon, 3 second duration)
   * @param message - Information to convey
   */
  info: (message: string) => {
    sonnerToast.info(message, {
      duration: 3000,
    });
  },

  /**
   * Show a warning message (yellow warning icon, 4 second duration)
   * @param message - Warning to convey
   */
  warning: (message: string) => {
    sonnerToast.warning(message, {
      duration: 4000,
    });
  },

  /**
   * Dismiss a specific toast or all toasts
   * @param toastId - Optional ID of toast to dismiss (dismisses all if not provided)
   */
  dismiss: (toastId?: string | number) => {
    sonnerToast.dismiss(toastId);
  },
};

/**
 * Helper to format error messages from API responses
 * @param error - Error object from API call
 * @param defaultMessage - Fallback message if error doesn't have details
 */
export function formatErrorMessage(error: any, defaultMessage: string): string {
  // Extract message from various error formats
  if (typeof error === 'string') {
    return error;
  }

  if (error?.message) {
    return error.message;
  }

  if (error?.data?.message) {
    return error.data.message;
  }

  // Handle field validation errors
  if (error?.data?.fieldErrors) {
    const fieldMessages = Object.entries(error.data.fieldErrors)
      .map(([field, msg]) => `${field}: ${msg}`)
      .join('. ');
    if (fieldMessages) {
      return fieldMessages;
    }
  }

  return defaultMessage;
}

/**
 * Helper to determine if an error is a network/connection issue
 */
export function isNetworkError(error: any): boolean {
  const msg = error?.message?.toLowerCase();
  return (
    error?.status === 0 ||
    !!msg?.includes('network') ||
    !!msg?.includes('connection') ||
    !!msg?.includes('fetch')
  );
}

/**
 * Get user-friendly error message with suggested action
 */
export function getActionableErrorMessage(error: any, action: string): string {
  const baseMessage = formatErrorMessage(error, `Couldn't ${action}`);

  if (isNetworkError(error)) {
    return `${baseMessage}. Check your connection and try again.`;
  }

  // For specific HTTP status codes
  if (error?.status === 401 || error?.status === 403) {
    return `${baseMessage}. You may need to sign in again.`;
  }

  if (error?.status === 404) {
    return `${baseMessage}. This item may have been removed.`;
  }

  if (error?.status === 409) {
    return `${baseMessage}. Please refresh the page and try again.`;
  }

  if (error?.status >= 500) {
    return `${baseMessage}. Please try again later or contact support.`;
  }

  // Include the action hint if not already suggested
  if (!baseMessage.toLowerCase().includes('try')) {
    return `${baseMessage}. Please try again.`;
  }

  return baseMessage;
}
