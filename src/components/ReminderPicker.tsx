import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';

interface ReminderOption {
  id: string;
  label: string;
  value: number; // in minutes
}

interface ReminderPickerProps {
  selectedReminders: string[];
  onRemindersChange: (reminders: string[]) => void;
  label?: string;
}

const reminderOptions: ReminderOption[] = [
  { id: '5min', label: '5 دقائق قبل', value: 5 },
  { id: '10min', label: '10 دقائق قبل', value: 10 },
  { id: '15min', label: '15 دقيقة قبل', value: 15 },
  { id: '30min', label: '30 دقيقة قبل', value: 30 },
  { id: '1hour', label: 'ساعة واحدة قبل', value: 60 },
  { id: '1day', label: 'يوم واحد قبل', value: 1440 },
];

const ReminderPicker: React.FC<ReminderPickerProps> = ({
  selectedReminders,
  onRemindersChange,
  label = 'تذكيرات',
}) => {
  const { theme } = useTheme();

  const toggleReminder = (reminderId: string) => {
    if (selectedReminders.includes(reminderId)) {
      onRemindersChange(selectedReminders.filter(id => id !== reminderId));
    } else {
      onRemindersChange([...selectedReminders, reminderId]);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: theme.colors.text }]}>{label}</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.optionsContainer}
      >
        {reminderOptions.map((option) => {
          const isSelected = selectedReminders.includes(option.id);
          return (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.optionButton,
                {
                  backgroundColor: isSelected ? theme.colors.primary : theme.colors.surface,
                  borderColor: theme.colors.primary,
                },
              ]}
              onPress={() => toggleReminder(option.id)}
            >
              <Ionicons
                name={isSelected ? 'checkmark-circle' : 'checkmark-circle-outline'}
                size={16}
                color={isSelected ? '#ffffff' : theme.colors.primary}
              />
              <Text
                style={[
                  styles.optionText,
                  {
                    color: isSelected ? '#ffffff' : theme.colors.primary,
                  },
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  optionsContainer: {
    paddingHorizontal: 4,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginHorizontal: 4,
    borderRadius: 20,
    borderWidth: 1,
  },
  optionText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
});

export default ReminderPicker;
