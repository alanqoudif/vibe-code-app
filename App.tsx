import React from 'react';
import * as Notifications from 'expo-notifications';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ThemeProvider, useTheme } from './src/contexts/ThemeContext';
import { AuthProvider } from './src/contexts/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';
import { NotificationService } from './src/services/NotificationService';

function AppContent() {
  const { isDark } = useTheme();
  React.useEffect(() => {
    // Ask permissions on app start
    NotificationService.requestPermissions();

    // Foreground notifications listener (when app is open)
    const receivedSub = Notifications.addNotificationReceivedListener(() => {
      // No-op: handler is configured in NotificationService to show alerts in foreground
    });

    // User taps on a notification
    const responseSub = Notifications.addNotificationResponseReceivedListener(
      NotificationService.handleNotificationResponse
    );

    return () => {
      receivedSub.remove();
      responseSub.remove();
    };
  }, []);
  
  return (
    <>
      <AppNavigator />
      <StatusBar style={isDark ? 'light' : 'dark'} />
    </>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <AuthProvider>
            <AppContent />
          </AuthProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
