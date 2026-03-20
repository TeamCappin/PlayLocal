import * as React from 'react';

const MOBILE_BREAKPOINT = 768;
const DESKTOP_BREAKPOINT = 1024;

export type Breakpoint = 'mobile' | 'tablet' | 'desktop';

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(
    undefined
  );

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    mql.addEventListener('change', onChange);
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  return !!isMobile;
}

function getBreakpoint(width: number): Breakpoint {
  if (width < MOBILE_BREAKPOINT) return 'mobile';
  if (width < DESKTOP_BREAKPOINT) return 'tablet';
  return 'desktop';
}

export function useBreakpoint(): Breakpoint {
  const [breakpoint, setBreakpoint] = React.useState<Breakpoint>('desktop');

  React.useEffect(() => {
    const onResize = () => setBreakpoint(getBreakpoint(window.innerWidth));
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return breakpoint;
}
