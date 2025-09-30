import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import Card from '../components/Card';
import Button from '../components/Button';
import { SmartSchedulingService } from '../services/SmartSchedulingService';
import { Class } from '../types';

const TimetableTestScreen: React.FC = () => {
  const { theme } = useTheme();
  const [testText, setTestText] = useState('');
  const [parsedClasses, setParsedClasses] = useState<Class[]>([]);
  const [isTesting, setIsTesting] = useState(false);

  const testCases = [
    {
      name: 'جدول عربي بسيط',
      text: `الاثنين: 9:00 ص - رياضيات, 11:00 ص - فيزياء
الثلاثاء: 8:00 ص - كيمياء, 2:00 م - مختبر
الأربعاء: 10:00 ص - إنجليزي`
    },
    {
      name: 'جدول إنجليزي',
      text: `Monday: 9:00 AM - Math, 11:00 AM - Physics
Tuesday: 8:00 AM - Chemistry, 2:00 PM - Lab
Wednesday: 10:00 AM - English`
    },
    {
      name: 'جدول بصيغة الجدول',
      text: `الاثنين | 9:00 ص | رياضيات
الثلاثاء | 8:00 ص | كيمياء
الأربعاء | 10:00 ص | إنجليزي`
    },
    {
      name: 'جدول بصيغة مختلفة',
      text: `رياضيات 9:00 ص الاثنين
كيمياء 8:00 ص الثلاثاء
إنجليزي 10:00 ص الأربعاء`
    },
    {
      name: 'جدول بصيغة الوقت-المادة-اليوم',
      text: `9:00 ص - رياضيات - الاثنين
8:00 ص - كيمياء - الثلاثاء
10:00 ص - إنجليزي - الأربعاء`
    },
    {
      name: 'جدول مختلط',
      text: `Math 9:00 AM Monday
كيمياء 8:00 ص الثلاثاء
English 10:00 AM Wednesday`
    },
    {
      name: 'جدول بصيغة الأرقام',
      text: `1: 9:00 ص - رياضيات
2: 8:00 ص - كيمياء
3: 10:00 ص - إنجليزي`
    },
    {
      name: 'جدول بصيغة 24 ساعة',
      text: `الاثنين: 09:00 - رياضيات, 11:00 - فيزياء
الثلاثاء: 08:00 - كيمياء, 14:00 - مختبر`
    },
    {
      name: 'جدول معقد',
      text: `جدول الحصص الأسبوعي
الاثنين: 9:00 ص - رياضيات (قاعة 101), 11:00 ص - فيزياء (قاعة 102)
الثلاثاء: 8:00 ص - كيمياء (مختبر), 2:00 م - برمجة (مختبر الحاسوب)
الأربعاء: 10:00 ص - إنجليزي (قاعة 201), 12:00 م - إحصاء (قاعة 103)`
    }
  ];

  const testParsing = async (text: string) => {
    setIsTesting(true);
    try {
      console.log('Testing timetable parsing with text:', text);
      const classes = SmartSchedulingService.parseTimetableText(text);
      console.log('Parsed classes:', classes);
      setParsedClasses(classes);
      
      if (classes.length === 0) {
        Alert.alert('تحذير', 'لم يتم العثور على أي حصص في النص');
      } else {
        Alert.alert(
          'نجح!',
          `تم استخراج ${classes.length} حصة بنجاح`,
          [{ text: 'موافق' }]
        );
      }
    } catch (error) {
      console.error('Error testing timetable parsing:', error);
      Alert.alert(
        'خطأ',
        `حدث خطأ أثناء اختبار التحليل: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`
      );
    } finally {
      setIsTesting(false);
    }
  };

  const runAllTests = async () => {
    setIsTesting(true);
    let totalTests = 0;
    let successfulTests = 0;
    let failedTests = 0;

    for (const testCase of testCases) {
      totalTests++;
      try {
        console.log(`Testing: ${testCase.name}`);
        const classes = SmartSchedulingService.parseTimetableText(testCase.text);
        
        if (classes.length > 0) {
          successfulTests++;
          console.log(`✅ ${testCase.name}: ${classes.length} classes parsed`);
        } else {
          failedTests++;
          console.log(`❌ ${testCase.name}: No classes parsed`);
        }
      } catch (error) {
        failedTests++;
        console.error(`❌ ${testCase.name}: Error -`, error);
      }
    }

    setIsTesting(false);
    
    const successRate = ((successfulTests / totalTests) * 100).toFixed(1);
    
    Alert.alert(
      'نتائج الاختبار',
      `إجمالي الاختبارات: ${totalTests}
نجح: ${successfulTests}
فشل: ${failedTests}
معدل النجاح: ${successRate}%`,
      [{ text: 'موافق' }]
    );
  };

  const renderTestCases = () => (
    <Card style={styles.testCasesSection}>
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
        حالات الاختبار
      </Text>
      
      {testCases.map((testCase, index) => (
        <TouchableOpacity
          key={index}
          style={[styles.testCaseButton, { borderColor: theme.colors.border }]}
          onPress={() => {
            setTestText(testCase.text);
            testParsing(testCase.text);
          }}
        >
          <Text style={[styles.testCaseText, { color: theme.colors.text }]}>
            {testCase.name}
          </Text>
        </TouchableOpacity>
      ))}
      
      <Button
        title="تشغيل جميع الاختبارات"
        onPress={runAllTests}
        variant="outline"
        size="small"
        style={styles.runAllButton}
        loading={isTesting}
      />
    </Card>
  );

  const renderCustomTest = () => (
    <Card style={styles.customTestSection}>
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
        اختبار مخصص
      </Text>
      
      <TextInput
        style={[styles.textInput, { 
          borderColor: theme.colors.border,
          color: theme.colors.text,
          backgroundColor: theme.colors.surface
        }]}
        placeholder="أدخل نص الجدول هنا..."
        placeholderTextColor={theme.colors.textSecondary}
        value={testText}
        onChangeText={setTestText}
        multiline
        numberOfLines={8}
        textAlignVertical="top"
      />
      
      <Button
        title="اختبار التحليل"
        onPress={() => testParsing(testText)}
        variant="primary"
        size="small"
        style={styles.testButton}
        loading={isTesting}
        disabled={!testText.trim()}
      />
    </Card>
  );

  const renderResults = () => {
    if (parsedClasses.length === 0) return null;

    return (
      <Card style={styles.resultsSection}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          النتائج ({parsedClasses.length} حصة)
        </Text>
        
        <ScrollView style={styles.resultsList} showsVerticalScrollIndicator={false}>
          {parsedClasses.map((classData, index) => (
            <View key={index} style={[styles.classItem, { borderColor: theme.colors.border }]}>
              <View style={[styles.classColor, { backgroundColor: classData.color }]} />
              <View style={styles.classInfo}>
                <Text style={[styles.className, { color: theme.colors.text }]}>
                  {classData.name}
                </Text>
                <Text style={[styles.classDetails, { color: theme.colors.textSecondary }]}>
                  {classData.day} - {classData.time}
                </Text>
                {classData.location && (
                  <Text style={[styles.classLocation, { color: theme.colors.textSecondary }]}>
                    📍 {classData.location}
                  </Text>
                )}
              </View>
            </View>
          ))}
        </ScrollView>
      </Card>
    );
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          اختبار تحليل الجداول
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          اختبر قدرة النظام على تحليل أنواع مختلفة من الجداول
        </Text>
      </View>

      <View style={styles.content}>
        {renderTestCases()}
        {renderCustomTest()}
        {renderResults()}
      </View>
    </ScrollView>
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
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
  },
  content: {
    paddingHorizontal: 16,
  },
  testCasesSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  testCaseButton: {
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 8,
  },
  testCaseText: {
    fontSize: 14,
    fontWeight: '500',
  },
  runAllButton: {
    marginTop: 16,
  },
  customTestSection: {
    marginBottom: 24,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    marginBottom: 16,
    minHeight: 120,
  },
  testButton: {
    alignSelf: 'flex-start',
  },
  resultsSection: {
    marginBottom: 24,
  },
  resultsList: {
    maxHeight: 400,
  },
  classItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 8,
  },
  classColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  classInfo: {
    flex: 1,
  },
  className: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  classDetails: {
    fontSize: 14,
    marginBottom: 2,
  },
  classLocation: {
    fontSize: 12,
  },
});

export default TimetableTestScreen;
