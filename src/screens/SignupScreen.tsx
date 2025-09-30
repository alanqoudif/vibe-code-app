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

const SignupScreen: React.FC = () => {
  const { theme } = useTheme();
  const { signup, isLoading } = useAuth();
  const navigation = useNavigation();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [countryCode, setCountryCode] = useState('+968'); // Default to Oman
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const validateForm = () => {
    if (!name.trim()) {
      Alert.alert('خطأ', 'يرجى إدخال الاسم');
      return false;
    }
    
    if (!email.trim()) {
      Alert.alert('خطأ', 'يرجى إدخال البريد الإلكتروني');
      return false;
    }
    
    if (!email.includes('@')) {
      Alert.alert('خطأ', 'يرجى إدخال بريد إلكتروني صحيح');
      return false;
    }
    
    if (!phoneNumber.trim()) {
      Alert.alert('خطأ', 'يرجى إدخال رقم الهاتف');
      return false;
    }
    
    if (phoneNumber.length < 8) {
      Alert.alert('خطأ', 'يرجى إدخال رقم هاتف صحيح');
      return false;
    }
    
    if (!password.trim()) {
      Alert.alert('خطأ', 'يرجى إدخال كلمة المرور');
      return false;
    }
    
    if (password.length < 6) {
      Alert.alert('خطأ', 'كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return false;
    }
    
    if (password !== confirmPassword) {
      Alert.alert('خطأ', 'كلمة المرور غير متطابقة');
      return false;
    }
    
    return true;
  };

  const handleSignup = async () => {
    if (!validateForm()) return;

    const fullPhoneNumber = countryCode + phoneNumber.trim();
    const success = await signup(name.trim(), email.trim(), password, fullPhoneNumber);
    
    if (!success) {
      Alert.alert('خطأ', 'فشل في إنشاء الحساب. يرجى المحاولة مرة أخرى');
    }
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
          onPress={() => navigation.goBack()}
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
          إنشاء حساب جديد
        </Text>
      </View>

      <View style={styles.form}>
        <Input
          label="الاسم الكامل"
          value={name}
          onChangeText={setName}
          placeholder="أدخل اسمك الكامل"
          autoCapitalize="words"
          leftIcon="person"
        />

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

        <View style={styles.phoneContainer}>
          <View style={styles.countryCodeContainer}>
            <Input
              label="رمز الدولة"
              value={countryCode}
              onChangeText={setCountryCode}
              placeholder="+968"
              keyboardType="phone-pad"
              autoCapitalize="none"
              autoCorrect={false}
              leftIcon="globe"
              style={styles.countryCodeInput}
            />
          </View>
          <View style={styles.phoneNumberContainer}>
            <Input
              label="رقم الهاتف"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              placeholder="71552969"
              keyboardType="phone-pad"
              autoCapitalize="none"
              autoCorrect={false}
              leftIcon="call"
              style={styles.phoneNumberInput}
            />
          </View>
        </View>

        <Input
          label="كلمة المرور"
          value={password}
          onChangeText={setPassword}
          placeholder="أدخل كلمة المرور (6 أحرف على الأقل)"
          secureTextEntry={!showPassword}
          leftIcon="lock-closed"
          rightIcon={showPassword ? "eye-off" : "eye"}
          onRightIconPress={() => setShowPassword(!showPassword)}
        />

        <Input
          label="تأكيد كلمة المرور"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          placeholder="أعد إدخال كلمة المرور"
          secureTextEntry={!showConfirmPassword}
          leftIcon="lock-closed"
          rightIcon={showConfirmPassword ? "eye-off" : "eye"}
          onRightIconPress={() => setShowConfirmPassword(!showConfirmPassword)}
        />

        <View style={styles.termsContainer}>
          <Text style={[styles.termsText, { color: theme.colors.textSecondary }]}>
            بإنشاء حساب، فإنك توافق على{' '}
            <Text style={[styles.termsLink, { color: theme.colors.primary }]}>
              شروط الخدمة
            </Text>
            {' '}و{' '}
            <Text style={[styles.termsLink, { color: theme.colors.primary }]}>
              سياسة الخصوصية
            </Text>
          </Text>
        </View>

        <Button
          title={isLoading ? "جاري إنشاء الحساب..." : "إنشاء الحساب"}
          onPress={handleSignup}
          disabled={isLoading}
          style={[styles.signupButton, { backgroundColor: theme.colors.primary }]}
          textStyle={styles.signupButtonText}
        />

        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={theme.colors.primary} />
          </View>
        )}

        <View style={styles.loginContainer}>
          <Text style={[styles.loginText, { color: theme.colors.textSecondary }]}>
            لديك حساب بالفعل؟
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login' as never)}>
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
  termsContainer: {
    marginBottom: 24,
  },
  termsText: {
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  },
  termsLink: {
    fontWeight: '600',
  },
  signupButton: {
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  signupButtonText: {
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
  phoneContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  countryCodeContainer: {
    flex: 0.4,
  },
  phoneNumberContainer: {
    flex: 0.6,
  },
  countryCodeInput: {
    marginBottom: 0,
  },
  phoneNumberInput: {
    marginBottom: 0,
  },
});

export default SignupScreen;
