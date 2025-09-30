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

const ForgotPasswordScreen: React.FC = () => {
  const { theme } = useTheme();
  const { resetPassword, isLoading } = useAuth();
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [emailSent, setEmailSent] = useState(false);

  const handleResetPassword = async () => {
    if (!email.trim()) {
      Alert.alert('خطأ', 'يرجى إدخال البريد الإلكتروني');
      return;
    }

    const success = await resetPassword(email.trim());
    if (success) {
      setEmailSent(true);
    } else {
      Alert.alert(
        'خطأ', 
        'فشل في إرسال رابط إعادة تعيين كلمة المرور. يرجى المحاولة مرة أخرى بعد 30 ثانية أو التحقق من صحة البريد الإلكتروني.'
      );
    }
  };

  const handleBackToLogin = () => {
    navigation.goBack();
  };

  if (emailSent) {
    return (
      <ScrollView 
        style={[styles.container, { backgroundColor: theme.colors.background }]}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={handleBackToLogin}
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
        </View>

        <View style={styles.successContainer}>
          <View style={[styles.successIcon, { backgroundColor: theme.colors.primary }]}>
            <Ionicons name="mail" size={48} color="#ffffff" />
          </View>
          
          <Text style={[styles.successTitle, { color: theme.colors.text }]}>
            تم إرسال الرابط
          </Text>
          
          <Text style={[styles.successMessage, { color: theme.colors.textSecondary }]}>
            تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني:
          </Text>
          
          <Text style={[styles.emailText, { color: theme.colors.primary }]}>
            {email}
          </Text>
          
          <Text style={[styles.instructionsText, { color: theme.colors.textSecondary }]}>
            يرجى فحص صندوق الوارد أو مجلد الرسائل غير المرغوب فيها واتباع التعليمات في الرسالة.
          </Text>

          <Button
            title="العودة لتسجيل الدخول"
            onPress={handleBackToLogin}
            style={[styles.backButton, { backgroundColor: theme.colors.primary }]}
            textStyle={styles.backButtonText}
          />
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={handleBackToLogin}
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
          إعادة تعيين كلمة المرور
        </Text>
      </View>

      <View style={styles.form}>
        <Text style={[styles.description, { color: theme.colors.textSecondary }]}>
          أدخل بريدك الإلكتروني وسنرسل لك رابطاً لإعادة تعيين كلمة المرور
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
          title={isLoading ? "جاري الإرسال..." : "إرسال رابط إعادة التعيين"}
          onPress={handleResetPassword}
          disabled={isLoading}
          style={[styles.resetButton, { backgroundColor: theme.colors.primary }]}
          textStyle={styles.resetButtonText}
        />

        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={theme.colors.primary} />
          </View>
        )}

        <View style={styles.loginContainer}>
          <Text style={[styles.loginText, { color: theme.colors.textSecondary }]}>
            تذكرت كلمة المرور؟
          </Text>
          <TouchableOpacity onPress={handleBackToLogin}>
            <Text style={[styles.loginLink, { color: theme.colors.primary }]}>
              تسجيل الدخول
            </Text>
          </TouchableOpacity>
        </View>
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
  resetButton: {
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    color: '#ffffff',
  },
  loadingContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  loginText: {
    fontSize: 14,
    marginRight: 8,
  },
  loginLink: {
    fontSize: 14,
    fontWeight: '600',
  },
  successContainer: {
    paddingHorizontal: 20,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  successMessage: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 8,
  },
  emailText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 24,
  },
  instructionsText: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 32,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    color: '#ffffff',
  },
});

export default ForgotPasswordScreen;
