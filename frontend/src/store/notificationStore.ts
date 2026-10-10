import { create } from 'zustand';

export interface ToastNotification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message: string;
  duration?: number;
}

interface NotificationState {
  notifications: ToastNotification[];
  addNotification: (notification: Omit<ToastNotification, 'id'>) => void;
  removeNotification: (id: string) => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  addNotification: (notification) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newNotification = { ...notification, id };
    set((state) => ({
      notifications: [...state.notifications, newNotification],
    }));

    const duration = notification.duration ?? 4000;
    setTimeout(() => {
      set((state) => ({
        notifications: state.notifications.filter((n) => n.id !== id),
      }));
    }, duration);
  },
  removeNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    })),
}));

export const toast = {
  success: (message: string, title?: string) =>
    useNotificationStore.getState().addNotification({ type: 'success', message, title }),
  error: (message: string, title?: string) =>
    useNotificationStore.getState().addNotification({ type: 'error', message, title }),
  warning: (message: string, title?: string) =>
    useNotificationStore.getState().addNotification({ type: 'warning', message, title }),
  info: (message: string, title?: string) =>
    useNotificationStore.getState().addNotification({ type: 'info', message, title }),
};
