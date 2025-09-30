import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/Button';
import Input from '../components/Input';

const EditProfileScreen: React.FC = () => {
  const { theme } = useTheme();
  const { user, signup } = useAuth();
  const navigation = useNavigation();
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('خطأ', 'يرجى إدخال الاسم');
      return;
    }
    
    if (!email.trim()) {
      Alert.alert('خطأ', 'يرجى إدخال البريد الإلكتروني');
      return;
    }
    
    if (!email.includes('@')) {
      Alert.alert('خطأ', 'يرجى إدخال بريد إلكتروني صحيح');
      return;
    }

    try {
      setIsLoading(true);
      
      // Update user data
      const updatedUser = {
        ...user!,
        name: name.trim(),
        email: email.trim(),
      };
      
      // Save to storage
      const { StorageService } = await import('../services/StorageService');
      await StorageService.setItem('user', JSON.stringify(updatedUser));
      
      Alert.alert('نجح', 'تم تحديث البيانات بنجاح', [
        { text: 'موافق', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      Alert.alert('خطأ', 'حدث خطأ أثناء تحديث البيانات');
    } finally {
      setIsLoading(false);
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
        
        <Text style={[styles.title, { color: theme.colors.text }]}>
          learnz | ليرنز
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          تعديل الملف الشخصي
        </Text>
      </View>

      <View style={styles.form}>
        <View style={styles.profileIcon}>
          <View style={[styles.iconCircle, { backgroundColor: theme.colors.primary }]}>
            <Ionicons name="person" size={40} color="#ffffff" />
          </View>
        </View>

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

        <Button
          title={isLoading ? "جاري الحفظ..." : "حفظ التغييرات"}
          onPress={handleSave}
          disabled={isLoading}
          style={[styles.saveButton, { backgroundColor: theme.colors.primary }]}
          textStyle={styles.saveButtonText}
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 16,
    marginTop: 4,
    textAlign: 'center',
  },
  form: {
    paddingHorizontal: 20,
    flex: 1,
  },
  profileIcon: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButton: {
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 24,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    color: '#ffffff',
  },
  loadingContainer: {
    alignItems: 'center',
    marginTop: 16,
  },
});

export default EditProfileScreen;
