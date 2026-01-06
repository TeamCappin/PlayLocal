'use client';

import { CreateGame } from '@/components/CreateGame';

import { ProtectedRoute } from '@/components/ProtectedRoute';

export default function Page() {
    return (
        <ProtectedRoute>
            <CreateGame />
        </ProtectedRoute>
    );
}
