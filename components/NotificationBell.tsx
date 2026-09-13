'use client';

import { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';

type NotificationItem = {
  _id: string;
  type: string;
  title: string;
  message: string;
  donationId?: string;
  read: boolean;
  createdAt: string;
};

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);

  const loadNotifications = async () => {
    try {
      const response = await fetch('/api/notifications', {
        cache: 'no-store',
      });

      if (!response.ok) {
        return;
      }

      const data = await response.json();

      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (error) {
      console.error('Load notifications error:', error);
    }
  };

  useEffect(() => {
    loadNotifications();

    const interval = setInterval(() => {
      loadNotifications();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const markAsRead = async (id: string) => {
    try {
      const response = await fetch(`/api/notifications/${id}`, {
        method: 'PATCH',
      });

      if (!response.ok) {
        return;
      }

      setNotifications((current) =>
        current.map((notification) =>
          notification._id === id
            ? { ...notification, read: true }
            : notification
        )
      );

      setUnreadCount((current) => Math.max(0, current - 1));
    } catch (error) {
      console.error('Mark notification read error:', error);
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="relative rounded-full border border-[var(--border)] bg-[var(--surface)] p-2.5 text-[var(--foreground-muted)] transition-all duration-200 hover:border-[var(--border-strong)] hover:bg-[var(--surface-2)] hover:text-[var(--foreground)]"
        aria-label="Notifications"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--color-danger)] px-1 text-xs font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="animate-scale-in absolute right-0 z-50 mt-2 w-80 origin-top-right overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl shadow-black/40 backdrop-blur-xl">
          <div className="border-b border-[var(--border)] px-4 py-3">
            <h2 className="font-semibold text-[var(--foreground)]">
              Notifications
            </h2>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="p-5 text-center text-sm text-[var(--foreground-subtle)]">
                No notifications yet.
              </p>
            ) : (
              notifications.map((notification) => (
                <button
                  key={notification._id}
                  type="button"
                  onClick={() => {
                    if (!notification.read) {
                      markAsRead(notification._id);
                    }
                  }}
                  className={`block w-full border-b border-[var(--border)] px-4 py-3 text-left transition-colors hover:bg-[var(--surface-2)] ${
                    notification.read ? '' : 'bg-[var(--color-primary-light)]'
                  }`}
                >
                  <div className="flex gap-3">
                    <span
                      className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                        notification.read ? 'bg-[var(--foreground-subtle)]' : 'bg-[var(--color-primary)]'
                      }`}
                    />

                    <div className="min-w-0">
                      <p className="font-medium text-[var(--foreground)]">
                        {notification.title}
                      </p>

                      <p className="mt-1 text-sm text-[var(--foreground-muted)]">
                        {notification.message}
                      </p>

                      <p className="mt-1 text-xs text-[var(--foreground-subtle)]">
                        {new Date(notification.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}