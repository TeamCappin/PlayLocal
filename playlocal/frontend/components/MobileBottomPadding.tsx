'use client';

import { usePathname } from 'next/navigation';
import { useIsMobile } from '@/components/ui/use-mobile';

export function MobileBottomPadding() {
  const isMobile = useIsMobile();
  const pathname = usePathname();

  const hiddenRoutes = ['/', '/login', '/register'];
  if (!isMobile || hiddenRoutes.includes(pathname)) return null;

  return <div style={{ height: '50px' }} aria-hidden="true" />;
}
