'use client';

import { MatchRecap } from '@/components/MatchRecap';

import { ProtectedRoute } from '@/components/ProtectedRoute';

export default function Page() {
    return (
        <ProtectedRoute>
            <MatchRecap />
        </ProtectedRoute>
    );
}
