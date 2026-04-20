'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ShieldAlert } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { privacyPolicyApi, type PrivacyPolicyStatusResponse } from '@/lib/api';

const PRIVACY_POLICY_UPDATED_EVENT = 'playlocal-privacy-policy-updated';
const BANNER_EXPAND_MS = 20_000;
const PRIVACY_POLICY_BANNER_ID = 'privacy-policy-login-banner';
const DISMISSED_BANNER_STORAGE_KEY = 'playlocal-dismissed-privacy-policy-banners';

function loadDismissedBannerKeys(): Set<string> {
  if (typeof window === 'undefined') {
    return new Set();
  }

  const raw = window.sessionStorage.getItem(DISMISSED_BANNER_STORAGE_KEY);
  if (!raw) {
    return new Set();
  }

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return new Set();
    }

    return new Set(parsed.filter((value): value is string => typeof value === 'string'));
  } catch {
    return new Set();
  }
}

function saveDismissedBannerKeys(keys: Set<string>) {
  if (typeof window === 'undefined') {
    return;
  }

  window.sessionStorage.setItem(
    DISMISSED_BANNER_STORAGE_KEY,
    JSON.stringify([...keys])
  );
}

export function PrivacyPolicyBanner() {
  const { isAuthenticated, isLoading: isAuthLoading, user } = useAuth();
  const [status, setStatus] = useState<PrivacyPolicyStatusResponse | null>(null);
  const [isStatusLoading, setIsStatusLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(false);
  const dismissedBannerKeysRef = useRef<Set<string>>(loadDismissedBannerKeys());

  const canShowBanner = useMemo(
    () => !isAuthLoading && isAuthenticated && !!status?.bannerVisible,
    [isAuthLoading, isAuthenticated, status?.bannerVisible]
  );

  const bannerInstanceKey = useMemo(() => {
    if (!user?.userId || !status?.lastUpdated || !status?.effectiveDate) {
      return null;
    }

    return `${user.userId}:${status.lastUpdated}:${status.effectiveDate}`;
  }, [user?.userId, status?.lastUpdated, status?.effectiveDate]);

  const loadStatus = useCallback(async () => {
    if (!isAuthenticated) {
      setStatus(null);
      setIsStatusLoading(false);
      return;
    }

    setIsStatusLoading(true);
    try {
      const nextStatus = await privacyPolicyApi.getStatus();
      setStatus(nextStatus);
    } catch {
      setStatus(null);
    } finally {
      setIsStatusLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthLoading) {
      return;
    }

    loadStatus();
  }, [isAuthLoading, user?.userId, loadStatus]);

  useEffect(() => {
    const refresh = () => {
      loadStatus();
    };

    window.addEventListener(PRIVACY_POLICY_UPDATED_EVENT, refresh);

    return () => {
      window.removeEventListener(PRIVACY_POLICY_UPDATED_EVENT, refresh);
    };
  }, [loadStatus]);

  useEffect(() => {
    if (!canShowBanner || !bannerInstanceKey) {
      setIsVisible(false);
      return;
    }

    if (dismissedBannerKeysRef.current.has(bannerInstanceKey)) {
      setIsVisible(false);
      return;
    }

    setIsVisible(true);
    const timer = window.setTimeout(() => {
      dismissedBannerKeysRef.current.add(bannerInstanceKey);
      saveDismissedBannerKeys(dismissedBannerKeysRef.current);
      setIsVisible(false);
    }, BANNER_EXPAND_MS);

    return () => {
      window.clearTimeout(timer);
    };
  }, [canShowBanner, bannerInstanceKey]);

  if (isAuthLoading || isStatusLoading || !canShowBanner || !status || !isVisible) {
    return null;
  }

  return (
    <div
      id={PRIVACY_POLICY_BANNER_ID}
      className="border-b border-amber-200 bg-amber-50 px-4 py-3 text-amber-950"
      role="status"
      aria-live="polite"
    >
      <div className="mx-auto flex max-w-7xl items-start gap-3 sm:items-center">
        <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-700 sm:mt-0" />
        <div className="min-w-0 flex-1 text-sm leading-6">
          <p className="font-semibold uppercase tracking-wide text-amber-900">
            Policy Updated
          </p>
          <p className="mt-1 text-amber-900">{status.notice}</p>
        </div>
      </div>
    </div>
  );
}