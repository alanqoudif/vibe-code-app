import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../contexts/ThemeContext';
import Button from '../components/Button';

const { width, height } = Dimensions.get('window');

const WelcomeScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation();

  const features = [
    {
      icon: 'calendar' as const,
      title: 'تقويم ذكي',
      description: 'إدارة جدولك الدراسي بسهولة ومرونة',
    },
    {
      icon: 'checkmark-circle' as const,
      title: 'إدارة المهام',
      description: 'تتبع واجباتك ومهامك الدراسية',
    },
    {
      icon: 'bulb' as const,
      title: 'مساعد ذكي',
      description: 'نصائح دراسية مخصصة لك',
    },
    {
      icon: 'notifications' as const,
      title: 'تذكيرات ذكية',
      description: 'لا تفوت أي موعد مهم',
    },
  ];

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
        <View style={styles.logoContainer}>
          <Image 
            source={require('../../logo.png')} 
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
      </View>

      <View style={styles.content}>

        <View style={styles.featuresContainer}>
          {features.map((feature, index) => (
            <View key={index} style={[styles.featureItem, { backgroundColor: theme.colors.surface }]}>
              <View style={[styles.featureIcon, { backgroundColor: theme.colors.primary }]}>
                <Ionicons name={feature.icon} size={24} color="#ffffff" />
              </View>
              <View style={styles.featureText}>
                <Text style={[styles.featureTitle, { color: theme.colors.text }]}>
                  {feature.title}
                </Text>
                <Text style={[styles.featureDescription, { color: theme.colors.textSecondary }]}>
                  {feature.description}
                </Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.buttonsContainer}>
          <Button
            title="تسجيل الدخول"
            onPress={() => navigation.navigate('Login' as never)}
            style={[styles.button, { backgroundColor: theme.colors.primary }]}
            textStyle={styles.buttonText}
          />
          
          <Button
            title="إنشاء حساب جديد"
            onPress={() => navigation.navigate('Signup' as never)}
            style={[styles.button, styles.outlineButton, { borderColor: theme.colors.primary }]}
            textStyle={[styles.buttonText, styles.outlineButtonText, { color: theme.colors.primary }]}
          />
        </View>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: theme.colors.textSecondary }]}>
            learnz | ليرنز
          </Text>
          <Text style={[styles.footerText, { color: theme.colors.textSecondary }]}>
            صُنع بـ ❤️ للطلاب
          </Text>
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
    paddingBottom: 40,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  logoContainer: {
    marginBottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 120,
    height: 120,
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
    textAlign: 'center',
  },
  appDescription: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    lineHeight: 24,
  },
  content: {
    padding: 20,
    flex: 1,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  welcomeSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  featuresContainer: {
    marginBottom: 40,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  buttonsContainer: {
    marginBottom: 32,
  },
  button: {
    marginBottom: 12,
    paddingVertical: 16,
    borderRadius: 12,
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  outlineButtonText: {
    color: '#6366f1',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  footerText: {
    fontSize: 14,
  },
});

export default WelcomeScreen;
