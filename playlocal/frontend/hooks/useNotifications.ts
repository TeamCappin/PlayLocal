import { useState, useEffect, useCallback } from 'react';
import { notificationsApi, NotificationDto } from '@/lib/api';

import { useAuth } from '@/context/AuthContext';

type NotificationPayload = {
    message?: string;
    gameId?: string;
    gameTitle?: string;
    [key: string]: unknown;
};

export interface UINotification extends NotificationDto {
    title: string;
    message: string;
    createdAt: string;
    read: boolean;
    link?: string;
}

function normalizeType(type: string): string {
    return (type || 'NOTIFICATION').toUpperCase();
}

function safeParsePayload(payload: string): NotificationPayload {
    if (!payload) return {};
    try {
        const parsed = JSON.parse(payload) as NotificationPayload;
        return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
        return {};
    }
}

function humanizeType(type: string): string {
    return type
        .toLowerCase()
        .split('_')
        .map(part => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
}

function buildNotificationTitle(type: string): string {
    switch (type) {
        case 'GAME_CANCELLED':
            return 'Game cancelled';
        case 'ATTENDANCE_PROMPT':
            return 'Attendance reminder';
        default:
            return humanizeType(type);
    }
}

function toUINotification(notification: NotificationDto): UINotification {
    const payload = safeParsePayload(notification.payload);
    const type = normalizeType(notification.type);
    const createdAt = notification.sentAt || notification.scheduledFor;
    const title = buildNotificationTitle(type);
    const message = payload.message
        || (payload.gameTitle ? `Update for ${payload.gameTitle}` : title);
    const link = payload.gameId ? `/games/${payload.gameId}` : undefined;

    return {
        ...notification,
        type,
        title,
        message,
        createdAt,
        read: notification.status === 'READ',
        link,
    };
}

export function useNotifications() {
    const { isAuthenticated } = useAuth();
    const [notifications, setNotifications] = useState<UINotification[]>([]);
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
            setNotifications(notifs.map(toUINotification));
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

    const markAsRead = async (notificationId: string) => {
        try {
            await notificationsApi.markAsRead(notificationId);
            setNotifications(prev =>
                prev.map(n =>
                    n.notificationId === notificationId
                        ? { ...n, status: 'READ', read: true }
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
            setNotifications(prev => prev.map(n => ({ ...n, status: 'READ', read: true })));
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
