import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/Button';
import Input from '../components/Input';

const EmailDiagnosticScreen: React.FC = () => {
  const { theme } = useTheme();
  const { resetPassword, checkEmailDelivery, isLoading } = useAuth();
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [diagnosticResults, setDiagnosticResults] = useState<string[]>([]);
  const [isRunningDiagnostic, setIsRunningDiagnostic] = useState(false);

  const runEmailDiagnostic = async () => {
    if (!email.trim()) {
      Alert.alert('خطأ', 'يرجى إدخال البريد الإلكتروني');
      return;
    }

    setIsRunningDiagnostic(true);
    setDiagnosticResults([]);
    
    const results: string[] = [];
    
    try {
      // 1. Check email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        results.push('❌ تنسيق البريد الإلكتروني غير صحيح');
      } else {
        results.push('✅ تنسيق البريد الإلكتروني صحيح');
      }

      // 2. Check if user exists in database
      results.push('🔍 فحص وجود المستخدم في قاعدة البيانات...');
      const userExists = await checkEmailDelivery(email);
      if (userExists) {
        results.push('✅ المستخدم موجود في قاعدة البيانات');
      } else {
        results.push('❌ المستخدم غير موجود في قاعدة البيانات');
        results.push('💡 تأكد من أنك تستخدم نفس البريد الإلكتروني المسجل');
      }

      // 3. Test password reset
      if (userExists) {
        results.push('🔄 اختبار إرسال رابط إعادة تعيين كلمة المرور...');
        const resetSuccess = await resetPassword(email);
        if (resetSuccess) {
          results.push('✅ تم إرسال رابط إعادة تعيين كلمة المرور بنجاح');
          results.push('📧 تحقق من بريدك الإلكتروني (والمجلد غير المرغوب فيه)');
        } else {
          results.push('❌ فشل في إرسال رابط إعادة تعيين كلمة المرور');
          results.push('💡 قد تكون هناك قيود زمنية - انتظر 30 ثانية وحاول مرة أخرى');
        }
      }

      // 4. General tips
      results.push('');
      results.push('💡 نصائح لحل المشكلة:');
      results.push('• تحقق من مجلد الرسائل غير المرغوب فيها');
      results.push('• تأكد من صحة البريد الإلكتروني');
      results.push('• انتظر بضع دقائق قبل التحقق مرة أخرى');
      results.push('• جرب استخدام بريد إلكتروني آخر للاختبار');

    } catch (error) {
      results.push('❌ خطأ في التشخيص: ' + error);
    }

    setDiagnosticResults(results);
    setIsRunningDiagnostic(false);
  };

  const handleBackToSettings = () => {
    navigation.goBack();
  };

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={handleBackToSettings}
        >
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        
        <View style={styles.logoContainer}>
          <Image 
            source={require('../../logo.png')} 
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
        
        <Text style={[styles.title, { color: theme.colors.text }]}>
          learnz | ليرنز
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          تشخيص مشاكل البريد الإلكتروني
        </Text>
      </View>

      <View style={styles.form}>
        <Text style={[styles.description, { color: theme.colors.textSecondary }]}>
          أدخل بريدك الإلكتروني لفحص مشاكل إرسال رسائل إعادة تعيين كلمة المرور
        </Text>

        <Input
          label="البريد الإلكتروني"
          value={email}
          onChangeText={setEmail}
          placeholder="أدخل بريدك الإلكتروني"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          leftIcon="mail"
        />

        <Button
          title={isRunningDiagnostic ? "جاري التشخيص..." : "بدء التشخيص"}
          onPress={runEmailDiagnostic}
          disabled={isRunningDiagnostic || isLoading}
          style={[styles.diagnosticButton, { backgroundColor: theme.colors.primary }]}
          textStyle={styles.diagnosticButtonText}
        />

        {isRunningDiagnostic && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={theme.colors.primary} />
            <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
              جاري فحص البريد الإلكتروني...
            </Text>
          </View>
        )}

        {diagnosticResults.length > 0 && (
          <View style={[styles.resultsContainer, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.resultsTitle, { color: theme.colors.text }]}>
              نتائج التشخيص:
            </Text>
            {diagnosticResults.map((result, index) => (
              <Text 
                key={index} 
                style={[
                  styles.resultText, 
                  { 
                    color: result.startsWith('✅') ? '#4CAF50' : 
                           result.startsWith('❌') ? '#F44336' : 
                           result.startsWith('💡') ? '#FF9800' : 
                           result.startsWith('🔍') || result.startsWith('🔄') ? '#2196F3' : 
                           theme.colors.textSecondary 
                  }
                ]}
              >
                {result}
              </Text>
            ))}
          </View>
        )}

        <View style={styles.tipsContainer}>
          <Text style={[styles.tipsTitle, { color: theme.colors.text }]}>
            أسباب شائعة لعدم وصول الرسائل:
          </Text>
          <Text style={[styles.tipText, { color: theme.colors.textSecondary }]}>
            • الرسائل تذهب إلى مجلد الرسائل غير المرغوب فيها
          </Text>
          <Text style={[styles.tipText, { color: theme.colors.textSecondary }]}>
            • قيود Supabase: 2 رسالة فقط في الساعة
          </Text>
          <Text style={[styles.tipText, { color: theme.colors.textSecondary }]}>
            • البريد الإلكتروني غير مسجل في النظام
          </Text>
          <Text style={[styles.tipText, { color: theme.colors.textSecondary }]}>
            • مشاكل في إعدادات مزود البريد الإلكتروني
          </Text>
        </View>

        <Button
          title="العودة للإعدادات"
          onPress={handleBackToSettings}
          style={[styles.backButton, { backgroundColor: theme.colors.textSecondary }]}
          textStyle={styles.backButtonText}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 32,
    alignItems: 'center',
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    marginBottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 80,
    height: 80,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  form: {
    paddingHorizontal: 20,
    flex: 1,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 32,
    textAlign: 'center',
  },
  diagnosticButton: {
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  diagnosticButtonText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    color: '#ffffff',
  },
  loadingContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
  },
  resultsContainer: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  resultText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4,
  },
  tipsContainer: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  tipText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    color: '#ffffff',
  },
});

export default EmailDiagnosticScreen;
