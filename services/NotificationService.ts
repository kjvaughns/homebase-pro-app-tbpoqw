
import { Alert, Platform } from 'react-native';

export type NotificationType = 'success' | 'error' | 'info' | 'warning';

export interface ToastNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  duration?: number;
}

class NotificationService {
  private listeners: ((notification: ToastNotification) => void)[] = [];

  subscribe(listener: (notification: ToastNotification) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify(notification: ToastNotification) {
    this.listeners.forEach(listener => listener(notification));
  }

  success(title: string, message: string, duration = 3000) {
    const notification: ToastNotification = {
      id: Date.now().toString(),
      type: 'success',
      title,
      message,
      duration,
    };
    this.notify(notification);
  }

  error(title: string, message: string, duration = 4000) {
    const notification: ToastNotification = {
      id: Date.now().toString(),
      type: 'error',
      title,
      message,
      duration,
    };
    this.notify(notification);
    
    // Also show native alert for errors
    if (Platform.OS !== 'web') {
      Alert.alert(title, message);
    }
  }

  info(title: string, message: string, duration = 3000) {
    const notification: ToastNotification = {
      id: Date.now().toString(),
      type: 'info',
      title,
      message,
      duration,
    };
    this.notify(notification);
  }

  warning(title: string, message: string, duration = 3500) {
    const notification: ToastNotification = {
      id: Date.now().toString(),
      type: 'warning',
      title,
      message,
      duration,
    };
    this.notify(notification);
  }
}

export const notificationService = new NotificationService();
