import { authApi } from '@/lib/api';

const REDIRECT_TOAST_KEY = 'playlocal.redirectToast';

export type RedirectToastType = 'success' | 'error' | 'info' | 'warning';

export interface RedirectToastPayload {
  message: string;
  type: RedirectToastType;
}

function queueRedirectToast(payload: RedirectToastPayload) {
  if (typeof window === 'undefined') {
    return;
  }

  window.sessionStorage.setItem(REDIRECT_TOAST_KEY, JSON.stringify(payload));
}

export function consumeRedirectToast(): RedirectToastPayload | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const raw = window.sessionStorage.getItem(REDIRECT_TOAST_KEY);
  if (!raw) {
    return null;
  }

  window.sessionStorage.removeItem(REDIRECT_TOAST_KEY);

  try {
    const parsed = JSON.parse(raw) as RedirectToastPayload;
    if (!parsed?.message || !parsed?.type) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function scheduleBrowserRedirect(callback: () => void) {
  if (typeof window === 'undefined') {
    return;
  }

  if (typeof window.requestAnimationFrame === 'function') {
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(callback);
    });
    return;
  }

  window.setTimeout(callback, 0);
}

export function performRedirect(
  destination: string,
  queuedToast?: RedirectToastPayload,
  options?: { replace?: boolean }
) {
  if (typeof window === 'undefined') {
    return;
  }

  if (queuedToast) {
    queueRedirectToast(queuedToast);
  }

  scheduleBrowserRedirect(() => {
    if (options?.replace ?? true) {
      window.location.replace(destination);
      return;
    }

    window.location.assign(destination);
  });
}

export function performLogoutRedirect(
  destination: string,
  queuedToast?: RedirectToastPayload
) {
  if (typeof window === 'undefined') {
    return;
  }

  if (queuedToast) {
    queueRedirectToast(queuedToast);
  }

  authApi.logout();
  scheduleBrowserRedirect(() => {
    window.location.replace(destination);
  });
}
