import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  RefreshControl,
  Alert,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { Class, CalendarView } from '../types';
import Card from '../components/Card';
import Button from '../components/Button';
import { StorageService } from '../services/StorageService';
import { DatabaseService } from '../services/DatabaseService';
import { NotificationService } from '../services/NotificationService';
import { getArabicDayName, getArabicDayShort, formatArabicDate, formatArabicMonthYear } from '../utils/helpers';
import { isDayMatch, getCurrentWeekDates, getDayNameFromDate, getClassesForSpecificDate, createWeekDateMap, formatDateOnly, isSameDate } from '../utils/dayUtils';
import { RealtimeChannel } from '@supabase/supabase-js';

const { width } = Dimensions.get('window');

const CalendarScreen: React.FC = () => {
  const { theme } = useTheme();
  const { isAuthenticated, user } = useAuth();
  const navigation = useNavigation();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<CalendarView>('week');
  const [classes, setClasses] = useState<Class[]>([]);
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [refreshing, setRefreshing] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting' | 'polling'>('connecting');
  const realtimeChannelRef = useRef<RealtimeChannel | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load classes from database (not storage) for real-time sync
  const loadClasses = async (forceRefresh: boolean = false) => {
    try {
      if (isAuthenticated && user) {
        // Only log if it's a forced refresh or first load
        if (forceRefresh) {
          console.log('📚 Loading classes from database for real-time sync');
        }
        const dbClasses = await DatabaseService.getEvents(user.id, forceRefresh);
        setClasses(dbClasses);
        
        if (forceRefresh) {
        console.log(`✅ Loaded ${dbClasses.length} classes from database`);
        
        // Debug: Log first few classes to verify data
        if (dbClasses.length > 0) {
          console.log('🔍 Sample classes loaded:', dbClasses.slice(0, 3).map(cls => ({
            id: cls.id,
            name: cls.name,
            time: cls.time,
            days: cls.days,
            location: cls.location
          })));
          
          // Auto-schedule notifications for all classes
          console.log('🔔 Auto-scheduling notifications for all classes...');
          await NotificationService.autoScheduleClassReminders(dbClasses);
        }
        }
      } else {
        if (forceRefresh) {
          console.log('⚠️ User not authenticated, showing empty state');
        }
        setClasses([]);
      }
    } catch (error) {
      console.error('Error loading classes:', error);
      setClasses([]);
    }
  };

  // Handle real-time data changes
  const handleDataChange = (updatedClasses: Class[]) => {
    console.log('📡 Real-time update received, updating classes');
    setClasses(updatedClasses);
  };

  // Set up real-time subscription with fallback to polling
  const setupRealtimeSubscription = async () => {
    if (isAuthenticated && user && !realtimeChannelRef.current) {
      console.log('🔄 Setting up real-time subscription for calendar');
      setConnectionStatus('connecting');
      
      try {
        // Try real-time connection with retry mechanism
        realtimeChannelRef.current = await DatabaseService.setupRealtimeWithRetry(
          user.id, 
          (updatedClasses) => {
            console.log('📡 Real-time update received in CalendarScreen:', updatedClasses.length, 'classes');
            handleDataChange(updatedClasses);
            setConnectionStatus('connected');
          }
        );
        
        if (realtimeChannelRef.current) {
          console.log('✅ Real-time subscription established');
          setConnectionStatus('connected');
        } else {
          console.log('⚠️ Real-time failed, falling back to polling');
          setConnectionStatus('polling');
          // Start polling as fallback
          pollingIntervalRef.current = DatabaseService.startPolling(
            user.id,
            (updatedClasses) => {
              handleDataChange(updatedClasses);
            },
            60000 // Poll every 60 seconds to reduce load
          );
        }
        
      } catch (error) {
        console.error('❌ Error setting up real-time subscription:', error);
        setConnectionStatus('polling');
        // Start polling as fallback
        pollingIntervalRef.current = DatabaseService.startPolling(
          user.id,
          (updatedClasses) => {
            handleDataChange(updatedClasses);
          },
          60000 // Poll every 60 seconds to reduce load
        );
      }
    }
  };

  // Clean up real-time subscription and polling
  const cleanupRealtimeSubscription = () => {
    if (realtimeChannelRef.current) {
      console.log('🔌 Cleaning up real-time subscription');
      DatabaseService.unsubscribeFromChannel(realtimeChannelRef.current);
      realtimeChannelRef.current = null;
    }
    
    if (pollingIntervalRef.current) {
      console.log('🛑 Stopping polling');
      DatabaseService.stopPolling(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  };

  // Re-setup subscription when user changes
  const resetRealtimeSubscription = async () => {
    cleanupRealtimeSubscription();
    if (isAuthenticated && user) {
      await setupRealtimeSubscription();
    }
  };

  // Handle pull-to-refresh with manual sync
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      if (isAuthenticated && user) {
        console.log('🔄 Manual refresh triggered');
        
        // Try manual sync first
        const syncResult = await DatabaseService.manualSync(user.id);
        if (syncResult.success) {
          setClasses(syncResult.events);
          console.log(`✅ Manual sync completed: ${syncResult.events.length} classes loaded`);
          
          // Debug: Log synced classes
          if (syncResult.events.length > 0) {
            console.log('🔍 Synced classes sample:', syncResult.events.slice(0, 3).map(cls => ({
              id: cls.id,
              name: cls.name,
              time: cls.time,
              days: cls.days
            })));
          }
        } else {
          console.error('❌ Manual sync failed:', syncResult.error);
          // Fallback to regular refresh
          const refreshedClasses = await DatabaseService.forceRefreshEvents(user.id);
          setClasses(refreshedClasses);
          console.log(`✅ Fallback refresh completed: ${refreshedClasses.length} classes loaded`);
        }
        
        // Try to reconnect real-time if disconnected
        if (connectionStatus === 'disconnected') {
          console.log('🔄 Attempting to reconnect real-time subscription...');
          await setupRealtimeSubscription();
        }
      } else {
        await loadClasses();
      }
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Manual reconnect function
  const handleReconnect = async () => {
    if (isAuthenticated && user) {
      setConnectionStatus('connecting');
      cleanupRealtimeSubscription();
      await setupRealtimeSubscription();
    }
  };

  // Handle class deletion with confirmation
  const handleDeleteClass = (classToDelete: Class) => {
    Alert.alert(
      'حذف الحصة',
      `هل أنت متأكد من حذف الحصة "${classToDelete.name}"؟\n\nلا يمكن التراجع عن هذا الإجراء.`,
      [
        {
          text: 'إلغاء',
          style: 'cancel',
        },
        {
          text: 'حذف',
          style: 'destructive',
          onPress: async () => {
            try {
              if (isAuthenticated && user) {
                console.log('🗑️ Deleting class:', classToDelete.name);
                
                // Delete from database
                await DatabaseService.deleteEvent(classToDelete.id);
                
                // Update local state
                setClasses(prevClasses => 
                  prevClasses.filter(cls => cls.id !== classToDelete.id)
                );
                
                // Reschedule notifications for remaining classes
                const remainingClasses = classes.filter(cls => cls.id !== classToDelete.id);
                await NotificationService.autoScheduleClassReminders(remainingClasses);
                
                console.log('✅ Class deleted successfully:', classToDelete.name);
              }
            } catch (error) {
              console.error('❌ Error deleting class:', error);
              Alert.alert(
                'خطأ',
                'حدث خطأ أثناء حذف الحصة. يرجى المحاولة مرة أخرى.',
                [{ text: 'موافق' }]
              );
            }
          },
        },
      ]
    );
  };


  useEffect(() => {
    const initializeData = async () => {
      await loadClasses(true); // Force refresh on initial load
      await resetRealtimeSubscription();
    };
    
    initializeData();

    // Cleanup on unmount
    return () => {
      cleanupRealtimeSubscription();
    };
  }, [isAuthenticated, user]);

  // Reload classes when screen comes into focus (but not on every focus)
  useFocusEffect(
    React.useCallback(() => {
      const refreshData = async () => {
        // Only refresh if we don't have data or real-time is not connected
        if (classes.length === 0 || connectionStatus === 'disconnected') {
          await loadClasses(true);
        } else {
          await loadClasses(false); // Silent refresh
        }
        
        // Re-setup real-time subscription if needed
        if (isAuthenticated && user && !realtimeChannelRef.current) {
          await setupRealtimeSubscription();
        }
      };
      refreshData();
    }, [isAuthenticated, user, classes.length, connectionStatus])
  );

  // If user is not authenticated, don't show any data
  if (!isAuthenticated) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.centerContent}>
          <Ionicons name="lock-closed" size={64} color={theme.colors.textSecondary} />
          <Text style={[styles.lockMessage, { color: theme.colors.textSecondary }]}>
            learnz | ليرنز
          </Text>
          <Text style={[styles.lockMessage, { color: theme.colors.textSecondary }]}>
            يرجى تسجيل الدخول لعرض البيانات
          </Text>
        </View>
      </View>
    );
  }

  // Get week dates (Sunday to Thursday) - إصلاح حساب الأيام باستخدام النظام الجديد
  const getWeekDates = (weekStart: Date) => {
    // استخدام النظام الجديد لإنشاء خريطة التواريخ
    const weekDateMap = createWeekDateMap(weekStart);
    
    // تحويل إلى مصفوفة من كائنات Date للتوافق مع الكود الموجود
    return weekDateMap.map(dateInfo => new Date(dateInfo.date + 'T12:00:00'));
  };

  const getClassesForDate = (date: string) => {
    // استخدام النظام الجديد للفلترة بناءً على التاريخ الفعلي
    return getClassesForSpecificDate(classes, date);
  };

  // New function to get classes for a specific selected date
  const getClassesForSelectedDate = (selectedDate: string) => {
    if (!selectedDate) return [];
    
    try {
      // Create a proper date object with timezone handling
      // Add 'T12:00:00' to avoid timezone issues when parsing the date
      const dateObj = new Date(selectedDate + 'T12:00:00');
      
      // Validate the date is valid
      if (isNaN(dateObj.getTime())) {
        console.warn('Invalid date provided:', selectedDate);
        return [];
      }
      
      // Get the day name for the selected date using the improved function
      const dayName = getDayNameFromDate(selectedDate);
      
      // Filter classes that occur on this day of the week
      const dayClasses = classes.filter(cls => {
        return isDayMatch(cls.days || [], dayName);
      });
      
      // Debug logging
      console.log(`📅 Classes for ${selectedDate} (${dayName}):`, dayClasses.length, 'classes found');
      if (dayClasses.length > 0) {
        console.log('🔍 Sample classes:', dayClasses.slice(0, 2).map(cls => ({
          name: cls.name,
          time: cls.time,
          days: cls.days
        })));
      }
      
      return dayClasses;
    } catch (error) {
      console.error('Error processing selected date:', error);
      return [];
    }
  };

  const getClassesForToday = () => {
    let classesToShow;
    
    if (selectedDate) {
      // Show classes for the selected date using the new system
      classesToShow = getClassesForDate(selectedDate);
    } else {
      // Show all classes when no specific date is selected
      classesToShow = classes;
    }
    
    // ترتيب الكلاسات حسب التوقيت من الأول إلى الأخير
    return classesToShow.sort((a, b) => {
      // تحويل الوقت إلى دقائق للمقارنة
      const timeToMinutes = (time: string) => {
        const [timePart, period] = time.split(' ');
        const [hours, minutes] = timePart.split(':').map(Number);
        let totalMinutes = hours * 60 + minutes;
        
        // تحويل من 12 ساعة إلى 24 ساعة
        if (period === 'PM' && hours !== 12) {
          totalMinutes += 12 * 60;
        } else if (period === 'AM' && hours === 12) {
          totalMinutes -= 12 * 60;
        }
        
        return totalMinutes;
      };
      
      return timeToMinutes(a.time) - timeToMinutes(b.time);
    });
  };

  const handleDatePress = (date: string) => {
    try {
      // Validate the date string format (YYYY-MM-DD)
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        console.warn('Invalid date format:', date);
        return;
      }
      
      // Test if the date is valid
      const testDate = new Date(date + 'T12:00:00');
      if (isNaN(testDate.getTime())) {
        console.warn('Invalid date provided:', date);
        return;
      }
      
      // استخدام النظام الجديد للمقارنة
      if (selectedDate && isSameDate(selectedDate, date)) {
        setSelectedDate(null); // Deselect if same date clicked
      } else {
        setSelectedDate(date); // Select new date
        console.log('Selected date:', date, 'Day:', getDayNameFromDate(date));
      }
    } catch (error) {
      console.error('Error handling date press:', error);
    }
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newWeek = new Date(currentWeek);
    newWeek.setDate(newWeek.getDate() + (direction === 'next' ? 7 : -7));
    setCurrentWeek(newWeek);
  };

  const formatTimeTo12Hour = (time24: string) => {
    if (!time24) return '';
    
    // If already in 12-hour format, return as is
    if (time24.includes('AM') || time24.includes('PM')) {
      return time24;
    }
    
    // Convert from 24-hour to 12-hour format
    const [hours, minutes] = time24.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const renderClassItem = (cls: Class) => (
    <View key={cls.id}>
      <Card style={styles.classItem} variant="outlined">
        <View style={styles.classHeader}>
          <View style={[styles.classColor, { backgroundColor: theme.colors.primary }]} />
          <View style={styles.classInfo}>
            <Text style={[styles.className, { color: theme.colors.text }]}>
              {cls.name}
            </Text>
            <Text style={[styles.classTime, { color: theme.colors.primary, fontSize: 18, fontWeight: '700' }]}>
              {formatTimeTo12Hour(cls.time)}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.deleteButton, { backgroundColor: theme.colors.error || '#ff4444' }]}
            onPress={() => handleDeleteClass(cls)}
          >
            <Ionicons name="trash-outline" size={14} color="#ffffff" />
          </TouchableOpacity>
        </View>
        <View style={styles.classDetails}>
          {cls.location && (
            <Text style={[styles.classLocation, { color: theme.colors.textSecondary }]}>
              📍 {cls.location}
            </Text>
          )}
          <Text style={[styles.classDay, { color: theme.colors.textSecondary }]}>
            📅 {cls.days ? cls.days.map(day => {
              const dayMap: { [key: string]: string } = {
                'Sunday': 'الأحد',
                'Monday': 'الاثنين',
                'Tuesday': 'الثلاثاء',
                'Wednesday': 'الأربعاء',
                'Thursday': 'الخميس',
                'Friday': 'الجمعة',
                'Saturday': 'السبت'
              };
              return dayMap[day] || day;
            }).join(', ') : ''} {selectedDate && '🔄'}
          </Text>
          {cls.repetitionInterval && (
            <Text style={[styles.classRepetition, { color: theme.colors.textSecondary }]}>
              🔄 كل {cls.repetitionInterval === 1 ? 'أسبوع' : `${cls.repetitionInterval} أسابيع`}
            </Text>
          )}
        </View>
      </Card>
    </View>
  );



  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[theme.colors.primary]}
          tintColor={theme.colors.primary}
        />
      }
    >
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.uploadButton}
          onPress={() => navigation.navigate('TimetableUpload' as never)}
        >
          <Ionicons name="images" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Week Navigation */}
      <View style={styles.weekNavigation}>
        <TouchableOpacity 
          style={styles.navButton}
          onPress={() => navigateWeek('prev')}
        >
          <Ionicons name="chevron-back" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
        
        <Text style={[styles.weekTitle, { color: theme.colors.text }]}>
          {formatArabicMonthYear(currentWeek)}
        </Text>
        
        <TouchableOpacity 
          style={styles.navButton}
          onPress={() => navigateWeek('next')}
        >
          <Ionicons name="chevron-forward" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>


      {/* Horizontal Week View */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.weekScrollView}
        contentContainerStyle={styles.weekContainer}
      >
        {createWeekDateMap(currentWeek).map((dateInfo, index) => {
          const dateString = dateInfo.date;
          const dayName = dateInfo.dayNameArabic;
          const dayNumber = new Date(dateString + 'T12:00:00').getDate();
          const isSelected = selectedDate === dateString;
          const isToday = isSameDate(dateString, new Date());
          
          // Get classes for this specific date
          const dayClasses = getClassesForDate(dateString);
          
          return (
            <TouchableOpacity
              key={dateString}
              style={[
                styles.dayBox,
                {
                  backgroundColor: isSelected ? theme.colors.primary : theme.colors.surface,
                  borderColor: isToday ? theme.colors.primary : theme.colors.border,
                  borderWidth: isToday ? 2 : 1,
                }
              ]}
              onPress={() => handleDatePress(dateString)}
            >
              <Text style={[
                styles.dayName,
                { color: isSelected ? '#ffffff' : theme.colors.textSecondary }
              ]}>
                {dayName}
              </Text>
              <Text style={[
                styles.dayNumber,
                { color: isSelected ? '#ffffff' : theme.colors.text }
              ]}>
                {dayNumber}
              </Text>
              {dayClasses.length > 0 && (
                <View style={[
                  styles.classIndicator,
                  { backgroundColor: isSelected ? '#ffffff' : theme.colors.primary }
                ]}>
                  <Text style={[
                    styles.classCount,
                    { color: isSelected ? theme.colors.primary : '#ffffff' }
                  ]}>
                    {dayClasses.length}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={styles.content}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          {selectedDate ? 
            `الحصص المجدولة - ${formatArabicDate(new Date(selectedDate))}` : 
            `جميع الحصص (${classes.length} حصة)`
          }
        </Text>
        
        {selectedDate && (
          <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
            💡 هذه الحصص تتكرر كل أسبوع في هذا اليوم
          </Text>
        )}
        
        {/* Action Buttons - Between title and classes */}
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: theme.colors.primary }]}
            onPress={() => navigation.navigate('AddClass' as never)}
          >
            <Ionicons name="add" size={18} color="#ffffff" />
            <Text style={styles.actionButtonText}>إضافة حصة</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: theme.colors.secondary }]}
            onPress={async () => {
              try {
                const notificationId = await NotificationService.scheduleImmediateTestReminder();
                if (notificationId) {
                  Alert.alert('نجح', 'تم جدولة إشعار اختبار خلال 5 ثوانٍ');
                } else {
                  Alert.alert('خطأ', 'فشل في جدولة الإشعار');
                }
              } catch (error) {
                Alert.alert('خطأ', 'حدث خطأ أثناء اختبار الإشعار');
              }
            }}
          >
            <Ionicons name="notifications" size={18} color="#ffffff" />
            <Text style={styles.actionButtonText}>اختبار إشعار</Text>
          </TouchableOpacity>
        </View>
        
        {getClassesForToday().length > 0 ? (
          getClassesForToday().map(renderClassItem)
        ) : (
          <Card style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={48} color={theme.colors.textSecondary} />
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
              {selectedDate ? 'لا توجد حصص متكررة لهذا اليوم من الأسبوع' : 'لا توجد حصص مجدولة لهذا اليوم'}
            </Text>
            <Button
              title="رفع الجدول"
              onPress={() => navigation.navigate('TimetableUpload' as never)}
              variant="outline"
              size="small"
            />
          </Card>
        )}
      </View>

    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  lockMessage: {
    fontSize: 18,
    textAlign: 'center',
    marginTop: 16,
  },
  scrollContent: {
    paddingBottom: 120, // مساحة كافية لشريط التنقل السفلي
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  uploadButton: {
    padding: 8,
  },
  weekNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  navButton: {
    padding: 8,
    borderRadius: 8,
  },
  weekTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  weekScrollView: {
    marginBottom: 16,
  },
  weekContainer: {
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayBox: {
    width: 80,
    height: 100,
    marginRight: 12,
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  dayName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
    textAlign: 'center',
  },
  dayNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  classIndicator: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  classCount: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  content: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  infoText: {
    fontSize: 14,
    fontStyle: 'italic',
    marginBottom: 12,
    textAlign: 'center',
  },
  classItem: {
    marginBottom: 12,
  },
  classHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  classColor: {
    width: 4,
    height: 40,
    borderRadius: 2,
    marginRight: 12,
  },
  classInfo: {
    flex: 1,
  },
  deleteButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.15,
    shadowRadius: 1,
  },
  className: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  classSubject: {
    fontSize: 14,
  },
  classTime: {
    fontSize: 16,
    fontWeight: '600',
  },
  timeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginLeft: 8,
  },
  timeBadgeText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  classDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  classLocation: {
    fontSize: 12,
    marginRight: 8,
    marginBottom: 4,
  },
  classDay: {
    fontSize: 12,
    marginRight: 8,
    marginBottom: 4,
  },
  classRepetition: {
    fontSize: 12,
    marginRight: 8,
    marginBottom: 4,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 16,
    marginBottom: 16,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    marginVertical: 12,
    marginHorizontal: 16,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
});

export default CalendarScreen;
