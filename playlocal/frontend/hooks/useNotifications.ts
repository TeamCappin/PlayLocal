import { useState, useEffect, useCallback } from 'react';
import { notificationsApi, NotificationDto } from '@/lib/api';

import { useAuth } from '@/context/AuthContext';

export function useNotifications() {
    const { isAuthenticated } = useAuth();
    const [notifications, setNotifications] = useState<NotificationDto[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchNotifications = useCallback(async () => {
        if (!isAuthenticated) return;

        setIsLoading(true);
        setError(null);
        try {
            const [notifs, countData] = await Promise.all([
                notificationsApi.getAll(),
                notificationsApi.getUnreadCount(),
            ]);
            // Enrich with display fields from payload (title, message, link) for frontend
            const enriched = (notifs || []).map((n: { payload?: string; type: string; scheduledFor?: string; sentAt?: string; status: string }) => {
                let title = n.type?.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase()) || '';
                let message = '';
                let link: string | undefined;
                if (n.payload) {
                    try {
                        const p = JSON.parse(n.payload);
                        if (p.title) title = p.title;
                        if (p.message) message = p.message;
                        if (p.link) link = p.link;
                        else if (p.gameId) link = `/games/${p.gameId}`;
                    } catch { /* ignore */ }
                }
                return {
                    ...n,
                    title,
                    message,
                    link,
                    createdAt: n.sentAt || n.scheduledFor,
                    read: n.status === 'READ',
                };
            });
            setNotifications(enriched);
            setUnreadCount(countData.count);
        } catch (err) {
            setError('Failed to load notifications');
            console.error('Error fetching notifications:', err);
        } finally {
            setIsLoading(false);
        }
    }, [isAuthenticated]);

    useEffect(() => {
        if (isAuthenticated) {
            fetchNotifications();
        } else {
            setNotifications([]);
            setUnreadCount(0);
        }
    }, [isAuthenticated, fetchNotifications]);

    // US-4.3: Refresh notification count when game is edited or deleted (so bell icon updates)
    useEffect(() => {
        const handler = () => fetchNotifications();
        window.addEventListener("playlocal-refresh-notifications", handler);
        return () => window.removeEventListener("playlocal-refresh-notifications", handler);
    }, [fetchNotifications]);

    const markAsRead = async (notificationId: string) => {
        try {
            await notificationsApi.markAsRead(notificationId);
            setNotifications(prev =>
                prev.map(n =>
                    n.notificationId === notificationId
                        ? { ...n, status: 'READ' }
                        : n
                )
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (err) {
            console.error('Error marking notification as read:', err);
        }
    };

    const markAllAsRead = async () => {
        try {
            await notificationsApi.markAllAsRead();
            setNotifications(prev => prev.map(n => ({ ...n, status: 'READ' })));
            setUnreadCount(0);
        } catch (err) {
            console.error('Error marking all notifications as read:', err);
        }
    };

    return {
        notifications,
        unreadCount,
        isLoading,
        error,
        refetch: fetchNotifications,
        markAsRead,
        markAllAsRead,
    };
}
