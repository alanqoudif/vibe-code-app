import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { EnhancedAIService } from '../services/EnhancedAIService';
import { TimetableAIService } from '../services/TimetableAIService';
import { DatabaseService } from '../services/DatabaseService';
import Card from '../components/Card';
import Button from '../components/Button';

interface ChatMessage {
  id: string;
  text: string;
  isBot: boolean;
  timestamp: Date;
}

const StudyBotScreen: React.FC = () => {
  const { theme } = useTheme();
  const { isAuthenticated, user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [userClasses, setUserClasses] = useState<any[]>([]);
  const scrollViewRef = useRef<ScrollView>(null);
  const inputRef = useRef<TextInput>(null);
  const dotAnimations = useRef([
    new Animated.Value(0.3),
    new Animated.Value(0.3),
    new Animated.Value(0.3),
  ]).current;

  // Load user classes for AI context
  const loadUserClasses = async () => {
    if (isAuthenticated && user) {
      try {
        const classes = await DatabaseService.getEvents(user.id);
        setUserClasses(classes);
        console.log(`📚 Loaded ${classes.length} classes for AI context`);
      } catch (error) {
        console.error('Error loading user classes:', error);
      }
    }
  };

  useEffect(() => {
    // Load user classes
    loadUserClasses();

    // Welcome message
    const welcomeMessage: ChatMessage = {
      id: '1',
      text: "مرحباً! أنا مساعد learnz | ليرنز الذكي الخاص بك. أنا هنا لمساعدتك في نصائح الدراسة والتحفيز والمشورة الأكاديمية. ماذا تريد أن تعرف؟\n\n💡 يمكنني مساعدتك في:\n📚 نصائح الدراسة والتعلم\n⏰ إدارة الوقت والتنظيم\n💪 التحفيز والدافعية\n📝 التحضير للامتحانات\n😌 التعامل مع التوتر\n📅 مساعدة في جدولك الدراسي",
      isBot: true,
      timestamp: new Date(),
    };
    setMessages([welcomeMessage]);

    // Keyboard event listeners for smooth animation
    const keyboardWillShowListener = Keyboard.addListener('keyboardWillShow', (e) => {
      setKeyboardHeight(e.endCoordinates.height);
    });

    const keyboardWillHideListener = Keyboard.addListener('keyboardWillHide', () => {
      setKeyboardHeight(0);
    });

    return () => {
      keyboardWillShowListener.remove();
      keyboardWillHideListener.remove();
    };
  }, []);

  // Typing animation effect
  useEffect(() => {
    if (isTyping) {
      const animateDots = () => {
        const animations = dotAnimations.map((dot, index) => 
          Animated.sequence([
            Animated.timing(dot, {
              toValue: 1,
              duration: 600,
              useNativeDriver: true,
            }),
            Animated.timing(dot, {
              toValue: 0.3,
              duration: 600,
              useNativeDriver: true,
            }),
          ])
        );

        Animated.stagger(200, animations).start(() => {
          if (isTyping) {
            animateDots();
          }
        });
      };
      animateDots();
    } else {
      dotAnimations.forEach(dot => dot.setValue(0.3));
    }
  }, [isTyping, dotAnimations]);

  // If user is not authenticated, don't show any data
  if (!isAuthenticated) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.centerContent}>
          <Ionicons name="lock-closed" size={64} color={theme.colors.textSecondary} />
          <Text style={[styles.lockMessage, { color: theme.colors.textSecondary }]}>
            learnz | ليرنز
          </Text>
          <Text style={[styles.lockMessage, { color: theme.colors.textSecondary }]}>
            يرجى تسجيل الدخول لعرض البيانات
          </Text>
        </View>
      </View>
    );
  }

  const sendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: inputText,
      isBot: false,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = inputText;
    setInputText('');
    setIsTyping(true);

    // Scroll to bottom when new message is added
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);

    try {
      // Convert messages to conversation history
      const conversationHistory = messages.map(msg => ({
        role: msg.isBot ? 'assistant' as const : 'user' as const,
        content: msg.text,
        timestamp: msg.timestamp.toISOString()
      }));

      // Check if the query is timetable-related
      const isTimetableQuery = currentInput.toLowerCase().includes('جدول') || 
                              currentInput.toLowerCase().includes('حصص') ||
                              currentInput.toLowerCase().includes('محاضرات') ||
                              currentInput.toLowerCase().includes('اليوم') ||
                              currentInput.toLowerCase().includes('غداً') ||
                              currentInput.toLowerCase().includes('أسبوع');

      let aiResponse;

      if (isTimetableQuery && userClasses.length > 0) {
        // Use TimetableAIService for timetable-related queries
        console.log('📅 Timetable query detected, using TimetableAIService');
        const timetableResponse = await TimetableAIService.filterTimetableByQuery({
          query: currentInput,
          userId: user?.id,
          classes: userClasses,
          currentDate: new Date().toISOString().split('T')[0]
        });

        if (timetableResponse.success) {
          let responseText = '';
          if (timetableResponse.filteredClasses.length > 0) {
            responseText = `📅 وجدت ${timetableResponse.filteredClasses.length} حصة مطابقة لاستفسارك:\n\n`;
            timetableResponse.filteredClasses.forEach((cls, index) => {
              responseText += `${index + 1}. ${cls.name}\n`;
              responseText += `   ⏰ الوقت: ${cls.time}\n`;
              responseText += `   📅 الأيام: ${cls.days ? cls.days.join(', ') : 'غير محدد'}\n`;
              if (cls.location) {
                responseText += `   📍 المكان: ${cls.location}\n`;
              }
              responseText += '\n';
            });
          } else {
            responseText = 'لم أجد حصص مطابقة لاستفسارك. هل تريد البحث بطريقة أخرى؟';
          }

          if (timetableResponse.suggestions.length > 0) {
            responseText += '\n💡 اقتراحات:\n';
            timetableResponse.suggestions.forEach(suggestion => {
              responseText += `• ${suggestion}\n`;
            });
          }

          aiResponse = {
            message: responseText,
            success: true
          };
        } else {
          // Fallback to regular AI service
          aiResponse = await EnhancedAIService.sendMessage({
            message: currentInput,
            userId: user?.id || 'anonymous',
            conversationHistory
          });
        }
      } else {
        // Use EnhancedAIService for general queries
        console.log('🤖 General query, using EnhancedAIService');
        aiResponse = await EnhancedAIService.sendMessage({
          message: currentInput,
          userId: user?.id || 'anonymous',
          conversationHistory
        });
      }
      
      console.log('📥 AI Response received:', aiResponse);
      
      const botMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: aiResponse.message,
        isBot: true,
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, botMessage]);
      setIsTyping(false);

      // Scroll to bottom after bot response
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);

    } catch (error) {
      console.error('❌ AI Service Error:', error);
      
      // Show more specific error message based on error type
      let errorText = 'عذراً، حدث خطأ في الاتصال بالمساعد الذكي. يرجى المحاولة مرة أخرى.';
      
      if (error instanceof Error) {
        if (error.message.includes('API key')) {
          errorText = 'مشكلة في مفتاح API. يرجى التحقق من الإعدادات.';
        } else if (error.message.includes('rate limit')) {
          errorText = 'تم تجاوز الحد المسموح من الطلبات. يرجى المحاولة لاحقاً.';
        } else if (error.message.includes('network')) {
          errorText = 'مشكلة في الاتصال بالإنترنت. يرجى التحقق من الاتصال.';
        }
      }
      
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: errorText,
        isBot: true,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
      setIsTyping(false);

      // Scroll to bottom after error message
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };



  const renderMessage = ({ item }: { item: ChatMessage }) => (
    <View
      style={[
        styles.messageContainer,
        item.isBot ? styles.botMessage : styles.userMessage,
      ]}
    >
      <View
        style={[
          styles.messageBubble,
          {
            backgroundColor: item.isBot ? theme.colors.surface : theme.colors.primary,
          },
        ]}
      >
        <Text
          style={[
            styles.messageText,
            {
              color: item.isBot ? theme.colors.text : '#ffffff',
              textAlign: 'right',
            },
          ]}
        >
          {item.text}
        </Text>
        <Text
          style={[
            styles.messageTime,
            {
              color: item.isBot ? theme.colors.textSecondary : 'rgba(255,255,255,0.7)',
            },
          ]}
        >
          {item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    </View>
  );


  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          المساعد
        </Text>
      </View>

      <ScrollView 
        ref={scrollViewRef}
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <FlatList
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          style={styles.messagesContainer}
          scrollEnabled={false}
        />
        
        {isTyping && (
          <View style={styles.typingContainer}>
            <View style={styles.typingDots}>
              {dotAnimations.map((dot, index) => (
                <Animated.View
                  key={index}
                  style={[
                    styles.dot,
                    {
                      backgroundColor: theme.colors.textSecondary,
                      opacity: dot,
                    },
                  ]}
                />
              ))}
            </View>
            <Text style={[styles.typingText, { color: theme.colors.textSecondary }]}>
              مساعد الدراسة يكتب...
            </Text>
          </View>
        )}
      </ScrollView>

      <View style={[
        styles.inputContainer, 
        { 
          backgroundColor: theme.colors.background,
          paddingBottom: keyboardHeight > 0 ? 20 : 20,
          transform: [{ translateY: keyboardHeight > 0 ? -keyboardHeight + 20 : -90 }]
        }
      ]}>
        <View style={[styles.inputWrapper, { backgroundColor: theme.colors.surface }]}>
          <TextInput
            ref={inputRef}
            style={[
              styles.textInput,
              {
                backgroundColor: 'transparent',
                color: theme.colors.text,
              },
            ]}
            value={inputText}
            onChangeText={setInputText}
            placeholder="اسألني أي شيء عن الدراسة..."
            placeholderTextColor={theme.colors.textSecondary}
            multiline
            maxLength={500}
            onFocus={() => {
              setTimeout(() => {
                scrollViewRef.current?.scrollToEnd({ animated: true });
              }, 100);
            }}
          />
          <TouchableOpacity
            style={[
              styles.sendButton, 
              { 
                backgroundColor: inputText.trim() ? theme.colors.primary : theme.colors.border,
                opacity: inputText.trim() ? 1 : 0.5
              }
            ]}
            onPress={sendMessage}
            disabled={!inputText.trim()}
          >
            <Ionicons name="send" size={20} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  lockMessage: {
    fontSize: 18,
    textAlign: 'center',
    marginTop: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  scrollContent: {
    paddingBottom: 200, // مساحة إضافية لتجنب تداخل النص مع شريط الكتابة
    flexGrow: 1,
  },
  messagesContainer: {
    flex: 1,
    minHeight: 400,
  },
  messageContainer: {
    marginBottom: 12,
  },
  botMessage: {
    alignItems: 'flex-start',
  },
  userMessage: {
    alignItems: 'flex-end',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  messageTime: {
    fontSize: 12,
    marginTop: 4,
  },
  typingContainer: {
    padding: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  typingDots: {
    flexDirection: 'row',
    marginRight: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginHorizontal: 2,
    opacity: 0.7,
  },
  typingText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  inputContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    backgroundColor: 'rgba(255,255,255,0.95)',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 8,
    marginBottom: 10,
  },
  textInput: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 4,
    maxHeight: 100,
    fontSize: 16,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
});

export default StudyBotScreen;
