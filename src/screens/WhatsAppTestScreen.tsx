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
import Input from '../components/Input';

const WhatsAppTestScreen: React.FC = () => {
  const { theme } = useTheme();
  const [phoneNumber, setPhoneNumber] = useState('+968');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const sendWhatsAppMessage = async (action: string, customMessage?: string) => {
    if (!phoneNumber.trim()) {
      Alert.alert('خطأ', 'يرجى إدخال رقم الهاتف');
      return;
    }

    setIsLoading(true);
    try {
      let messageToSend = customMessage || message;
      
      if (action === 'send_welcome_message' && !customMessage) {
        messageToSend = `🎉 أهلاً وسهلاً بك في منصة learnz|ليرنز! 

مرحباً! 👋

نحن سعداء لانضمامك إلى مجتمعنا التعليمي! 🌟

📚 مع learnz|ليرنز يمكنك:
• تنظيم جدولك الدراسي بسهولة
• تتبع مهامك ومواعيدك
• الحصول على تذكيرات ذكية
• الاستفادة من المساعد الذكي للدراسة

🚀 ابدأ رحلتك التعليمية الآن!

إذا كان لديك أي استفسارات، لا تتردد في التواصل معنا.

نتمنى لك تجربة تعليمية ممتعة ومفيدة! 📖✨

فريق learnz|ليرنز`;
      }

      if (!messageToSend.trim()) {
        Alert.alert('خطأ', 'يرجى إدخال الرسالة');
        setIsLoading(false);
        return;
      }

      const response = await fetch('https://ymkatahxzfwiyhpzvxts.supabase.co/functions/v1/send-whatsapp-reminder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: action,
          phoneNumber: phoneNumber.trim(),
          message: messageToSend
        })
      });

      const result = await response.json();
      console.log('WhatsApp message result:', result);
      
      if (result.success) {
        Alert.alert('نجح', 'تم إرسال الرسالة بنجاح عبر الواتساب');
      } else {
        Alert.alert('خطأ', `فشل في إرسال الرسالة: ${result.message || 'خطأ غير معروف'}`);
      }
    } catch (error) {
      console.error('Error sending WhatsApp message:', error);
      Alert.alert('خطأ', 'حدث خطأ أثناء إرسال الرسالة');
    } finally {
      setIsLoading(false);
    }
  };

  const testWelcomeMessage = () => {
    Alert.alert(
      'إرسال رسالة ترحيب',
      `هل تريد إرسال رسالة ترحيب إلى ${phoneNumber}؟`,
      [
        { text: 'إلغاء', style: 'cancel' },
        { 
          text: 'إرسال', 
          onPress: () => sendWhatsAppMessage('send_welcome_message')
        }
      ]
    );
  };

  const testCustomMessage = () => {
    if (!message.trim()) {
      Alert.alert('خطأ', 'يرجى إدخال الرسالة أولاً');
      return;
    }
    
    Alert.alert(
      'إرسال رسالة مخصصة',
      `هل تريد إرسال الرسالة إلى ${phoneNumber}؟`,
      [
        { text: 'إلغاء', style: 'cancel' },
        { 
          text: 'إرسال', 
          onPress: () => sendWhatsAppMessage('send_message')
        }
      ]
    );
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          اختبار رسائل الواتساب
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          اختبار إرسال رسائل الواتساب للمستخدمين
        </Text>
      </View>

      <Card style={styles.card}>
        <Text style={[styles.cardTitle, { color: theme.colors.text }]}>
          إعدادات الرسالة
        </Text>
        
        <Input
          label="رقم الهاتف"
          value={phoneNumber}
          onChangeText={setPhoneNumber}
          placeholder="+968XXXXXXXXX"
          leftIcon="call"
          keyboardType="phone-pad"
        />

        <View style={styles.messageContainer}>
          <Text style={[styles.label, { color: theme.colors.text }]}>
            الرسالة المخصصة
          </Text>
          <TextInput
            style={[styles.messageInput, { 
              backgroundColor: theme.colors.surface,
              color: theme.colors.text,
              borderColor: theme.colors.border
            }]}
            value={message}
            onChangeText={setMessage}
            placeholder="اكتب رسالتك هنا..."
            multiline
            numberOfLines={6}
            textAlignVertical="top"
          />
        </View>
      </Card>

      <Card style={styles.card}>
        <Text style={[styles.cardTitle, { color: theme.colors.text }]}>
          اختبارات الرسائل
        </Text>
        
        <Button
          title="إرسال رسالة ترحيب"
          onPress={testWelcomeMessage}
          disabled={isLoading}
          style={styles.button}
        />

        <Button
          title="إرسال رسالة مخصصة"
          onPress={testCustomMessage}
          disabled={isLoading}
          variant="outline"
          style={styles.button}
        />
      </Card>

      <Card style={styles.card}>
        <Text style={[styles.cardTitle, { color: theme.colors.text }]}>
          معلومات مهمة
        </Text>
        <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
          • تأكد من إدخال رقم الهاتف بالصيغة الصحيحة (+968XXXXXXXXX)
        </Text>
        <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
          • الرسالة الترحيبية ترسل تلقائياً للمستخدمين الجدد
        </Text>
        <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
          • يمكنك اختبار الرسائل المخصصة هنا
        </Text>
        <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
          • تأكد من وجود رصيد كافي في حساب الواتساب
        </Text>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
  },
  card: {
    margin: 16,
    marginTop: 0,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  messageContainer: {
    marginTop: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  messageInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 120,
  },
  button: {
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    marginBottom: 8,
    lineHeight: 20,
  },
});

export default WhatsAppTestScreen;
