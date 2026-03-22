// Re-export all hooks for convenience
export { useAuth, AuthProvider } from '@/context/AuthContext';
export {
  useGames,
  useGame,
  useCreateGame,
  usePastGames,
  usePastGamesByUserNeedingAttendanceUpdate,
} from './useGames';
export { useNotifications } from './useNotifications';
export { useReportUser } from './useReportUser';
export { useAttendance } from './useAttendance';
export { useProfile, useCurrentUser } from './useProfile';

export * from './useAttendance';
export * from './useGames';
export * from './useNotifications';
export * from './useProfile';
export * from './useReportUser';
export * from './useScoreHistory';
export * from './useOrganizerQuality';
export * from './useStats';
