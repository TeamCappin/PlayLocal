'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  MapPin,
  Search,
  PlusCircle,
  User,
  Bell,
  Calendar,
  Users,
  LogOut,
  LogIn,
  Bot,
  Settings,
  ChevronDown,
} from 'lucide-react';
import { useAssistant } from '@/context/AssistantContext';
import { inferAssistantRoute } from '@/lib/inferAssistantRoute';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/hooks/useNotifications';
import { useIsMobile } from '@/components/ui/use-mobile';
import { performLogoutRedirect } from '@/lib/authRedirect';

export function Navigation() {
  const [mounted, setMounted] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  // Ensure hydration is complete before rendering
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  // Close profile menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target as Node)
      ) {
        setProfileMenuOpen(false);
      }
    }
    if (profileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [profileMenuOpen]);

  // Close menu when route changes (e.g. after navigating to Settings)
  useEffect(() => {
    setProfileMenuOpen(false);
  }, [pathname]);

  const isLanding = pathname === '/';
  const isMobile = useIsMobile();
  const { user, isAuthenticated, isLoading } = useAuth();
  const { openAssistant } = useAssistant();

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
            {!isMobile && <div className="flex items-center gap-6">
              <div className="w-20 h-8 bg-gray-200 rounded animate-pulse"></div>
              <div className="w-20 h-8 bg-gray-200 rounded animate-pulse"></div>
            </div>}
          </div>
        </div>
      </nav>
    );
  }

  const handleLogout = () => {
    performLogoutRedirect('/');
  };

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <MapPin className="w-8 h-8 text-emerald-600" />
            <span className="text-xl text-gray-900">PlayLocal</span>
          </Link>

          {/* Mobile: notification bell (authenticated) or sign-in (unauthenticated) */}
          {isMobile && <div className="flex items-center gap-2">
            {isLoading ? (
              <div className="w-10 h-10 bg-gray-200 rounded-lg animate-pulse"></div>
            ) : isAuthenticated ? (
              <>
                <Link
                  href="/notifications"
                  className="relative flex items-center justify-center min-h-[44px] min-w-[44px] text-gray-600 hover:text-gray-900 rounded-lg transition-colors"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 min-w-[18px] h-[18px] flex items-center justify-center bg-red-500 text-white text-xs rounded-full px-1">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center justify-center min-h-[44px] min-w-[44px] text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Sign out"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 rounded-lg transition-colors"
              >
                <LogIn className="w-5 h-5" />
                <span>Sign In</span>
              </Link>
            )}
          </div>}

          {/* Desktop: full navigation links */}
          {!isMobile && <div className="flex items-center gap-6">
            <Link
              href="/discover?view=map"
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                pathname === '/discover'
                  ? 'text-emerald-600 bg-emerald-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Search className="w-5 h-5" />
              <span>Discover Games</span>
            </Link>

            <button
              type="button"
              onClick={() => {
                const { context: c, gameId: gid } = inferAssistantRoute(pathname);
                openAssistant(c, gid);
              }}
              className="flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100"
              aria-label="Open help assistant"
            >
              <Bot className="w-5 h-5 shrink-0" aria-hidden />
              <span>Help</span>
            </button>

            <Link
              href="/calendar"
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                pathname === '/calendar'
                  ? 'text-emerald-600 bg-emerald-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Calendar className="w-5 h-5" />
              <span>Calendar</span>
            </Link>

            <Link
              href="/players"
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                pathname === '/players'
                  ? 'text-emerald-600 bg-emerald-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Users className="w-5 h-5" />
              <span>Players</span>
            </Link>

            {isLoading ? (
              <div className="flex items-center gap-4">
                <div className="w-20 h-8 bg-gray-200 rounded-lg animate-pulse"></div>
                <div className="w-16 h-8 bg-gray-200 rounded-lg animate-pulse"></div>
              </div>
            ) : isAuthenticated ? (
              <>
                <Link
                  href="/games/create"
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                    pathname === '/games/create'
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

                {/* Profile / avatar menu: Profile, Settings, Sign out */}
                <div className="relative" ref={profileMenuRef}>
                  <button
                    type="button"
                    onClick={() => setProfileMenuOpen((open) => !open)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                      pathname.startsWith('/profile') || pathname.startsWith('/settings')
                        ? 'text-emerald-600 bg-emerald-50'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                    aria-expanded={profileMenuOpen}
                    aria-haspopup="true"
                    aria-label="Open account menu"
                  >
                    {user?.displayName ? (
                      <div className="w-6 h-6 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center text-white text-xs font-medium">
                        {user.displayName[0].toUpperCase()}
                      </div>
                    ) : (
                      <User className="w-5 h-5" />
                    )}
                    <span>{user?.displayName || 'Profile'}</span>
                    <ChevronDown
                      className="w-4 h-4 shrink-0 transition-transform duration-200"
                      style={{ transform: profileMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
                    />
                  </button>

                  {profileMenuOpen && (
                    <div
                      className="absolute right-0 mt-1 w-52 py-1 bg-white rounded-lg border border-gray-200 shadow-lg z-50"
                      role="menu"
                    >
                      <Link
                        href="/profile"
                        className="flex items-center gap-3 px-4 py-2.5 text-gray-700 hover:bg-gray-50 transition-colors"
                        role="menuitem"
                        onClick={() => setProfileMenuOpen(false)}
                      >
                        <User className="w-5 h-5 text-gray-500" />
                        <span>Profile</span>
                      </Link>
                      <Link
                        href="/settings"
                        className="flex items-center gap-3 px-4 py-2.5 text-gray-700 hover:bg-gray-50 transition-colors"
                        role="menuitem"
                        onClick={() => setProfileMenuOpen(false)}
                      >
                        <Settings className="w-5 h-5 text-gray-500" />
                        <span>Settings</span>
                      </Link>
                      <hr className="my-1 border-gray-100" />
                      <button
                        type="button"
                        onClick={() => {
                          setProfileMenuOpen(false);
                          handleLogout();
                        }}
                        className="flex items-center gap-3 w-full px-4 py-2.5 text-left text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors"
                        role="menuitem"
                      >
                        <LogOut className="w-5 h-5 text-gray-500" />
                        <span>Sign out</span>
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                    pathname === '/login'
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
          </div>}
        </div>
      </div>
    </nav>
  );
}
