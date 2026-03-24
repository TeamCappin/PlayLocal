/** @jest-environment node */

import {
  consumeRedirectToast,
  performLogoutRedirect,
  performRedirect,
} from '@/lib/authRedirect';
import { authApi } from '@/lib/api';

jest.mock('@/lib/api', () => ({
  authApi: {
    logout: jest.fn(),
  },
}));

type WindowMock = {
  location: {
    replace: jest.Mock;
    assign: jest.Mock;
  };
  requestAnimationFrame?: (callback: FrameRequestCallback) => number;
  setTimeout: jest.Mock;
  sessionStorage: {
    getItem: jest.Mock;
    setItem: jest.Mock;
    removeItem: jest.Mock;
    clear: jest.Mock;
  };
};

describe('authRedirect', () => {
  const originalWindow = global.window;
  let store: Record<string, string>;
  let windowMock: WindowMock;

  const installWindow = (overrides: Partial<WindowMock> = {}) => {
    store = {};

    windowMock = {
      location: {
        replace: jest.fn(),
        assign: jest.fn(),
      },
      requestAnimationFrame: (callback: FrameRequestCallback) => {
        callback(0);
        return 1;
      },
      setTimeout: jest.fn((callback: () => void) => {
        callback();
        return 1;
      }),
      sessionStorage: {
        getItem: jest.fn((key: string) => store[key] ?? null),
        setItem: jest.fn((key: string, value: string) => {
          store[key] = value;
        }),
        removeItem: jest.fn((key: string) => {
          delete store[key];
        }),
        clear: jest.fn(() => {
          store = {};
        }),
      },
      ...overrides,
    };

    (global as typeof globalThis & { window?: WindowMock }).window = windowMock;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    installWindow();
  });

  afterAll(() => {
    (global as typeof globalThis & { window?: typeof originalWindow }).window =
      originalWindow;
  });

  it('returns null when there is no queued toast', () => {
    expect(consumeRedirectToast()).toBeNull();
  });

  it('consumes a queued toast and clears it', () => {
    windowMock.sessionStorage.setItem(
      'playlocal.redirectToast',
      JSON.stringify({ message: 'Left game', type: 'success' })
    );

    expect(consumeRedirectToast()).toEqual({
      message: 'Left game',
      type: 'success',
    });
    expect(windowMock.sessionStorage.removeItem).toHaveBeenCalledWith(
      'playlocal.redirectToast'
    );
  });

  it('returns null for invalid queued toast payloads', () => {
    windowMock.sessionStorage.setItem('playlocal.redirectToast', '{"message":""}');
    expect(consumeRedirectToast()).toBeNull();

    windowMock.sessionStorage.setItem('playlocal.redirectToast', 'not-json');
    expect(consumeRedirectToast()).toBeNull();
  });

  it('queues the toast and redirects with replace by default', () => {
    performRedirect('/discover', { message: 'Done', type: 'success' });

    expect(windowMock.sessionStorage.setItem).toHaveBeenCalledWith(
      'playlocal.redirectToast',
      JSON.stringify({ message: 'Done', type: 'success' })
    );
    expect(windowMock.location.replace).toHaveBeenCalledWith('/discover');
    expect(windowMock.location.assign).not.toHaveBeenCalled();
  });

  it('redirects with assign when replace is disabled', () => {
    performRedirect('/discover', undefined, { replace: false });

    expect(windowMock.location.assign).toHaveBeenCalledWith('/discover');
    expect(windowMock.location.replace).not.toHaveBeenCalled();
  });

  it('falls back to setTimeout when requestAnimationFrame is unavailable', () => {
    installWindow({ requestAnimationFrame: undefined });

    performRedirect('/calendar');

    expect(windowMock.setTimeout).toHaveBeenCalled();
    expect(windowMock.location.replace).toHaveBeenCalledWith('/calendar');
  });

  it('logs out before redirecting and queues a toast when provided', () => {
    performLogoutRedirect('/', { message: 'Signed out', type: 'success' });

    expect(authApi.logout).toHaveBeenCalledTimes(1);
    expect(windowMock.sessionStorage.setItem).toHaveBeenCalledWith(
      'playlocal.redirectToast',
      JSON.stringify({ message: 'Signed out', type: 'success' })
    );
    expect(windowMock.location.replace).toHaveBeenCalledWith('/');
  });

  it('returns early when window is unavailable', () => {
    delete (global as typeof globalThis & { window?: WindowMock }).window;

    expect(consumeRedirectToast()).toBeNull();
    expect(() => performRedirect('/discover')).not.toThrow();
    expect(() => performLogoutRedirect('/')).not.toThrow();
  });
});
