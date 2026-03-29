import { renderHook, act } from '@testing-library/react';
import { useIsMobile, useBreakpoint } from '../../../components/ui/use-mobile';

describe('useIsMobile', () => {
  let listeners: Array<() => void>;
  let matchMediaMock: jest.Mock;

  beforeEach(() => {
    listeners = [];
    matchMediaMock = jest.fn().mockReturnValue({
      matches: false,
      addEventListener: (_: string, cb: () => void) => listeners.push(cb),
      removeEventListener: jest.fn(),
    });
    Object.defineProperty(window, 'matchMedia', { value: matchMediaMock, writable: true });
  });

  it('returns false when width >= 768', () => {
    Object.defineProperty(window, 'innerWidth', { value: 1024, writable: true });
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);
  });

  it('returns true when width < 768', () => {
    Object.defineProperty(window, 'innerWidth', { value: 390, writable: true });
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(true);
  });

  it('updates when matchMedia change event fires', () => {
    Object.defineProperty(window, 'innerWidth', { value: 1024, writable: true });
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);

    act(() => {
      Object.defineProperty(window, 'innerWidth', { value: 390, writable: true });
      listeners.forEach((cb) => cb());
    });
    expect(result.current).toBe(true);
  });
});

describe('useBreakpoint', () => {
  it('returns mobile when width < 768', () => {
    Object.defineProperty(window, 'innerWidth', { value: 390, writable: true });
    const { result } = renderHook(() => useBreakpoint());
    expect(result.current).toBe('mobile');
  });

  it('returns tablet when width >= 768 and < 1024', () => {
    Object.defineProperty(window, 'innerWidth', { value: 800, writable: true });
    const { result } = renderHook(() => useBreakpoint());
    expect(result.current).toBe('tablet');
  });

  it('returns desktop when width >= 1024', () => {
    Object.defineProperty(window, 'innerWidth', { value: 1200, writable: true });
    const { result } = renderHook(() => useBreakpoint());
    expect(result.current).toBe('desktop');
  });

  it('updates on window resize', () => {
    Object.defineProperty(window, 'innerWidth', { value: 1200, writable: true });
    const { result } = renderHook(() => useBreakpoint());
    expect(result.current).toBe('desktop');

    act(() => {
      Object.defineProperty(window, 'innerWidth', { value: 390, writable: true });
      window.dispatchEvent(new Event('resize'));
    });
    expect(result.current).toBe('mobile');
  });
}
);
