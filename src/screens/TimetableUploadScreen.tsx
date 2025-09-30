import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import { StorageService } from '../services/StorageService';
import { Class } from '../types';
import { supabase } from '../lib/supabase';

const TimetableUploadScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [uploadMethod, setUploadMethod] = useState<'gallery'>('gallery');
  const [isProcessing, setIsProcessing] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [reminderMinutes, setReminderMinutes] = useState<number>(15);

  const requestPermissions = async () => {
    return true;
  };

  const takePhoto = async () => {
    Alert.alert('معلومة', 'تم إلغاء خيار الكاميرا. الرجاء اختيار صورة من المعرض.');
  };

  const showReminderOptions = () => {
    Alert.alert(
      'اختر وقت التذكير',
      'متى تريد أن تتلقى تذكيراً قبل كل حصة؟',
      [
        { text: '5 دقائق', onPress: () => setReminderMinutes(5) },
        { text: '10 دقائق', onPress: () => setReminderMinutes(10) },
        { text: '15 دقائق', onPress: () => setReminderMinutes(15) },
        { text: '30 دقيقة', onPress: () => setReminderMinutes(30) },
        { text: 'ساعة واحدة', onPress: () => setReminderMinutes(60) },
        { text: 'إلغاء', style: 'cancel' }
      ]
    );
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false, // إزالة التعديل لضمان الصورة كاملة
      quality: 1, // أعلى جودة ممكنة
      exif: false, // إزالة البيانات الإضافية لتقليل حجم الملف
      base64: false, // لا نحتاج base64 للعرض
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
      setUploadMethod('gallery');
      // إظهار pop-up لاختيار وقت التذكير مباشرة
      setTimeout(() => showReminderOptions(), 500);
    }
  };


  const processTimetable = async () => {
    if (!selectedImage) {
      Alert.alert('خطأ', 'يرجى اختيار صورة أولاً.');
      return;
    }

    setIsProcessing(true);

    try {
      // Get current user with better error handling
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) {
        console.error('User authentication error:', userError);
        throw new Error(`خطأ في المصادقة: ${userError.message}`);
      }
      if (!user) {
        throw new Error('يجب تسجيل الدخول أولاً');
      }

      console.log('Starting timetable processing for user:', user.id);

      let fileContent: string;
      let fileType: string;
      let fileName: string;

      {
        // Convert image to base64 for processing with better error handling
        let base64Image: string;
        try {
          const response = await fetch(selectedImage!);
          if (!response.ok) {
            throw new Error(`فشل في تحميل الصورة: ${response.status}`);
          }
          
          const blob = await response.blob();
          if (blob.size === 0) {
            throw new Error('الصورة فارغة أو تالفة');
          }
          
          const reader = new FileReader();
          
          const base64Promise = new Promise<string>((resolve, reject) => {
            reader.onload = () => {
              const result = reader.result as string;
              if (!result || !result.startsWith('data:')) {
                reject(new Error('فشل في تحويل الصورة إلى base64'));
              } else {
                resolve(result);
              }
            };
            reader.onerror = () => reject(new Error('خطأ في قراءة الصورة'));
            reader.readAsDataURL(blob);
          });

          base64Image = await base64Promise;
          console.log('Image converted to base64 successfully, size:', base64Image.length);
        } catch (imageError) {
          console.error('Image processing error:', imageError);
          throw new Error(`خطأ في معالجة الصورة: ${imageError instanceof Error ? imageError.message : 'خطأ غير معروف'}`);
        }
        
        fileContent = base64Image;
        fileType = 'image/jpeg';
        fileName = `timetable_${Date.now()}.jpg`;
      }

      // Call the working-schedule-extractor function with timeout
      console.log('Calling schedule extractor function...');
      const functionPromise = supabase.functions.invoke('working-schedule-extractor', {
        body: {
          fileContent: fileContent,
          userId: user.id,
          fileName: fileName,
          fileType: fileType,
          reminderMinutes: reminderMinutes
        }
      });

      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('انتهت مهلة المعالجة. يرجى المحاولة مرة أخرى.')), 60000); // 60 seconds
      });

      const { data, error } = await Promise.race([functionPromise, timeoutPromise]) as any;

      if (error) {
        console.error('Function invocation error:', error);
        throw new Error(`خطأ في معالجة الصورة: ${error.message || 'خطأ غير معروف'}`);
      }

      if (!data) {
        throw new Error('لم يتم استلام أي بيانات من الخادم');
      }

      if (!data.success) {
        console.error('Function returned error:', data.error);
        throw new Error(data.error || 'فشل في استخراج الجدول من الصورة');
      }

      console.log('Timetable processing successful:', data);

      setIsProcessing(false);
      
      // Get statistics about the added events with better error handling
      const events = data.events || [];
      if (events.length === 0) {
        Alert.alert(
          'تحذير',
          'تم معالجة الصورة بنجاح ولكن لم يتم العثور على أي حصص في الجدول. يرجى التأكد من وضوح الصورة ووجود جدول واضح.',
          [{ text: 'موافق', onPress: () => navigation.goBack() }]
        );
        return;
      }

      const eventTypes = events.reduce((acc: any, event: any) => {
        const type = event.event_type || 'lecture';
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {});
      
      const statsText = Object.entries(eventTypes)
        .map(([type, count]) => {
          const typeName = type === 'lecture' ? 'محاضرات' : 
                          type === 'lab' ? 'مختبرات' : 
                          type === 'exam' ? 'امتحانات' : 
                          type === 'tutorial' ? 'حلقات دراسية' : 'أحداث';
          return `${count} ${typeName}`;
        })
        .join(', ');

      Alert.alert(
        'نجح!',
        `تم معالجة جدولك بنجاح وإضافة ${events.length} حصة إلى تقويمك.\n\n📊 الإحصائيات: ${statsText}\n\n🔔 سيتم إرسال تذكيرات تلقائية قبل كل حصة بـ ${reminderMinutes} دقيقة.`,
        [
          { 
            text: 'عرض التقويم', 
            onPress: () => {
              navigation.goBack();
              // Navigate to calendar screen to show the new events
              setTimeout(() => {
                navigation.navigate('Calendar' as never);
              }, 100);
            }
          },
          { text: 'موافق', onPress: () => navigation.goBack() }
        ]
      );

    } catch (error) {
      setIsProcessing(false);
      console.error('Error processing timetable:', error);
      
      let errorMessage = 'حدث خطأ أثناء معالجة الجدول. يرجى المحاولة مرة أخرى.';
      
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      // Provide more specific error messages
      if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
        errorMessage = 'خطأ في الاتصال بالإنترنت. يرجى التحقق من اتصالك والمحاولة مرة أخرى.';
      } else if (errorMessage.includes('timeout') || errorMessage.includes('مهلة')) {
        errorMessage = 'انتهت مهلة المعالجة. يرجى المحاولة مرة أخرى أو اختيار صورة أصغر.';
      } else if (errorMessage.includes('base64') || errorMessage.includes('صورة')) {
        errorMessage = 'خطأ في معالجة الصورة. يرجى اختيار صورة أخرى أو التحقق من جودة الصورة.';
      }
      
      Alert.alert(
        'خطأ في المعالجة',
        errorMessage,
        [
          { text: 'إعادة المحاولة', onPress: () => processTimetable() },
          { text: 'إلغاء', onPress: () => {} }
        ]
      );
    }
  };

  const renderUploadMethod = () => (
    <Card style={styles.uploadSection}>
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>طريقة الرفع</Text>
      <View style={styles.methodButtons}>
        <TouchableOpacity
          style={[
            styles.methodButton,
            {
              backgroundColor: theme.colors.primary,
              borderColor: theme.colors.primary,
            },
          ]}
          activeOpacity={1}
        >
          <Ionicons name="images" size={24} color="#ffffff" />
          <Text style={[styles.methodText, { color: '#ffffff' }]}>المعرض</Text>
        </TouchableOpacity>
      </View>
    </Card>
  );

  const renderImageUpload = () => (
    <Card style={styles.uploadSection}>
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>رفع الجدول</Text>
      
      <Text style={[styles.tipText, { color: theme.colors.textSecondary }]}> 
        💡 نصائح للحصول على أفضل النتائج:
        {'\n'}• تأكد من أن الجدول واضح ومضاء جيداً
        {'\n'}• تجنب الظلال والانعكاسات
        {'\n'}• اجعل الجدول يملأ معظم الصورة
        {'\n'}• تأكد من وضوح النص والأرقام
      </Text>
      
      {selectedImage ? (
        <View style={styles.imageContainer}>
          <Image 
            source={{ uri: selectedImage }} 
            style={styles.selectedImage}
            resizeMode="contain"
          />
          <TouchableOpacity
            style={[styles.removeButton, { backgroundColor: theme.colors.error }]}
            onPress={() => setSelectedImage(null)}
          >
            <Ionicons name="close" size={20} color="#ffffff" />
          </TouchableOpacity>
          <View style={styles.imageInfo}>
            <Text style={[styles.imageInfoText, { color: theme.colors.textSecondary }]}>
              ✓ صورة جاهزة للتحليل
            </Text>
            <TouchableOpacity
              style={styles.reminderButton}
              onPress={showReminderOptions}
            >
              <Ionicons name="time" size={16} color={theme.colors.primary} />
              <Text style={[styles.reminderButtonText, { color: theme.colors.primary }]}>
                التذكير: {reminderMinutes} دقيقة
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <TouchableOpacity
          style={[styles.uploadArea, { borderColor: theme.colors.border }]}
          onPress={pickImage}
        >
          <Ionicons name="images" size={48} color={theme.colors.textSecondary} />
          <Text style={[styles.uploadText, { color: theme.colors.textSecondary }]}>اضغط لاختيار من المعرض</Text>
        </TouchableOpacity>
      )}

      <View style={styles.uploadActions}>
        {!selectedImage ? (
          <Button
            title={'اختيار صورة'}
            onPress={pickImage}
            variant="outline"
            size="small"
          />
        ) : (
          <>
            <Button
              title={'اختيار أخرى'}
              onPress={pickImage}
              variant="outline"
              size="small"
            />
            <Button
              title="إزالة"
              onPress={() => setSelectedImage(null)}
              variant="ghost"
              size="small"
            />
          </>
        )}
      </View>
    </Card>
  );


  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          رفع الجدول
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          أضف جدول حصصك لتعبئة التقويم تلقائياً
        </Text>
      </View>

      <View style={styles.content}>
        {renderUploadMethod()}
        
        {renderImageUpload()}

        <Card style={styles.featuresSection}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            ماذا يحدث بعد ذلك؟
          </Text>
          
          <View style={styles.supportedFormats}>
            <Text style={[styles.supportedFormatsTitle, { color: theme.colors.textSecondary }]}>
              📱 الملفات المدعومة:
            </Text>
            <Text style={[styles.supportedFormatsText, { color: theme.colors.textSecondary }]}>
              • صور الجداول (JPG, PNG)
              {'\n'}• ملفات PDF
              {'\n'}• مستندات Word
              {'\n'}• النصوص المكتوبة
            </Text>
          </View>
          
          <View style={styles.featureList}>
            <View style={styles.featureItem}>
              <Ionicons name="scan" size={20} color={theme.colors.primary} />
              <Text style={[styles.featureText, { color: theme.colors.text }]}>
                سيقوم الذكاء الاصطناعي المتقدم بتحليل الصورة واستخراج معلومات حصصك بدقة عالية
              </Text>
            </View>
            
            <View style={styles.featureItem}>
              <Ionicons name="calendar" size={20} color={theme.colors.primary} />
              <Text style={[styles.featureText, { color: theme.colors.text }]}>
                ستتم إضافة الحصص تلقائياً إلى تقويمك
              </Text>
            </View>
            
            <View style={styles.featureItem}>
              <Ionicons name="notifications" size={20} color={theme.colors.primary} />
              <Text style={[styles.featureText, { color: theme.colors.text }]}>
                سيتم إعداد تذكيرات ذكية قبل كل حصة بـ 15 دقيقة
              </Text>
            </View>
            
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={20} color={theme.colors.primary} />
              <Text style={[styles.featureText, { color: theme.colors.text }]}>
                يمكنك تعديل أو إضافة المزيد من التفاصيل لاحقاً
              </Text>
            </View>
          </View>
        </Card>

        <Button
          title={isProcessing ? "جاري التحليل..." : "تحليل الجدول"}
          onPress={processTimetable}
          size="large"
          style={styles.processButton}
          disabled={isProcessing || !selectedImage}
          loading={isProcessing}
        />
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
  uploadSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  methodButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  methodButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    marginHorizontal: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  methodText: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
  },
  uploadArea: {
    height: 200,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  uploadText: {
    fontSize: 16,
    marginTop: 12,
    textAlign: 'center',
  },
  imageContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  selectedImage: {
    width: '100%',
    height: 500, // ارتفاع أكبر لضمان الوضوح
    borderRadius: 12,
    resizeMode: 'contain', // عرض الصورة كاملة مع الحفاظ على الوضوح
    backgroundColor: '#f5f5f5', // خلفية فاتحة لتحسين الوضوح
  },
  removeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  tipText: {
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
    lineHeight: 20,
  },
  helpText: {
    fontSize: 14,
    marginTop: 12,
    lineHeight: 20,
  },
  featuresSection: {
    marginBottom: 24,
  },
  featureList: {
    marginTop: 8,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureText: {
    fontSize: 14,
    marginLeft: 12,
    flex: 1,
  },
  processButton: {
    marginBottom: 32,
  },
  imageInfo: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  imageInfoText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
  supportedFormats: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 8,
  },
  supportedFormatsTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  supportedFormatsText: {
    fontSize: 13,
    lineHeight: 20,
  },
  textInputContainer: {
    marginBottom: 16,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    minHeight: 120,
    textAlign: 'right',
  },
  reminderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 6,
  },
  reminderButtonText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
});

export default TimetableUploadScreen;
