jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    loading: jest.fn(() => 'toast-loading-id'),
    info: jest.fn(),
    warning: jest.fn(),
    dismiss: jest.fn(),
  },
}));

import { toast as sonnerToast } from 'sonner';
import {
  toast,
  formatErrorMessage,
  isNetworkError,
  getActionableErrorMessage,
} from '@/lib/toast';

describe('toast helpers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('toast wrapper', () => {
    it('delegates to sonner with expected durations', () => {
      toast.success('ok');
      expect(sonnerToast.success).toHaveBeenCalledWith('ok', {
        duration: 3000,
      });

      toast.error('bad');
      expect(sonnerToast.error).toHaveBeenCalledWith('bad', {
        duration: 4000,
      });

      toast.info('fyi');
      expect(sonnerToast.info).toHaveBeenCalledWith('fyi', {
        duration: 3000,
      });

      toast.warning('careful');
      expect(sonnerToast.warning).toHaveBeenCalledWith('careful', {
        duration: 4000,
      });

      toast.dismiss();
      expect(sonnerToast.dismiss).toHaveBeenCalledWith(undefined);
      toast.dismiss('x');
      expect(sonnerToast.dismiss).toHaveBeenCalledWith('x');
    });

    it('loading returns dismiss callback', () => {
      const dismiss = toast.loading('wait');
      expect(sonnerToast.loading).toHaveBeenCalledWith('wait');
      dismiss();
      expect(sonnerToast.dismiss).toHaveBeenCalledWith('toast-loading-id');
    });
  });

  describe('formatErrorMessage', () => {
    it('handles string, message, data.message, fieldErrors, and default', () => {
      expect(formatErrorMessage('plain', 'def')).toBe('plain');
      expect(formatErrorMessage({ message: 'm' }, 'def')).toBe('m');
      expect(
        formatErrorMessage({ data: { message: 'dm' } }, 'def')
      ).toBe('dm');
      expect(
        formatErrorMessage(
          { data: { fieldErrors: { a: 'x', b: 'y' } } },
          'def'
        )
      ).toBe('a: x. b: y');
      expect(
        formatErrorMessage({ data: { fieldErrors: {} } }, 'fallback')
      ).toBe('fallback');
      expect(formatErrorMessage({}, 'fallback')).toBe('fallback');
    });
  });

  describe('isNetworkError', () => {
    it('detects status 0 and network-ish messages', () => {
      expect(isNetworkError({ status: 0 })).toBe(true);
      expect(isNetworkError({ message: 'Network failed' })).toBe(true);
      expect(isNetworkError({ message: 'Connection refused' })).toBe(true);
      expect(isNetworkError({ message: 'Failed to fetch' })).toBe(true);
      expect(isNetworkError({ message: 'ok' })).toBe(false);
      expect(isNetworkError({ status: 500 })).toBe(false);
    });
  });

  describe('getActionableErrorMessage', () => {
    it('appends network hint', () => {
      expect(getActionableErrorMessage({ status: 0 }, 'save')).toContain(
        'connection'
      );
    });

    it('handles auth, not found, conflict, and server errors', () => {
      expect(getActionableErrorMessage({ status: 401 }, 'x')).toContain(
        'sign in'
      );
      expect(getActionableErrorMessage({ status: 403 }, 'x')).toContain(
        'sign in'
      );
      expect(getActionableErrorMessage({ status: 404 }, 'x')).toContain(
        'removed'
      );
      expect(getActionableErrorMessage({ status: 409 }, 'x')).toContain(
        'refresh'
      );
      expect(getActionableErrorMessage({ status: 500 }, 'x')).toContain(
        'try again later'
      );
    });

    it('appends try again when base message lacks "try"', () => {
      const msg = getActionableErrorMessage(
        { message: 'Nope' },
        'update profile'
      );
      expect(msg).toContain('Please try again');
    });

    it('does not double-append when base already mentions try', () => {
      expect(
        getActionableErrorMessage({ message: 'Please try later' }, 'x')
      ).toBe('Please try later');
    });
  });
});
