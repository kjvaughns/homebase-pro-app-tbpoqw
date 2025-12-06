
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, commonStyles } from '@/styles/commonStyles';
import { GlassView } from '@/components/GlassView';
import { IconSymbol } from '@/components/IconSymbol';
import { Notification } from '@/types';

export default function NotificationsScreen() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    // Load from Supabase
    const mockNotifications: Notification[] = [
      {
        id: '1',
        user_id: '1',
        type: 'booking',
        title: 'New Booking Request',
        body: 'John Smith requested a booking for General Repairs',
        data: {},
        read: false,
        created_at: new Date().toISOString(),
      },
      {
        id: '2',
        user_id: '1',
        type: 'payment',
        title: 'Payment Received',
        body: 'You received $150 from Sarah Johnson',
        data: {},
        read: false,
        created_at: new Date(Date.now() - 3600000).toISOString(),
      },
      {
        id: '3',
        user_id: '1',
        type: 'reminder',
        title: 'Upcoming Job',
        body: 'You have a job scheduled tomorrow at 9:00 AM',
        data: {},
        read: true,
        created_at: new Date(Date.now() - 86400000).toISOString(),
      },
    ];
    setNotifications(mockNotifications);
  };

  const markAsRead = async (notificationId: string) => {
    setNotifications(notifications.map(n => 
      n.id === notificationId ? { ...n, read: true } : n
    ));
  };

  const markAllAsRead = async () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'booking':
        return { ios: 'calendar.badge.plus', android: 'event' };
      case 'payment':
        return { ios: 'dollarsign.circle.fill', android: 'attach-money' };
      case 'reminder':
        return { ios: 'bell.fill', android: 'notifications' };
      case 'message':
        return { ios: 'message.fill', android: 'message' };
      default:
        return { ios: 'bell.fill', android: 'notifications' };
    }
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <View style={commonStyles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <IconSymbol ios_icon_name="chevron.left" android_material_icon_name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.headerTitle}>
            <Text style={styles.title}>Notifications</Text>
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadCount}</Text>
              </View>
            )}
          </View>
          <TouchableOpacity onPress={markAllAsRead}>
            <Text style={styles.markAllRead}>Mark all read</Text>
          </TouchableOpacity>
        </View>

        {notifications.length > 0 ? (
          <View style={styles.notificationList}>
            {notifications.map((notification, index) => {
              const icon = getNotificationIcon(notification.type);
              return (
                <TouchableOpacity 
                  key={index}
                  onPress={() => markAsRead(notification.id)}
                >
                  <GlassView style={[
                    styles.notificationCard,
                    !notification.read && styles.notificationCardUnread
                  ]}>
                    <View style={styles.notificationIcon}>
                      <IconSymbol 
                        ios_icon_name={icon.ios} 
                        android_material_icon_name={icon.android} 
                        size={24} 
                        color={colors.primary} 
                      />
                    </View>
                    <View style={styles.notificationContent}>
                      <View style={styles.notificationHeader}>
                        <Text style={styles.notificationTitle}>{notification.title}</Text>
                        {!notification.read && <View style={styles.unreadDot} />}
                      </View>
                      <Text style={styles.notificationBody}>{notification.body}</Text>
                      <Text style={styles.notificationTime}>{getTimeAgo(notification.created_at)}</Text>
                    </View>
                  </GlassView>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          <GlassView style={styles.emptyState}>
            <IconSymbol ios_icon_name="bell.slash" android_material_icon_name="notifications-off" size={64} color={colors.textSecondary} />
            <Text style={styles.emptyText}>No notifications yet</Text>
          </GlassView>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.glass,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
  },
  badge: {
    backgroundColor: colors.error,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
  },
  markAllRead: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  notificationList: {
    gap: 12,
  },
  notificationCard: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  notificationCardUnread: {
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  notificationIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.glass,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  notificationBody: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 8,
  },
  notificationTime: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  emptyState: {
    padding: 48,
    alignItems: 'center',
    marginTop: 40,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 16,
  },
});
