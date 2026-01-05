'use client';

import { UserProfile } from '@/components/UserProfile';

import { ProtectedRoute } from '@/components/ProtectedRoute';

export default function Page() {
    return (
        <ProtectedRoute>
            <UserProfile />
        </ProtectedRoute>
    );
}
