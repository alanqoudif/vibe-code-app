import React, { useState, useEffect } from 'react';
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
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/Button';
import Input from '../components/Input';

const ResetPasswordScreen: React.FC = () => {
  const { theme } = useTheme();
  const { updatePassword, isLoading } = useAuth();
  const navigation = useNavigation();
  const route = useRoute();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordUpdated, setPasswordUpdated] = useState(false);

  // Check if user is authenticated (should be after clicking reset link)
  useEffect(() => {
    // In a real app, you would check if the user came from a valid reset link
    // For now, we'll assume they're authenticated if they reach this screen
  }, []);

  const validatePassword = (password: string): string | null => {
    if (password.length < 6) {
      return 'كلمة المرور يجب أن تكون 6 أحرف على الأقل';
    }
    if (!/(?=.*[a-zA-Z])/.test(password)) {
      return 'كلمة المرور يجب أن تحتوي على حرف واحد على الأقل';
    }
    if (!/(?=.*\d)/.test(password)) {
      return 'كلمة المرور يجب أن تحتوي على رقم واحد على الأقل';
    }
    return null;
  };

  const handleResetPassword = async () => {
    if (!newPassword.trim()) {
      Alert.alert('خطأ', 'يرجى إدخال كلمة المرور الجديدة');
      return;
    }

    if (!confirmPassword.trim()) {
      Alert.alert('خطأ', 'يرجى تأكيد كلمة المرور الجديدة');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('خطأ', 'كلمات المرور غير متطابقة');
      return;
    }

    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      Alert.alert('خطأ', passwordError);
      return;
    }

    const success = await updatePassword(newPassword);
    if (success) {
      setPasswordUpdated(true);
    } else {
      Alert.alert('خطأ', 'فشل في تحديث كلمة المرور. يرجى المحاولة مرة أخرى');
    }
  };

  const handleBackToLogin = () => {
    navigation.navigate('Login' as never);
  };

  if (passwordUpdated) {
    return (
      <ScrollView 
        style={[styles.container, { backgroundColor: theme.colors.background }]}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.header}>
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
            <Ionicons name="checkmark" size={48} color="#ffffff" />
          </View>
          
          <Text style={[styles.successTitle, { color: theme.colors.text }]}>
            تم تحديث كلمة المرور
          </Text>
          
          <Text style={[styles.successMessage, { color: theme.colors.textSecondary }]}>
            تم تحديث كلمة المرور بنجاح. يمكنك الآن تسجيل الدخول بكلمة المرور الجديدة.
          </Text>

          <Button
            title="تسجيل الدخول"
            onPress={handleBackToLogin}
            style={[styles.loginButton, { backgroundColor: theme.colors.primary }]}
            textStyle={styles.loginButtonText}
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
          أدخل كلمة المرور الجديدة
        </Text>

        <Input
          label="كلمة المرور الجديدة"
          value={newPassword}
          onChangeText={setNewPassword}
          placeholder="أدخل كلمة المرور الجديدة"
          secureTextEntry={!showNewPassword}
          leftIcon="lock-closed"
          rightIcon={showNewPassword ? "eye-off" : "eye"}
          onRightIconPress={() => setShowNewPassword(!showNewPassword)}
        />

        <Input
          label="تأكيد كلمة المرور"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          placeholder="أعد إدخال كلمة المرور الجديدة"
          secureTextEntry={!showConfirmPassword}
          leftIcon="lock-closed"
          rightIcon={showConfirmPassword ? "eye-off" : "eye"}
          onRightIconPress={() => setShowConfirmPassword(!showConfirmPassword)}
        />

        <View style={styles.passwordRequirements}>
          <Text style={[styles.requirementsTitle, { color: theme.colors.text }]}>
            متطلبات كلمة المرور:
          </Text>
          <Text style={[styles.requirement, { color: theme.colors.textSecondary }]}>
            • 6 أحرف على الأقل
          </Text>
          <Text style={[styles.requirement, { color: theme.colors.textSecondary }]}>
            • حرف واحد على الأقل
          </Text>
          <Text style={[styles.requirement, { color: theme.colors.textSecondary }]}>
            • رقم واحد على الأقل
          </Text>
        </View>

        <Button
          title={isLoading ? "جاري التحديث..." : "تحديث كلمة المرور"}
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
  passwordRequirements: {
    marginBottom: 24,
    padding: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  requirementsTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  requirement: {
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 4,
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
    marginBottom: 32,
  },
  loginButton: {
    paddingVertical: 16,
    borderRadius: 12,
    minWidth: 200,
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    color: '#ffffff',
  },
});

export default ResetPasswordScreen;
