'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Search,
  Calendar,
  PlusCircle,
  Users,
  User,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useIsMobile } from '@/components/ui/use-mobile';

interface Tab {
  label: string;
  icon: typeof Search;
  href: string;
  match: string;
  authOnly?: boolean;
}

const tabs: Tab[] = [
  { label: 'Discover', icon: Search, href: '/discover?view=map', match: '/discover' },
  { label: 'Calendar', icon: Calendar, href: '/calendar', match: '/calendar' },
  { label: 'Create', icon: PlusCircle, href: '/games/create', match: '/games/create', authOnly: true },
  { label: 'Players', icon: Users, href: '/players', match: '/players' },
  { label: 'Profile', icon: User, href: '/profile', match: '/profile' },
];

export function MobileBottomNav() {
  const pathname = usePathname();
  const { isAuthenticated } = useAuth();
  const isMobile = useIsMobile();

  const hiddenRoutes = ['/', '/login', '/register'];
  if (hiddenRoutes.includes(pathname)) return null;
  if (!isMobile) return null;

  const visibleTabs = tabs.filter((tab) => !tab.authOnly || isAuthenticated);

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40"
      style={{
        display: 'flex',
        justifyContent: 'center',
        paddingBottom: 'calc(8px + env(safe-area-inset-bottom))',
      }}
    >
      <div
        style={{
          background: 'rgba(0, 0, 0, 0.25)',
          backdropFilter: 'saturate(180%) blur(12px)',
          WebkitBackdropFilter: 'saturate(180%) blur(12px)',
          borderRadius: '34px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '64px',
            padding: '0 10px',
            gap: '2px',
          }}
        >
          {visibleTabs.map((tab) => {
            const isActive = pathname.startsWith(tab.match);
            const Icon = tab.icon;

            return (
              <Link
                key={tab.label}
                href={tab.href}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: isActive ? '8px' : '0px',
                  padding: isActive ? '6px 14px 6px 6px' : '6px',
                  borderRadius: '50px',
                  background: 'rgba(255, 255, 255, 0.35)',
                  textDecoration: 'none',
                  minHeight: '44px',
                  transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
                  overflow: 'hidden',
                }}
              >
                {/* Icon circle — green when active, subtle when inactive */}
                <div
                  style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '50%',
                    background: isActive ? '#34d399' : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    transition: 'background 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                >
                  <Icon
                    style={{
                      width: isActive ? '19px' : '23px',
                      height: isActive ? '19px' : '23px',
                      color: isActive ? '#052e16' : 'rgba(255, 255, 255, 0.85)',
                      transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
                    }}
                    strokeWidth={isActive ? 2.5 : 1.8}
                  />
                </div>

                {/* Label — expands in on active, collapses on inactive */}
                <span
                  style={{
                    fontSize: '13px',
                    fontWeight: 600,
                    color: 'rgba(255, 255, 255, 0.95)',
                    whiteSpace: 'nowrap',
                    letterSpacing: '0.01em',
                    maxWidth: isActive ? '80px' : '0px',
                    opacity: isActive ? 1 : 0,
                    transition: 'max-width 0.35s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.25s ease',
                    overflow: 'hidden',
                  }}
                >
                  {tab.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
