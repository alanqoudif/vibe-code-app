import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Platform, View, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';

// Import screens
import CalendarScreen from '../screens/CalendarScreen';
import TasksScreen from '../screens/TasksScreen';
import StudyBotScreen from '../screens/StudyBotScreen';
import SettingsScreen from '../screens/SettingsScreen';
import TimetableUploadScreen from '../screens/TimetableUploadScreen';
import AddClassScreen from '../screens/AddClassScreen';
import WelcomeScreen from '../screens/WelcomeScreen';
import LoginScreen from '../screens/LoginScreen';
import SignupScreen from '../screens/SignupScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import ResetPasswordScreen from '../screens/ResetPasswordScreen';
import EmailDiagnosticScreen from '../screens/EmailDiagnosticScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import DatabaseTestScreen from '../screens/DatabaseTestScreen';
import SyncTestScreen from '../screens/SyncTestScreen';
import TimetableTestScreen from '../screens/TimetableTestScreen';
import NotificationTestScreen from '../screens/NotificationTestScreen';
import WhatsAppTestScreen from '../screens/WhatsAppTestScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const MainTabs = () => {
  const { theme } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'Calendar') {
            iconName = focused ? 'calendar' : 'calendar-outline';
          } else if (route.name === 'Tasks') {
            iconName = focused ? 'checkmark-circle' : 'checkmark-circle-outline';
          } else if (route.name === 'StudyBot') {
            iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
          } else if (route.name === 'Settings') {
            iconName = focused ? 'settings' : 'settings-outline';
          } else {
            iconName = 'help-outline';
          }

          return <Ionicons name={iconName} size={focused ? 26 : 22} color={color} />;
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 4,
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textSecondary + '80',
        tabBarShowLabel: true,
        tabBarItemStyle: {
          paddingVertical: 4,
        },
        tabBarStyle: {
          backgroundColor: 'transparent',
          borderTopColor: 'transparent',
          borderTopWidth: 0,
          paddingBottom: Platform.OS === 'ios' ? 20 : 12,
          paddingTop: 12,
          paddingHorizontal: 20,
          height: Platform.OS === 'ios' ? 85 : 75,
          marginHorizontal: 20,
          marginBottom: Platform.OS === 'ios' ? 25 : 20,
          borderRadius: 25,
          shadowColor: theme.colors.text,
          shadowOffset: {
            width: 0,
            height: 8,
          },
          shadowOpacity: 0.12,
          shadowRadius: 20,
          elevation: 15,
          position: 'absolute',
          borderWidth: 1,
          borderColor: theme.colors.border + '30',
        },
        tabBarBackground: () => (
          <LinearGradient
            colors={[
              theme.colors.surface + 'F0',
              theme.colors.surface + 'E0',
              theme.colors.surface + 'D0'
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              flex: 1,
              borderRadius: 25,
              borderWidth: 1,
              borderColor: theme.colors.border + '30',
            }}
          />
        ),
        headerStyle: {
          backgroundColor: theme.colors.surface,
          borderBottomColor: theme.colors.border,
        },
        headerTintColor: theme.colors.text,
        headerTitleStyle: {
          fontWeight: '600',
        },
      })}
    >
      <Tab.Screen name="Calendar" component={CalendarScreen} options={{ title: 'الرئيسية' }} />
      <Tab.Screen name="Tasks" component={TasksScreen} options={{ title: 'المهام' }} />
      <Tab.Screen name="StudyBot" component={StudyBotScreen} options={{ title: 'المساعد' }} />
      <Tab.Screen name="Settings" component={SettingsScreen} options={{ title: 'الإعدادات' }} />
    </Tab.Navigator>
  );
};

const AuthStack = () => {
  const { theme } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Signup" component={SignupScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
    </Stack.Navigator>
  );
};

const AppNavigator = () => {
  const { theme } = useTheme();
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center', 
        backgroundColor: theme.colors.background 
      }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: theme.colors.surface,
            borderBottomColor: theme.colors.border,
          },
          headerTintColor: theme.colors.text,
          headerTitleStyle: {
            fontWeight: '600',
          },
        }}
      >
        {isAuthenticated ? (
          <>
            <Stack.Screen 
              name="MainTabs" 
              component={MainTabs} 
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="TimetableUpload" 
              component={TimetableUploadScreen}
              options={{ title: 'رفع الجدول' }}
            />
            <Stack.Screen 
              name="AddClass" 
              component={AddClassScreen}
              options={{ title: 'إضافة حصة' }}
            />
            <Stack.Screen 
              name="EditProfile" 
              component={EditProfileScreen}
              options={{ title: 'تعديل الملف الشخصي' }}
            />
            <Stack.Screen 
              name="EmailDiagnostic" 
              component={EmailDiagnosticScreen}
              options={{ title: 'تشخيص البريد الإلكتروني' }}
            />
            <Stack.Screen 
              name="DatabaseTest" 
              component={DatabaseTestScreen}
              options={{ title: 'اختبار قاعدة البيانات' }}
            />
            <Stack.Screen 
              name="SyncTest" 
              component={SyncTestScreen}
              options={{ title: 'اختبار المزامنة' }}
            />
            <Stack.Screen 
              name="TimetableTest" 
              component={TimetableTestScreen}
              options={{ title: 'اختبار الجداول' }}
            />
            <Stack.Screen 
              name="NotificationTest" 
              component={NotificationTestScreen}
              options={{ title: 'اختبار الإشعارات' }}
            />
            <Stack.Screen 
              name="WhatsAppTest" 
              component={WhatsAppTestScreen}
              options={{ title: 'اختبار الواتساب' }}
            />
          </>
        ) : (
          <Stack.Screen 
            name="Auth" 
            component={AuthStack} 
            options={{ headerShown: false }}
          />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
