import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { Class } from '../types';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import TimePicker from '../components/TimePicker';
import ReminderPicker from '../components/ReminderPicker';
import { StorageService } from '../services/StorageService';
import { DatabaseService } from '../services/DatabaseService';
import { NotificationService } from '../services/NotificationService';
import { useAuth } from '../contexts/AuthContext';

const AddClassScreen: React.FC = () => {
  const { theme } = useTheme();
  const { isAuthenticated, user } = useAuth();
  const navigation = useNavigation();
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    time: '09:00 AM',
  });
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [selectedReminders, setSelectedReminders] = useState<string[]>([]);
  const [repetitionInterval, setRepetitionInterval] = useState<number>(1);

  const days = [
    'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'
  ];
  const dayLabels = [
    'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'
  ];

  const repetitionOptions = [
    { value: 1, label: 'كل أسبوع' },
    { value: 2, label: 'كل أسبوعين' },
    { value: 3, label: 'كل 3 أسابيع' },
    { value: 4, label: 'كل شهر' },
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleDayToggle = (day: string) => {
    setSelectedDays(prev => 
      prev.includes(day) 
        ? prev.filter(d => d !== day)
        : [...prev, day]
    );
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      Alert.alert('خطأ', 'يرجى إدخال اسم الحصة');
      return;
    }
    
    if (selectedDays.length === 0) {
      Alert.alert('خطأ', 'يرجى اختيار يوم واحد على الأقل');
      return;
    }

    try {
      const newClass: Class = {
        id: Date.now().toString(),
        name: formData.name,
        time: formData.time,
        days: selectedDays,
        location: formData.location || undefined,
        recurring: true,
        reminders: selectedReminders,
        repetitionInterval: repetitionInterval,
      };

      // Use DatabaseService directly for authenticated users to ensure real-time sync
      if (isAuthenticated && user) {
        console.log('💾 Adding class to database for real-time sync');
        const createdClass = await DatabaseService.createEvent(user.id, newClass);
        console.log('✅ Class added to database:', createdClass.name);
        
        // Schedule notifications for the class with selected reminders
        if (selectedReminders.length > 0) {
          // Schedule multiple reminders based on user selection
          const reminderMinutes = selectedReminders.map(reminder => {
            const minutes = NotificationService.parseReminderTime(reminder);
            return minutes || 15; // Default to 15 minutes if parsing fails
          });
          
          await NotificationService.scheduleMultipleClassReminders(createdClass, reminderMinutes);
        } else {
          // Schedule default reminder (15 minutes before)
          await NotificationService.scheduleClassReminder(createdClass);
        }
      } else {
        // Fallback to StorageService for non-authenticated users
        console.log('⚠️ User not authenticated, using local storage');
        await StorageService.addClass(newClass);
        
        // Schedule notifications for the class with selected reminders
        if (selectedReminders.length > 0) {
          // Schedule multiple reminders based on user selection
          const reminderMinutes = selectedReminders.map(reminder => {
            const minutes = NotificationService.parseReminderTime(reminder);
            return minutes || 15; // Default to 15 minutes if parsing fails
          });
          
          await NotificationService.scheduleMultipleClassReminders(newClass, reminderMinutes);
        } else {
          // Schedule default reminder (15 minutes before)
          await NotificationService.scheduleClassReminder(newClass);
        }
      }

      Alert.alert('نجح', 'تم حفظ الحصة بنجاح', [
        { text: 'موافق', onPress: () => {
          // Reset form
          setFormData({
            name: '',
            location: '',
            time: '09:00 AM',
          });
          setSelectedDays([]);
          setSelectedReminders([]);
          setRepetitionInterval(1);
          // Navigate back to calendar
          // Real-time subscription will automatically update the calendar
          navigation.goBack();
        }}
      ]);
    } catch (error) {
      Alert.alert('خطأ', 'حدث خطأ أثناء حفظ الحصة');
      console.error('Error saving class:', error);
    }
  };

  const handleCancel = () => {
    Alert.alert(
      'إلغاء',
      'هل أنت متأكد من إلغاء إضافة الحصة؟',
      [
        { text: 'لا', style: 'cancel' },
        { 
          text: 'نعم', 
          style: 'destructive',
          onPress: () => {
            setFormData({
              name: '',
              location: '',
              time: '09:00 AM',
            });
            setSelectedDays([]);
            setSelectedReminders([]);
            setRepetitionInterval(1);
            // Navigate back to main page
            navigation.goBack();
          }
        }
      ]
    );
  };

  const renderDaySelector = () => (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
        أيام الأسبوع (يمكن اختيار أكثر من يوم)
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {days.map((day, index) => (
          <TouchableOpacity
            key={day}
            style={[
              styles.dayButton,
              {
                backgroundColor: selectedDays.includes(day) ? theme.colors.primary : theme.colors.surface,
                borderColor: theme.colors.primary,
              },
            ]}
            onPress={() => handleDayToggle(day)}
          >
            <Text
              style={[
                styles.dayButtonText,
                {
                  color: selectedDays.includes(day) ? '#ffffff' : theme.colors.primary,
                },
              ]}
            >
              {dayLabels[index]}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderRepetitionSelector = () => (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
        تكرار التذكير
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {repetitionOptions.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.repetitionButton,
              {
                backgroundColor: repetitionInterval === option.value ? theme.colors.primary : theme.colors.surface,
                borderColor: theme.colors.primary,
              },
            ]}
            onPress={() => setRepetitionInterval(option.value)}
          >
            <Text
              style={[
                styles.repetitionButtonText,
                {
                  color: repetitionInterval === option.value ? '#ffffff' : theme.colors.primary,
                },
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );


  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.text }]}>
            إضافة حصة جديدة
          </Text>
        </View>

        <Card style={styles.formCard}>
          <Input
            label="اسم الحصة"
            value={formData.name}
            onChangeText={(value) => handleInputChange('name', value)}
            placeholder="مثال: الرياضيات"
            leftIcon="school"
          />

          <Input
            label="الموقع"
            value={formData.location}
            onChangeText={(value) => handleInputChange('location', value)}
            placeholder="مثال: القاعة 101"
            leftIcon="location"
          />

          {renderDaySelector()}

          <TimePicker
            selectedTime={formData.time}
            onTimeChange={(time) => handleInputChange('time', time)}
            label="وقت الحصة"
          />

          {renderRepetitionSelector()}

          <ReminderPicker
            selectedReminders={selectedReminders}
            onRemindersChange={setSelectedReminders}
            label="التذكيرات"
          />
        </Card>

        <View style={styles.actions}>
          <Button
            title="إلغاء"
            onPress={handleCancel}
            variant="outline"
            size="large"
            style={styles.actionButton}
          />
          <Button
            title="حفظ الحصة"
            onPress={handleSave}
            size="large"
            style={styles.actionButton}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  formCard: {
    margin: 16,
  },
  section: {
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  dayButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginHorizontal: 4,
    borderRadius: 20,
    borderWidth: 1,
  },
  dayButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  repetitionButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginHorizontal: 4,
    borderRadius: 20,
    borderWidth: 1,
  },
  repetitionButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === 'ios' ? 120 : 100,
    gap: 12,
  },
  actionButton: {
    flex: 1,
  },
});

export default AddClassScreen;
