'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  /** Optional custom loading UI (e.g. "Loading settings...") */
  loadingContent?: React.ReactNode;
  /** Optional custom error UI (error message, retry callback). AC6. */
  errorContent?: (error: string, retry: () => void) => React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  loadingContent,
  errorContent,
}) => {
  const { isAuthenticated, isLoading, error, retryAuthCheck } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !isAuthenticated && !error) {
      router.replace(`/login?from=${encodeURIComponent(pathname)}`);
    }
  }, [isLoading, isAuthenticated, error, router, pathname]);

  // Show loading while checking auth status (or fetching settings, etc.)
  if (isLoading) {
    if (loadingContent) {
      return <>{loadingContent}</>;
    }
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-6 py-4 shadow-sm">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
          <span className="text-gray-700">Checking your session...</span>
        </div>
      </div>
    );
  }

  // AC6: Show clear error message with retry when auth/settings load failed
  if (!isAuthenticated && error) {
    const retry = () => void retryAuthCheck();
    if (errorContent) {
      return <>{errorContent(error, retry)}</>;
    }
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
        <p className="text-gray-700 text-center mb-4">{error}</p>
        <button
          type="button"
          onClick={retry}
          className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
        >
          Try again
        </button>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-6 py-4 shadow-sm">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
          <span className="text-gray-700">Redirecting to sign in...</span>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
