'use client';

import { NotificationsPage } from '@/components/NotificationsPage';

import { ProtectedRoute } from '@/components/ProtectedRoute';

export default function Page() {
    return (
        <ProtectedRoute>
            <NotificationsPage />
        </ProtectedRoute>
    );
}
