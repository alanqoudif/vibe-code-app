import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import Card from '../components/Card';
import Button from '../components/Button';

const SettingsScreen: React.FC = () => {
  const { theme, isDark, toggleTheme } = useTheme();
  const { logout, user, resetPassword, deleteAccount } = useAuth();
  const navigation = useNavigation();

  const handleChangePassword = () => {
    if (!user?.email) {
      Alert.alert('خطأ', 'لا يمكن العثور على البريد الإلكتروني');
      return;
    }

    Alert.alert(
      'تغيير كلمة المرور',
      `سيتم إرسال رابط تغيير كلمة المرور إلى بريدك الإلكتروني:\n${user.email}`,
      [
        { text: 'إلغاء', style: 'cancel' },
        { 
          text: 'إرسال', 
          onPress: async () => {
            try {
              const success = await resetPassword(user.email);
              if (success) {
                Alert.alert('نجح', 'تم إرسال رابط تغيير كلمة المرور إلى بريدك الإلكتروني');
              } else {
                Alert.alert(
                  'خطأ', 
                  'فشل في إرسال رابط تغيير كلمة المرور. يرجى المحاولة مرة أخرى بعد 30 ثانية أو التحقق من صحة البريد الإلكتروني.'
                );
              }
            } catch (error) {
              console.error('Password reset error:', error);
              Alert.alert(
                'خطأ', 
                'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى لاحقاً.'
              );
            }
          }
        },
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert(
      'تسجيل الخروج',
      'هل أنت متأكد من تسجيل الخروج؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'تسجيل الخروج',
          style: 'destructive',
          onPress: async () => {
            await logout();
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'حذف الحساب',
      'هل أنت متأكد من حذف حسابك نهائياً؟\n\nسيتم حذف جميع بياناتك من قاعدة البيانات ولا يمكن التراجع عن هذا الإجراء.',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'حذف نهائياً',
          style: 'destructive',
          onPress: async () => {
            try {
              const success = await deleteAccount();
              if (success) {
                Alert.alert(
                  'تم حذف الحساب',
                  'تم حذف حسابك وبياناتك بنجاح من قاعدة البيانات.',
                  [{ text: 'موافق', onPress: () => {} }]
                );
              } else {
                Alert.alert(
                  'خطأ',
                  'حدث خطأ أثناء حذف الحساب. يرجى المحاولة مرة أخرى.',
                  [{ text: 'موافق', onPress: () => {} }]
                );
              }
            } catch (error) {
              console.error('Delete account error:', error);
              Alert.alert(
                'خطأ',
                'حدث خطأ غير متوقع أثناء حذف الحساب.',
                [{ text: 'موافق', onPress: () => {} }]
              );
            }
          },
        },
      ]
    );
  };

  const handleLanguageSettings = () => {
    Alert.alert(
      'إعدادات اللغة',
      'اللغة الحالية: العربية\n\nيمكنك تغيير اللغة من إعدادات النظام.',
      [
        { text: 'موافق', onPress: () => {} },
      ]
    );
  };



  const renderSettingItem = (
    title: string,
    description: string,
    icon: keyof typeof Ionicons.glyphMap,
    onPress?: () => void,
    rightElement?: React.ReactNode
  ) => (
    <TouchableOpacity
      style={styles.settingItem}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.settingLeft}>
        <View style={[styles.settingIcon, { backgroundColor: theme.colors.primary }]}>
          <Ionicons name={icon} size={20} color="#ffffff" />
        </View>
        <View style={styles.settingText}>
          <Text style={[styles.settingTitle, { color: theme.colors.text }]}>
            {title}
          </Text>
          <Text style={[styles.settingDescription, { color: theme.colors.textSecondary }]}>
            {description}
          </Text>
        </View>
      </View>
      {rightElement || (
        <Ionicons
          name="chevron-forward"
          size={20}
          color={theme.colors.textSecondary}
        />
      )}
    </TouchableOpacity>
  );

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.scrollContent}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          الإعدادات
        </Text>
      </View>

      <View style={styles.content}>
        <Card style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            المظهر
          </Text>
          {renderSettingItem(
            'الوضع الليلي',
            'التبديل بين الوضع الفاتح والداكن',
            'moon',
            undefined,
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
              thumbColor={isDark ? '#ffffff' : '#f4f3f4'}
            />
          )}
        </Card>

        <Card style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            الحساب
          </Text>
          {user && (
            <TouchableOpacity 
              style={styles.userInfo}
              onPress={() => navigation.navigate('EditProfile' as never)}
            >
              <View style={[styles.userIcon, { backgroundColor: theme.colors.primary }]}>
                <Ionicons name="person" size={24} color="#ffffff" />
              </View>
              <View style={styles.userDetails}>
                <Text style={[styles.userName, { color: theme.colors.text }]}>
                  {user.name}
                </Text>
                <Text style={[styles.userEmail, { color: theme.colors.textSecondary }]}>
                  {user.email}
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={theme.colors.textSecondary}
              />
            </TouchableOpacity>
          )}
          {renderSettingItem(
            'تغيير كلمة المرور',
            'تحديث كلمة المرور الخاصة بك',
            'key',
            handleChangePassword
          )}
          {renderSettingItem(
            'تسجيل الخروج',
            'الخروج من حسابك',
            'log-out',
            handleLogout
          )}
          {renderSettingItem(
            'حذف الحساب',
            'حذف حسابك نهائياً',
            'trash',
            handleDeleteAccount
          )}
        </Card>


        <Card style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            اللغة
          </Text>
          {renderSettingItem(
            'اللغة',
            'العربية',
            'language',
            handleLanguageSettings
          )}
        </Card>


        <Card style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            أدوات المطور
          </Text>
          {renderSettingItem(
            'اختبار الجداول',
            'اختبار قدرة النظام على تحليل الجداول',
            'document-text',
            () => navigation.navigate('TimetableTest' as never)
          )}
          {renderSettingItem(
            'اختبار الإشعارات',
            'اختبار نظام الإشعارات المحلية',
            'notifications',
            () => navigation.navigate('NotificationTest' as never)
          )}
          {renderSettingItem(
            'اختبار الواتساب',
            'اختبار إرسال رسائل الواتساب',
            'chatbubbles',
            () => navigation.navigate('WhatsAppTest' as never)
          )}
        </Card>

        <Card style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            حول التطبيق
          </Text>
          {renderSettingItem(
            'اسم التطبيق',
            'learnz | ليرنز',
            'information-circle',
            undefined,
            <Text style={[styles.versionText, { color: theme.colors.textSecondary }]}>
              learnz | ليرنز
            </Text>
          )}
          {renderSettingItem(
            'إصدار التطبيق',
            '1.0.0',
            'information-circle',
            undefined,
            <Text style={[styles.versionText, { color: theme.colors.textSecondary }]}>
              1.0.0
            </Text>
          )}
        </Card>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: theme.colors.textSecondary }]}>
            learnz | ليرنز
          </Text>
          <Text style={[styles.footerText, { color: theme.colors.textSecondary }]}>
            صُنع بـ ❤️ للطلاب
          </Text>
          <Text style={[styles.footerText, { color: theme.colors.textSecondary }]}>
            v1.0.0
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
    paddingBottom: 120, // مساحة كافية لشريط التنقل السفلي
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
    paddingHorizontal: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 14,
  },
  versionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  footerText: {
    fontSize: 14,
    marginBottom: 4,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    marginBottom: 8,
  },
  userIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 14,
  },
});

export default SettingsScreen;
