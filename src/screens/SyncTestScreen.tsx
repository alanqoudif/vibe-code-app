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
import Button from '../components/Button';
import Card from '../components/Card';

const SyncTestScreen: React.FC = () => {
  const { theme } = useTheme();
  const { user, isAuthenticated } = useAuth();
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const addResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`]);
  };

  const clearResults = () => {
    setTestResults([]);
  };

  const testDataSync = async () => {
    if (!isAuthenticated || !user) {
      addResult('❌ User not authenticated');
      return;
    }

    setIsLoading(true);
    addResult('🔄 Starting data synchronization test...');

    try {
      // Test 1: Manual sync
      addResult('🔄 Testing manual sync...');
      const syncResult = await DatabaseService.manualSync(user.id);
      if (syncResult.success) {
        addResult(`✅ Manual sync successful: ${syncResult.events.length} events found`);
        
        // Display sample events
        if (syncResult.events.length > 0) {
          addResult('📋 Sample events from manual sync:');
          syncResult.events.slice(0, 5).forEach((event, index) => {
            addResult(`  ${index + 1}. ${event.name} - ${event.time} - Days: ${event.days?.join(', ') || 'None'}`);
          });
        }
      } else {
        addResult(`❌ Manual sync failed: ${syncResult.error}`);
      }

      // Test 2: Regular getEvents
      addResult('📊 Testing regular getEvents...');
      const events = await DatabaseService.getEvents(user.id);
      addResult(`✅ Regular getEvents found ${events.length} events`);

      // Test 3: Test real-time connection
      addResult('🔗 Testing real-time connection...');
      const isConnected = await DatabaseService.testRealtimeConnection();
      if (isConnected) {
        addResult('✅ Real-time connection is working');
      } else {
        addResult('❌ Real-time connection failed');
      }

      // Test 4: Test debug sync status
      addResult('🔍 Testing debug sync status...');
      const syncStatus = await DatabaseService.debugSyncStatus(user.id);
      addResult(`📊 Sync Status: ${syncStatus.realtimeStatus}`);
      addResult(`📊 Event Count: ${syncStatus.eventCount}`);
      addResult(`📊 Is Connected: ${syncStatus.isConnected}`);

      addResult('🎉 Data synchronization test completed!');

    } catch (error) {
      addResult(`❌ Error during sync test: ${error}`);
      console.error('Sync test error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const testCreateSampleEvent = async () => {
    if (!isAuthenticated || !user) {
      addResult('❌ User not authenticated');
      return;
    }

    setIsLoading(true);
    addResult('🔄 Creating sample event...');

    try {
      const sampleEvent = {
        id: `sync-test-${Date.now()}`,
        name: 'Test Sync Event',
        time: '10:00 AM',
        days: ['Monday', 'Wednesday'],
        location: 'Test Room',
        recurring: true,
        reminders: ['15 minutes before'],
        repetitionInterval: 1,
      };

      const createdEvent = await DatabaseService.createEvent(user.id, sampleEvent);
      addResult(`✅ Sample event created: ${createdEvent.name}`);

      // Wait a moment for real-time sync
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Verify the event was created
      const events = await DatabaseService.getEvents(user.id);
      const foundEvent = events.find(e => e.id === createdEvent.id);
      if (foundEvent) {
        addResult('✅ Sample event found in database after creation');
      } else {
        addResult('❌ Sample event not found in database after creation');
      }

    } catch (error) {
      addResult(`❌ Error creating sample event: ${error}`);
      console.error('Sample event creation error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const testDeleteSampleEvents = async () => {
    if (!isAuthenticated || !user) {
      addResult('❌ User not authenticated');
      return;
    }

    setIsLoading(true);
    addResult('🔄 Deleting sample events...');

    try {
      const events = await DatabaseService.getEvents(user.id);
      const sampleEvents = events.filter(e => e.name.includes('Test Sync Event'));
      
      addResult(`🗑️ Found ${sampleEvents.length} sample events to delete`);

      for (const event of sampleEvents) {
        await DatabaseService.deleteEvent(event.id);
        addResult(`✅ Deleted: ${event.name}`);
      }

      addResult('🎉 Sample events cleanup completed!');

    } catch (error) {
      addResult(`❌ Error deleting sample events: ${error}`);
      console.error('Sample event deletion error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Card style={styles.card}>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          Data Synchronization Test
        </Text>
        
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          User: {isAuthenticated ? user?.email : 'Not authenticated'}
        </Text>

        <View style={styles.buttonContainer}>
          <Button
            title="Test Data Sync"
            onPress={testDataSync}
            style={styles.button}
            disabled={isLoading}
          />
          
          <Button
            title="Create Sample Event"
            onPress={testCreateSampleEvent}
            style={styles.button}
            disabled={isLoading}
          />
          
          <Button
            title="Delete Sample Events"
            onPress={testDeleteSampleEvents}
            style={[styles.button, { backgroundColor: theme.colors.error }]}
            disabled={isLoading}
          />
          
          <Button
            title="Clear Results"
            onPress={clearResults}
            style={[styles.button, { backgroundColor: theme.colors.warning }]}
          />
        </View>

        {isLoading && (
          <Text style={[styles.loadingText, { color: theme.colors.primary }]}>
            Loading...
          </Text>
        )}

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
  loadingText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
    fontWeight: '600',
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

export default SyncTestScreen;
