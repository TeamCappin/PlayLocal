'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { MapPin, Search, PlusCircle, User, Bell, Calendar, Users, LogOut, LogIn } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/hooks/useNotifications';

export function Navigation() {
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const navigate = useRouter();

  // Ensure hydration is complete before rendering
  useEffect(() => {
    setMounted(true);
  }, []);

  const isLanding = pathname === '/';
  const { user, isAuthenticated, isLoading, logout } = useAuth();

  // Get notification count (silently fail if backend unavailable)
  const { unreadCount } = useNotifications();

  // Don't render on landing page
  if (isLanding) {
    return null;
  }

  // Show skeleton during SSR/hydration to prevent layout shift
  if (!mounted) {
    return (
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
              <div className="w-24 h-6 bg-gray-200 rounded animate-pulse"></div>
            </div>
            <div className="flex items-center gap-6">
              <div className="w-20 h-8 bg-gray-200 rounded animate-pulse"></div>
              <div className="w-20 h-8 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  const handleLogout = () => {
    logout();
    navigate.push('/');
  };

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <MapPin className="w-8 h-8 text-emerald-600" />
            <span className="text-xl text-gray-900">PlayLocal</span>
          </Link>

          <div className="flex items-center gap-6">
            <Link
              href="/discover"
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${pathname === '/discover'
                ? 'text-emerald-600 bg-emerald-50'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
            >
              <Search className="w-5 h-5" />
              <span>Discover</span>
            </Link>

            <Link
              href="/calendar"
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${pathname === '/calendar'
                ? 'text-emerald-600 bg-emerald-50'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
            >
              <Calendar className="w-5 h-5" />
              <span>Calendar</span>
            </Link>

            <Link
              href="/players"
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${pathname === '/players'
                ? 'text-emerald-600 bg-emerald-50'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
            >
              <Users className="w-5 h-5" />
              <span>Players</span>
            </Link>

            {isLoading ? (
              // Show loading skeleton while checking auth
              <div className="flex items-center gap-4">
                <div className="w-20 h-8 bg-gray-200 rounded-lg animate-pulse"></div>
                <div className="w-16 h-8 bg-gray-200 rounded-lg animate-pulse"></div>
              </div>
            ) : isAuthenticated ? (
              <>
                <Link
                  href="/games/create"
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${pathname === '/games/create'
                    ? 'text-emerald-600 bg-emerald-50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                >
                  <PlusCircle className="w-5 h-5" />
                  <span>Create</span>
                </Link>

                <Link
                  href="/notifications"
                  className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 min-w-[18px] h-[18px] flex items-center justify-center bg-red-500 text-white text-xs rounded-full px-1">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Link>

                <Link
                  href="/profile"
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${pathname.startsWith('/profile')
                    ? 'text-emerald-600 bg-emerald-50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                >
                  {user?.displayName ? (
                    <div className="w-6 h-6 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center text-white text-xs font-medium">
                      {user.displayName[0].toUpperCase()}
                    </div>
                  ) : (
                    <User className="w-5 h-5" />
                  )}
                  <span>{user?.displayName || 'Profile'}</span>
                </Link>

                <button
                  onClick={handleLogout}
                  className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Sign out"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${pathname === '/login'
                    ? 'text-emerald-600 bg-emerald-50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                >
                  <LogIn className="w-5 h-5" />
                  <span>Sign In</span>
                </Link>

                <Link
                  href="/register"
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                >
                  <span>Sign Up</span>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}