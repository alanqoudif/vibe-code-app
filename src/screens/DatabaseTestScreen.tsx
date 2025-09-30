import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { DatabaseService } from '../services/DatabaseService';
import { StorageService } from '../services/StorageService';
import { RealtimeChannel } from '@supabase/supabase-js';
import Button from '../components/Button';
import Card from '../components/Card';

const DatabaseTestScreen: React.FC = () => {
  const { theme } = useTheme();
  const { user, isAuthenticated } = useAuth();
  const [testResults, setTestResults] = useState<string[]>([]);
  const [realtimeChannel, setRealtimeChannel] = useState<RealtimeChannel | null>(null);
  const [realtimeStatus, setRealtimeStatus] = useState<string>('Not connected');

  const addResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`]);
  };

  const testDatabaseConnection = async () => {
    try {
      addResult('Testing database connection...');
      
      // Test 1: Get current user
      const currentUser = await DatabaseService.getCurrentUser();
      if (currentUser) {
        addResult(`✅ Current user: ${currentUser.email}`);
      } else {
        addResult('❌ No authenticated user - Please login first');
        return;
      }

      // Test 2: Get user profile
      try {
        const profile = await DatabaseService.getProfile(currentUser.id);
        addResult(`✅ Profile loaded: ${profile?.full_name || 'No name set'}`);
      } catch (error) {
        addResult(`⚠️ Profile not found (this is normal for new users)`);
      }

      // Test 3: Get events/classes
      const events = await DatabaseService.getEvents(currentUser.id);
      addResult(`✅ Found ${events.length} events/classes`);

      // Test 4: Test DatabaseService integration
      const classes = await DatabaseService.getEvents(currentUser.id);
      addResult(`✅ DatabaseService returned ${classes.length} classes`);

      addResult('🎉 All tests passed! Database integration is working.');

    } catch (error) {
      addResult(`❌ Error: ${error}`);
      console.error('Database test error:', error);
    }
  };

  const testCreateClass = async () => {
    try {
      if (!isAuthenticated || !user) {
        addResult('❌ User not authenticated');
        return;
      }

      addResult('Testing class creation...');
      
      const testClass = {
        id: `test-${Date.now()}`,
        name: 'Test Class',
        time: '10:00 AM',
        days: ['Monday', 'Wednesday'],
        location: 'Test Room',
        recurring: true,
        reminders: ['15 minutes before'],
        repetitionInterval: 1,
      };

      const createdClass = await DatabaseService.createEvent(user.id, testClass);
      addResult('✅ Test class created successfully');

      // Verify it was created
      const classes = await DatabaseService.getEvents(user.id);
      const foundClass = classes.find(c => c.id === createdClass.id);
      if (foundClass) {
        addResult('✅ Test class found in database');
      } else {
        addResult('❌ Test class not found in database');
      }

    } catch (error) {
      addResult(`❌ Error creating class: ${error}`);
      console.error('Class creation test error:', error);
    }
  };

  const testRealtimeSubscription = async () => {
    try {
      if (!isAuthenticated || !user) {
        addResult('❌ User not authenticated');
        return;
      }

      addResult('Testing real-time subscription...');
      
      // Clean up existing subscription
      if (realtimeChannel) {
        addResult('Cleaning up existing subscription...');
        DatabaseService.unsubscribeFromChannel(realtimeChannel);
        setRealtimeChannel(null);
      }

      // Test the new createRealtimeSubscription method
      const channel = await DatabaseService.createRealtimeSubscription(user.id, (events) => {
        addResult(`📡 Real-time update received: ${events.length} events`);
        setRealtimeStatus('Connected and receiving updates');
      });

      if (channel) {
        setRealtimeChannel(channel);
        setRealtimeStatus('Connected');
        addResult('✅ Real-time subscription created successfully');
        
        // Test the original method as well
        setTimeout(async () => {
          try {
            const originalChannel = DatabaseService.subscribeToEvents(user.id, (events) => {
              addResult(`📡 Original method update: ${events.length} events`);
            });
            addResult('✅ Original subscription method also works');
          } catch (error) {
            addResult(`❌ Original method failed: ${error}`);
          }
        }, 2000);
      } else {
        addResult('❌ Failed to create real-time subscription');
        setRealtimeStatus('Failed to connect');
      }

    } catch (error) {
      addResult(`❌ Error testing real-time: ${error}`);
      console.error('Real-time test error:', error);
    }
  };

  const testRealtimeConnection = async () => {
    try {
      addResult('Testing real-time connection status...');
      
      const isConnected = await DatabaseService.testRealtimeConnection();
      if (isConnected) {
        addResult('✅ Real-time connection test passed');
      } else {
        addResult('❌ Real-time connection test failed');
      }

      // Test debug sync status
      if (isAuthenticated && user) {
        const debugStatus = await DatabaseService.debugSyncStatus(user.id);
        addResult(`Debug status - Connected: ${debugStatus.isConnected}, Events: ${debugStatus.eventCount}, Status: ${debugStatus.realtimeStatus}`);
      }

    } catch (error) {
      addResult(`❌ Error testing connection: ${error}`);
    }
  };

  const stopRealtimeSubscription = () => {
    if (realtimeChannel) {
      addResult('Stopping real-time subscription...');
      DatabaseService.unsubscribeFromChannel(realtimeChannel);
      setRealtimeChannel(null);
      setRealtimeStatus('Disconnected');
      addResult('✅ Real-time subscription stopped');
    } else {
      addResult('No active subscription to stop');
    }
  };

  const clearResults = () => {
    setTestResults([]);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (realtimeChannel) {
        DatabaseService.unsubscribeFromChannel(realtimeChannel);
      }
    };
  }, [realtimeChannel]);

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Card style={styles.card}>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          Database Integration Test
        </Text>
        
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          User: {isAuthenticated ? user?.email : 'Not authenticated'}
        </Text>

        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          Real-time Status: {realtimeStatus}
        </Text>

        <View style={styles.buttonContainer}>
          <Button
            title="Test Database Connection"
            onPress={testDatabaseConnection}
            style={styles.button}
          />
          
          <Button
            title="Test Create Class"
            onPress={testCreateClass}
            style={styles.button}
          />

          <Button
            title="Test Real-time Connection"
            onPress={testRealtimeConnection}
            style={styles.button}
          />

          <Button
            title="Test Real-time Subscription"
            onPress={testRealtimeSubscription}
            style={styles.button}
          />

          <Button
            title="Stop Real-time Subscription"
            onPress={stopRealtimeSubscription}
            style={[styles.button, { backgroundColor: theme.colors.warning }]}
          />
          
          <Button
            title="Clear Results"
            onPress={clearResults}
            style={[styles.button, { backgroundColor: theme.colors.error }]}
          />
        </View>

        <View style={styles.resultsContainer}>
          <Text style={[styles.resultsTitle, { color: theme.colors.text }]}>
            Test Results:
          </Text>
          {testResults.map((result, index) => (
            <Text
              key={index}
              style={[
                styles.result,
                { 
                  color: result.includes('✅') ? theme.colors.success : 
                         result.includes('❌') ? theme.colors.error :
                         result.includes('⚠️') ? theme.colors.warning :
                         theme.colors.textSecondary 
                }
              ]}
            >
              {result}
            </Text>
          ))}
        </View>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  card: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  buttonContainer: {
    gap: 12,
    marginBottom: 20,
  },
  button: {
    marginVertical: 4,
  },
  resultsContainer: {
    marginTop: 20,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  result: {
    fontSize: 14,
    marginBottom: 4,
    fontFamily: 'monospace',
  },
});

export default DatabaseTestScreen;
