'use client';

import { CalendarView } from '@/components/CalendarView';

import { ProtectedRoute } from '@/components/ProtectedRoute';

export default function Page() {
  return (
    <ProtectedRoute>
      <CalendarView />
    </ProtectedRoute>
  );
}
