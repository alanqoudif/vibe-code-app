import * as Notifications from 'expo-notifications';
import { Platform, Alert } from 'react-native';
import { Class, Task } from '../types';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    // Show notification even when app is in foreground
    return {
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    };
  },
});

export class NotificationService {
  static async requestPermissions(): Promise<boolean> {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Notification permission denied');
        return false;
      }

      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      }

      return true;
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return false;
    }
  }

  static async scheduleClassReminder(classData: Class, customReminderMinutes?: number): Promise<string | null> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        console.log('❌ Notification permission not granted');
        return null;
      }

      // Use custom reminder time or default to 15 minutes
      const reminderMinutes = customReminderMinutes || this.parseReminderTime(classData.reminders?.[0]) || 15;
      
      // Calculate reminder time for each day
      const notificationIds: string[] = [];
      
      if (classData.days && classData.days.length > 0) {
        for (const day of classData.days) {
          const reminderTime = this.calculateReminderTime(classData.time, day, reminderMinutes);
          
          if (reminderTime && reminderTime > new Date()) {
            const notificationId = await Notifications.scheduleNotificationAsync({
              content: {
                title: '🔔 تذكير الحصة',
                body: `${classData.name} تبدأ خلال ${reminderMinutes} دقيقة في ${classData.location || 'قاعة دراسية'}`,
                data: {
                  type: 'class_reminder',
                  classId: classData.id,
                  className: classData.name,
                  classTime: classData.time,
                  classLocation: classData.location,
                  reminderMinutes: reminderMinutes,
                },
                sound: 'default',
                priority: Notifications.AndroidNotificationPriority.HIGH,
              },
              trigger: { date: reminderTime },
            });

            notificationIds.push(notificationId);
            console.log(`✅ Scheduled reminder for ${classData.name} on ${day} at ${reminderTime.toLocaleString()}`);
          }
        }
      } else {
        // Single day reminder
        const reminderTime = this.calculateReminderTime(classData.time, classData.days?.[0] || 'monday', reminderMinutes);
        
        if (reminderTime && reminderTime > new Date()) {
          const notificationId = await Notifications.scheduleNotificationAsync({
            content: {
              title: '🔔 تذكير الحصة',
              body: `${classData.name} تبدأ خلال ${reminderMinutes} دقيقة في ${classData.location || 'قاعة دراسية'}`,
              data: {
                type: 'class_reminder',
                classId: classData.id,
                className: classData.name,
                classTime: classData.time,
                classLocation: classData.location,
                reminderMinutes: reminderMinutes,
              },
              sound: 'default',
              priority: Notifications.AndroidNotificationPriority.HIGH,
            },
            trigger: { date: reminderTime },
          });

          notificationIds.push(notificationId);
          console.log(`✅ Scheduled reminder for ${classData.name} at ${reminderTime.toLocaleString()}`);
        }
      }

      return notificationIds.length > 0 ? notificationIds[0] : null;
    } catch (error) {
      console.error('❌ Error scheduling class reminder:', error);
      return null;
    }
  }

  private static calculateReminderTime(classTime: string, day: string, reminderMinutes: number): Date | null {
    try {
      const [hours, minutes] = classTime.split(':').map(Number);
      
      // Get next occurrence of the day
      const today = new Date();
      const dayMap = {
        'monday': 1, 'tuesday': 2, 'wednesday': 3, 'thursday': 4,
        'friday': 5, 'saturday': 6, 'sunday': 0
      };
      
      const targetDay = dayMap[day.toLowerCase() as keyof typeof dayMap];
      if (targetDay === undefined) return null;
      
      const daysUntilTarget = (targetDay - today.getDay() + 7) % 7;
      const targetDate = new Date(today);
      
      if (daysUntilTarget === 0) {
        // Same day - check if class time hasn't passed
        const classDateTime = new Date(today);
        classDateTime.setHours(hours, minutes, 0, 0);
        
        if (classDateTime <= today) {
          // Class time has passed today, schedule for next week
          targetDate.setDate(today.getDate() + 7);
        }
      } else {
        targetDate.setDate(today.getDate() + daysUntilTarget);
      }
      
      // Set the class time
      targetDate.setHours(hours, minutes, 0, 0);
      
      // Calculate reminder time
      const reminderTime = new Date(targetDate.getTime() - reminderMinutes * 60 * 1000);
      
      return reminderTime;
    } catch (error) {
      console.error('Error calculating reminder time:', error);
      return null;
    }
  }

  static parseReminderTime(reminder: string): number | null {
    if (!reminder) return null;
    
    const reminderMap: { [key: string]: number } = {
      '5 دقائق': 5,
      '10 دقائق': 10,
      '15 دقيقة': 15,
      '30 دقيقة': 30,
      'ساعة واحدة': 60,
      'ساعتين': 120,
      '5 minutes': 5,
      '10 minutes': 10,
      '15 minutes': 15,
      '30 minutes': 30,
      '1 hour': 60,
      '2 hours': 120,
    };
    
    // Try exact match first
    if (reminderMap[reminder]) {
      return reminderMap[reminder];
    }
    
    // Try to extract number from string like "15 minutes before" or "15 دقيقة قبل"
    const numberMatch = reminder.match(/(\d+)/);
    if (numberMatch) {
      const minutes = parseInt(numberMatch[1]);
      if (reminder.includes('ساعة') || reminder.includes('hour')) {
        return minutes * 60;
      }
      return minutes;
    }
    
    return null;
  }

  static async scheduleTaskDeadlineReminder(task: Task): Promise<string | null> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) return null;

      // Schedule reminder 1 day before deadline
      const reminderTime = new Date(task.dueDate.getTime() - 24 * 60 * 60 * 1000);

      // Don't schedule if the reminder time has already passed
      if (reminderTime <= new Date()) {
        return null;
      }

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: 'تذكير موعد المهمة',
          body: `${task.title} مستحقة غداً`,
          data: {
            type: 'task_deadline',
            taskId: task.id,
          },
        },
          trigger: { date: reminderTime },
      });

      return notificationId;
    } catch (error) {
      console.error('Error scheduling task deadline reminder:', error);
      return null;
    }
  }

  static async scheduleStudyTip(): Promise<string | null> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) return null;

      // Schedule for tomorrow at 9 AM
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(9, 0, 0, 0);

      const studyTips = [
        "خذ استراحة لمدة 5 دقائق كل 25 دقيقة للحفاظ على التركيز!",
        "راجع ملاحظاتك خلال 24 ساعة لتحسين الاحتفاظ.",
        "أنشئ جدول دراسة والتزم به للحصول على نتائج أفضل.",
        "ابحث عن مكان هادئ ومضاء جيداً للدراسة بفعالية.",
        "استخدم تقنيات الاسترجاع النشط لاختبار معرفتك.",
        "اشرب الماء بانتظام واعتن بصحتك الجسدية.",
        "ضع أهداف محددة وقابلة للتحقيق لكل جلسة دراسة.",
        "لا تنس مكافأة نفسك عند إكمال المهام!",
      ];

      const randomTip = studyTips[Math.floor(Math.random() * studyTips.length)];

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: 'نصيحة دراسة يومية',
          body: randomTip,
          data: {
            type: 'study_tip',
          },
        },
        trigger: { date: tomorrow },
      });

      return notificationId;
    } catch (error) {
      console.error('Error scheduling study tip:', error);
      return null;
    }
  }

  static async scheduleQuickActionReminder(): Promise<string | null> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) return null;

      // Schedule for 8 AM tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(8, 0, 0, 0);

      const quickActions = [
        "تحقق من تقويمك لحصص ومهام اليوم!",
        "لا تنس تسجيل حضورك لحصص اليوم.",
        "راجع واجباتك المنزلية وخطط لوقت دراستك.",
        "خذ لحظة لتنظيم مواد دراستك لهذا اليوم.",
      ];

      const randomAction = quickActions[Math.floor(Math.random() * quickActions.length)];

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: 'تذكير إجراء سريع',
          body: randomAction,
          data: {
            type: 'quick_action',
          },
        },
        trigger: { date: tomorrow },
      });

      return notificationId;
    } catch (error) {
      console.error('Error scheduling quick action reminder:', error);
      return null;
    }
  }

  static async cancelNotification(notificationId: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    } catch (error) {
      console.error('Error canceling notification:', error);
    }
  }

  static async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error canceling all notifications:', error);
    }
  }

  static async getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
    try {
      return await Notifications.getAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error getting scheduled notifications:', error);
      return [];
    }
  }

  static async scheduleAllClassReminders(classes: Class[]): Promise<void> {
    try {
      console.log(`📅 Scheduling reminders for ${classes.length} classes`);
      
      // Request permissions first
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        console.log('❌ Notification permission not granted, skipping scheduling');
        return;
      }
      
      // Cancel existing notifications first
      await this.cancelAllNotifications();
      
      let scheduledCount = 0;
      
      for (const classData of classes) {
        const notificationId = await this.scheduleClassReminder(classData);
        if (notificationId) {
          scheduledCount++;
        }
      }
      
      console.log(`✅ Successfully scheduled ${scheduledCount} class reminders`);
    } catch (error) {
      console.error('❌ Error scheduling all class reminders:', error);
    }
  }

  // Schedule multiple reminders for a single class (e.g., 5 min, 15 min, 30 min before)
  static async scheduleMultipleClassReminders(classData: Class, reminderOptions: number[] = [5, 15, 30]): Promise<string[]> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        console.log('❌ Notification permission not granted');
        return [];
      }

      const notificationIds: string[] = [];
      
      for (const reminderMinutes of reminderOptions) {
        const notificationId = await this.scheduleClassReminder(classData, reminderMinutes);
        if (notificationId) {
          notificationIds.push(notificationId);
        }
      }
      
      console.log(`✅ Scheduled ${notificationIds.length} reminders for ${classData.name}`);
      return notificationIds;
    } catch (error) {
      console.error('❌ Error scheduling multiple class reminders:', error);
      return [];
    }
  }

  // Auto-schedule notifications when classes are added/updated
  static async autoScheduleClassReminders(classes: Class[]): Promise<void> {
    try {
      console.log('🔄 Auto-scheduling class reminders...');
      
      // Request permissions silently
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        console.log('❌ Notification permission not granted, skipping auto-scheduling');
        return;
      }
      
      // Schedule reminders for all classes
      await this.scheduleAllClassReminders(classes);
      
      console.log('✅ Auto-scheduling completed successfully');
    } catch (error) {
      console.error('❌ Error in auto-scheduling class reminders:', error);
    }
  }

  static async scheduleImmediateTestReminder(): Promise<string | null> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) return null;

      // Schedule a test notification for 5 seconds from now
      const testTime = new Date(Date.now() + 5000); // 5 seconds from now

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: '🔔 اختبار الإشعارات',
          body: 'تم تفعيل الإشعارات بنجاح! ستتلقى تذكيرات الحصص تلقائياً.',
          data: {
            type: 'test_notification',
          },
          sound: 'default',
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: { date: testTime },
      });

      console.log('✅ Test notification scheduled for 5 seconds from now');
      return notificationId;
    } catch (error) {
      console.error('❌ Error scheduling test notification:', error);
      return null;
    }
  }

  // Send immediate notification (for testing or urgent alerts)
  static async sendImmediateNotification(title: string, body: string, data?: any): Promise<string | null> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) return null;

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: data || { type: 'immediate' },
          sound: 'default',
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: null, // Send immediately
      });

      console.log('✅ Immediate notification sent:', title);
      return notificationId;
    } catch (error) {
      console.error('❌ Error sending immediate notification:', error);
      return null;
    }
  }

  static async handleNotificationResponse(response: Notifications.NotificationResponse): Promise<void> {
    const { data } = response.notification.request.content;
    
    console.log('📱 Notification tapped:', data?.type, data);
    
    switch (data?.type) {
      case 'class_reminder':
        console.log('Class reminder tapped:', data.classId);
        // Show alert with class details
        Alert.alert(
          'تذكير الحصة',
          `${data.className} تبدأ في ${data.classTime} في ${data.classLocation || 'قاعة دراسية'}`,
          [
            { text: 'موافق', style: 'default' }
          ]
        );
        // Navigate to calendar or class details
        break;
      case 'task_deadline':
        console.log('Task deadline reminder tapped:', data.taskId);
        Alert.alert(
          'تذكير المهمة',
          'لديك مهمة مستحقة قريباً',
          [
            { text: 'موافق', style: 'default' }
          ]
        );
        // Navigate to tasks screen
        break;
      case 'study_tip':
        console.log('Study tip tapped');
        Alert.alert(
          'نصيحة دراسة',
          response.notification.request.content.body,
          [
            { text: 'موافق', style: 'default' }
          ]
        );
        // Navigate to study bot screen
        break;
      case 'quick_action':
        console.log('Quick action reminder tapped');
        Alert.alert(
          'تذكير سريع',
          response.notification.request.content.body,
          [
            { text: 'موافق', style: 'default' }
          ]
        );
        // Navigate to calendar screen
        break;
      case 'test_notification':
        console.log('Test notification tapped');
        Alert.alert(
          'اختبار الإشعارات',
          'تم تفعيل الإشعارات بنجاح!',
          [
            { text: 'ممتاز', style: 'default' }
          ]
        );
        break;
      case 'immediate':
        console.log('Immediate notification tapped');
        Alert.alert(
          'إشعار فوري',
          response.notification.request.content.body,
          [
            { text: 'موافق', style: 'default' }
          ]
        );
        break;
      default:
        console.log('Unknown notification type:', data?.type);
        Alert.alert(
          'إشعار',
          response.notification.request.content.body,
          [
            { text: 'موافق', style: 'default' }
          ]
        );
    }
  }
}
