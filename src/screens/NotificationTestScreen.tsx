import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import Card from '../components/Card';
import Button from '../components/Button';
import { NotificationService } from '../services/NotificationService';
import { DatabaseService } from '../services/DatabaseService';
import { useAuth } from '../contexts/AuthContext';

const NotificationTestScreen: React.FC = () => {
  const { theme } = useTheme();
  const { isAuthenticated, user } = useAuth();
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [scheduledNotifications, setScheduledNotifications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    checkNotificationStatus();
    loadScheduledNotifications();
  }, []);

  const checkNotificationStatus = async () => {
    try {
      const hasPermission = await NotificationService.requestPermissions();
      setNotificationsEnabled(hasPermission);
    } catch (error) {
      console.error('Error checking notification status:', error);
    }
  };

  const loadScheduledNotifications = async () => {
    try {
      const notifications = await NotificationService.getScheduledNotifications();
      setScheduledNotifications(notifications);
    } catch (error) {
      console.error('Error loading scheduled notifications:', error);
    }
  };

  const handleTestNotification = async () => {
    setIsLoading(true);
    try {
      const notificationId = await NotificationService.scheduleImmediateTestReminder();
      if (notificationId) {
        Alert.alert('نجح', 'تم جدولة إشعار اختبار خلال 5 ثوانٍ');
        await loadScheduledNotifications();
      } else {
        Alert.alert('خطأ', 'فشل في جدولة الإشعار');
      }
    } catch (error) {
      Alert.alert('خطأ', 'حدث خطأ أثناء اختبار الإشعار');
      console.error('Error testing notification:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendImmediateNotification = async () => {
    setIsLoading(true);
    try {
      const notificationId = await NotificationService.sendImmediateNotification(
        'إشعار فوري',
        'هذا إشعار فوري للاختبار'
      );
      if (notificationId) {
        Alert.alert('نجح', 'تم إرسال الإشعار الفوري');
      } else {
        Alert.alert('خطأ', 'فشل في إرسال الإشعار');
      }
    } catch (error) {
      Alert.alert('خطأ', 'حدث خطأ أثناء إرسال الإشعار');
      console.error('Error sending immediate notification:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleScheduleAllClassReminders = async () => {
    if (!isAuthenticated || !user) {
      Alert.alert('خطأ', 'يجب تسجيل الدخول أولاً');
      return;
    }

    setIsLoading(true);
    try {
      const classes = await DatabaseService.getEvents(user.id);
      if (classes.length === 0) {
        Alert.alert('تنبيه', 'لا توجد حصص مجدولة');
        return;
      }

      await NotificationService.scheduleAllClassReminders(classes);
      Alert.alert('نجح', `تم جدولة إشعارات لـ ${classes.length} حصة`);
      await loadScheduledNotifications();
    } catch (error) {
      Alert.alert('خطأ', 'حدث خطأ أثناء جدولة إشعارات الحصص');
      console.error('Error scheduling class reminders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelAllNotifications = async () => {
    Alert.alert(
      'إلغاء جميع الإشعارات',
      'هل أنت متأكد من إلغاء جميع الإشعارات المجدولة؟',
      [
        { text: 'لا', style: 'cancel' },
        {
          text: 'نعم',
          style: 'destructive',
          onPress: async () => {
            try {
              await NotificationService.cancelAllNotifications();
              Alert.alert('نجح', 'تم إلغاء جميع الإشعارات');
              await loadScheduledNotifications();
            } catch (error) {
              Alert.alert('خطأ', 'حدث خطأ أثناء إلغاء الإشعارات');
              console.error('Error canceling notifications:', error);
            }
          }
        }
      ]
    );
  };

  const handleRequestPermissions = async () => {
    try {
      const hasPermission = await NotificationService.requestPermissions();
      setNotificationsEnabled(hasPermission);
      if (hasPermission) {
        Alert.alert('نجح', 'تم تفعيل الإشعارات بنجاح');
      } else {
        Alert.alert('خطأ', 'تم رفض الإذن للإشعارات');
      }
    } catch (error) {
      Alert.alert('خطأ', 'حدث خطأ أثناء طلب إذن الإشعارات');
      console.error('Error requesting permissions:', error);
    }
  };

  const renderNotificationStatus = () => (
    <Card style={styles.card}>
      <View style={styles.statusRow}>
        <Text style={[styles.statusLabel, { color: theme.colors.text }]}>
          حالة الإشعارات:
        </Text>
        <Switch
          value={notificationsEnabled}
          onValueChange={setNotificationsEnabled}
          trackColor={{ false: '#767577', true: theme.colors.primary }}
          thumbColor={notificationsEnabled ? '#ffffff' : '#f4f3f4'}
        />
      </View>
      <Text style={[styles.statusText, { color: theme.colors.textSecondary }]}>
        {notificationsEnabled ? 'مفعلة' : 'معطلة'}
      </Text>
    </Card>
  );

  const renderScheduledNotifications = () => (
    <Card style={styles.card}>
      <Text style={[styles.cardTitle, { color: theme.colors.text }]}>
        الإشعارات المجدولة ({scheduledNotifications.length})
      </Text>
      {scheduledNotifications.length === 0 ? (
        <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
          لا توجد إشعارات مجدولة
        </Text>
      ) : (
        <ScrollView style={styles.notificationsList} showsVerticalScrollIndicator={false}>
          {scheduledNotifications.map((notification, index) => (
            <View key={index} style={styles.notificationItem}>
              <Text style={[styles.notificationTitle, { color: theme.colors.text }]}>
                {notification.content.title}
              </Text>
              <Text style={[styles.notificationBody, { color: theme.colors.textSecondary }]}>
                {notification.content.body}
              </Text>
              <Text style={[styles.notificationTime, { color: theme.colors.textSecondary }]}>
                {notification.trigger?.date ? 
                  new Date(notification.trigger.date).toLocaleString('ar-SA') : 
                  'فوري'
                }
              </Text>
            </View>
          ))}
        </ScrollView>
      )}
    </Card>
  );

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          اختبار الإشعارات
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          اختبر نظام الإشعارات المحلية
        </Text>
      </View>

      {renderNotificationStatus()}

      <Card style={styles.card}>
        <Text style={[styles.cardTitle, { color: theme.colors.text }]}>
          اختبارات الإشعارات
        </Text>
        
        <Button
          title="طلب إذن الإشعارات"
          onPress={handleRequestPermissions}
          variant="outline"
          style={styles.button}
        />

        <Button
          title="إشعار اختبار (5 ثوانٍ)"
          onPress={handleTestNotification}
          disabled={isLoading}
          style={styles.button}
        />

        <Button
          title="إشعار فوري"
          onPress={handleSendImmediateNotification}
          disabled={isLoading}
          style={styles.button}
        />

        {isAuthenticated && (
          <Button
            title="جدولة إشعارات جميع الحصص"
            onPress={handleScheduleAllClassReminders}
            disabled={isLoading}
            style={styles.button}
          />
        )}

        <Button
          title="إلغاء جميع الإشعارات"
          onPress={handleCancelAllNotifications}
          variant="outline"
          disabled={isLoading}
          style={styles.button}
        />
      </Card>

      {renderScheduledNotifications()}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
  },
  card: {
    margin: 16,
    marginTop: 0,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  statusText: {
    fontSize: 14,
  },
  button: {
    marginBottom: 12,
  },
  notificationsList: {
    maxHeight: 300,
  },
  notificationItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  notificationBody: {
    fontSize: 14,
    marginBottom: 4,
  },
  notificationTime: {
    fontSize: 12,
  },
  emptyText: {
    textAlign: 'center',
    fontStyle: 'italic',
    padding: 20,
  },
});

export default NotificationTestScreen;
