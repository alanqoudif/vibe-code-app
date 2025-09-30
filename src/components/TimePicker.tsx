import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

interface TimePickerProps {
  selectedTime: string;
  onTimeChange: (time: string) => void;
  label?: string;
}

const { width } = Dimensions.get('window');

const TimePicker: React.FC<TimePickerProps> = ({
  selectedTime,
  onTimeChange,
  label = 'اختر الوقت',
}) => {
  const { theme } = useTheme();
  const [selectedHour, setSelectedHour] = useState(12);
  const [selectedMinute, setSelectedMinute] = useState(0);
  const [isAM, setIsAM] = useState(true);

  useEffect(() => {
    if (selectedTime) {
      const [time, period] = selectedTime.split(' ');
      const [hour, minute] = time.split(':');
      setSelectedHour(parseInt(hour));
      setSelectedMinute(parseInt(minute));
      setIsAM(period === 'AM');
    }
  }, [selectedTime]);

  const handleTimeChange = (hour: number, minute: number, am: boolean) => {
    setSelectedHour(hour);
    setSelectedMinute(minute);
    setIsAM(am);
    const formattedTime = `${hour}:${minute.toString().padStart(2, '0')} ${am ? 'AM' : 'PM'}`;
    onTimeChange(formattedTime);
  };

  const hours = Array.from({ length: 12 }, (_, i) => i + 1);
  const minutes = Array.from({ length: 60 }, (_, i) => i);

  const renderPickerColumn = (
    data: number[],
    selectedValue: number,
    onValueChange: (value: number) => void,
    unit: string
  ) => (
    <View style={styles.pickerColumn}>
      <Text style={[styles.unitLabel, { color: theme.colors.textSecondary }]}>
        {unit}
      </Text>
      <ScrollView
        style={styles.pickerScroll}
        showsVerticalScrollIndicator={false}
        snapToInterval={50}
        decelerationRate="fast"
      >
        {data.map((value) => (
          <TouchableOpacity
            key={value}
            style={[
              styles.pickerItem,
              {
                backgroundColor: selectedValue === value ? theme.colors.primary : 'transparent',
              },
            ]}
            onPress={() => onValueChange(value)}
          >
            <Text
              style={[
                styles.pickerItemText,
                {
                  color: selectedValue === value ? '#ffffff' : theme.colors.text,
                  fontWeight: selectedValue === value ? 'bold' : 'normal',
                },
              ]}
            >
              {value.toString().padStart(2, '0')}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: theme.colors.text }]}>{label}</Text>
      <View style={[styles.pickerContainer, { backgroundColor: theme.colors.surface }]}>
        {renderPickerColumn(hours, selectedHour, (hour) => 
          handleTimeChange(hour, selectedMinute, isAM), 'ساعة')}
        
        {renderPickerColumn(minutes, selectedMinute, (minute) => 
          handleTimeChange(selectedHour, minute, isAM), 'دقيقة')}
        
        <View style={styles.ampmContainer}>
          <Text style={[styles.unitLabel, { color: theme.colors.textSecondary }]}>
            فترة
          </Text>
          <View style={styles.ampmButtons}>
            <TouchableOpacity
              style={[
                styles.ampmButton,
                {
                  backgroundColor: isAM ? theme.colors.primary : theme.colors.surface,
                  borderColor: theme.colors.primary,
                },
              ]}
              onPress={() => handleTimeChange(selectedHour, selectedMinute, true)}
            >
              <Text
                style={[
                  styles.ampmText,
                  {
                    color: isAM ? '#ffffff' : theme.colors.primary,
                  },
                ]}
              >
                AM
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.ampmButton,
                {
                  backgroundColor: !isAM ? theme.colors.primary : theme.colors.surface,
                  borderColor: theme.colors.primary,
                },
              ]}
              onPress={() => handleTimeChange(selectedHour, selectedMinute, false)}
            >
              <Text
                style={[
                  styles.ampmText,
                  {
                    color: !isAM ? '#ffffff' : theme.colors.primary,
                  },
                ]}
              >
                PM
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
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
  pickerContainer: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  pickerColumn: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 8,
  },
  unitLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  pickerScroll: {
    height: 200,
    width: '100%',
  },
  pickerItem: {
    height: 50,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    marginVertical: 2,
  },
  pickerItemText: {
    fontSize: 18,
  },
  ampmContainer: {
    alignItems: 'center',
    marginLeft: 16,
  },
  ampmButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  ampmButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    minWidth: 50,
    alignItems: 'center',
  },
  ampmText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default TimePicker;
