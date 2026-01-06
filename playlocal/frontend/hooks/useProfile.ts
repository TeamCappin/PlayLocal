import { useState, useEffect } from 'react';
import api from '@/lib/api';

export interface UserProfileData {
    userId: string;
    email: string;
    displayName: string;
    avatarUrl?: string;
    reliabilityScore: number;
    gamesCount: number;
}

export function useProfile(usernameOrId?: string) {
    const [profile, setProfile] = useState<UserProfileData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchProfile() {
            if (!usernameOrId) {
                // Get current user's profile
                try {
                    const data = await api.auth.getCurrentUser();
                    setProfile(data);
                } catch (err: any) {
                    setError(err.message || 'Failed to load profile');
                } finally {
                    setIsLoading(false);
                }
            } else {
                // For now, the backend doesn't have a public profile endpoint
                // Just show demo data
                setIsLoading(false);
                setProfile(null);
            }
        }

        fetchProfile();
    }, [usernameOrId]);

    return { profile, isLoading, error };
}

export function useCurrentUser() {
    const [user, setUser] = useState<UserProfileData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchUser() {
            try {
                const data = await api.auth.getCurrentUser();
                setUser(data);
            } catch (err: any) {
                // Not logged in or token expired
                setUser(null);
            } finally {
                setIsLoading(false);
            }
        }

        fetchUser();
    }, []);

    return { user, isLoading, error };
}
