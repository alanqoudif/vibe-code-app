import { supabase } from '../lib/supabase';
import { Class, User, Task } from '../types';
import { NotificationService } from './NotificationService';
import { RealtimeChannel } from '@supabase/supabase-js';

export class DatabaseService {
  // User/Profile operations
  static async createProfile(userId: string, profileData: {
    fullName?: string;
    phoneNumber: string;
    university?: string;
    major?: string;
    avatarUrl?: string;
  }) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .insert({
          user_id: userId,
          full_name: profileData.fullName,
          phone_number: profileData.phoneNumber,
          university: profileData.university,
          major: profileData.major,
          avatar_url: profileData.avatarUrl,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating profile:', error);
      throw error;
    }
  }

  static async getProfile(userId: string) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting profile:', error);
      throw error;
    }
  }

  static async updateProfile(userId: string, updates: {
    fullName?: string;
    phoneNumber?: string;
    university?: string;
    major?: string;
    avatarUrl?: string;
  }) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          full_name: updates.fullName,
          phone_number: updates.phoneNumber,
          university: updates.university,
          major: updates.major,
          avatar_url: updates.avatarUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  }

  static async deleteUserData(userId: string): Promise<void> {
    try {
      console.log('🗑️ Deleting all user data for:', userId);
      
      // Delete user's events
      const { error: eventsError } = await supabase
        .from('events')
        .delete()
        .eq('user_id', userId);

      if (eventsError) {
        console.error('Error deleting events:', eventsError);
        throw eventsError;
      }

      // Delete user's notifications
      const { error: notificationsError } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', userId);

      if (notificationsError) {
        console.error('Error deleting notifications:', notificationsError);
        throw notificationsError;
      }

      // Delete user's profile
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('user_id', userId);

      if (profileError) {
        console.error('Error deleting profile:', profileError);
        throw profileError;
      }

      console.log('✅ All user data deleted successfully');
    } catch (error) {
      console.error('Error deleting user data:', error);
      throw error;
    }
  }

  // Events/Classes operations
  static async getEvents(userId: string, verbose: boolean = false): Promise<Class[]> {
    try {
      if (verbose) {
        console.log('🔍 Fetching events for user:', userId);
      }
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('user_id', userId)
        .order('event_date', { ascending: true });

      if (error) {
        console.error('❌ Database error:', error);
        throw error;
      }

      if (verbose) {
        console.log(`📊 Found ${data.length} events in database`);
      }

      // Convert database events to Class format
      const classes = data.map(event => {
        // Convert selected_days from database format to Class format
        let days: string[] = [];
        if (event.selected_days && Array.isArray(event.selected_days)) {
          // Handle text[] array directly
          days = event.selected_days;
        } else if (event.selected_days && typeof event.selected_days === 'string') {
          try {
            // Try to parse as JSON first
            const parsed = JSON.parse(event.selected_days);
            if (Array.isArray(parsed)) {
              days = parsed;
            } else if (typeof parsed === 'object' && parsed !== null) {
              // Handle JSON object like {"sunday"} -> convert to array
              days = Object.keys(parsed);
            }
          } catch (e) {
            // If JSON parsing fails, try to split by comma
            try {
              days = event.selected_days.split(',').map(day => day.trim());
            } catch (splitError) {
              if (verbose) {
                console.warn('Failed to parse selected_days:', event.selected_days);
              }
              days = [];
            }
          }
        }
        
        // Normalize day names to proper case (capitalize first letter)
        days = days.map(day => {
          if (typeof day === 'string') {
            const normalizedDay = day.charAt(0).toUpperCase() + day.slice(1).toLowerCase();
            if (verbose) {
              console.log(`📅 Normalizing day: ${day} -> ${normalizedDay}`);
            }
            return normalizedDay;
          }
          return day;
        });

        // Convert time format if needed
        let time = event.event_time || '';
        if (time && !time.includes('AM') && !time.includes('PM')) {
          // Convert 24-hour format to 12-hour format for display
          const [hours, minutes] = time.split(':');
          const hour = parseInt(hours);
          const ampm = hour >= 12 ? 'PM' : 'AM';
          const hour12 = hour % 12 || 12;
          time = `${hour12}:${minutes} ${ampm}`;
        }

        const classData = {
          id: event.id,
          name: event.title,
          time: time,
          days: days,
          location: event.location || undefined,
          recurring: true, // Based on your schema, events seem to be recurring
          reminders: event.reminder_minutes ? [`${event.reminder_minutes} minutes before`] : [],
          repetitionInterval: 1, // Default to weekly
        };

        if (verbose) {
          console.log('📝 Converted event:', {
            id: classData.id,
            name: classData.name,
            time: classData.time,
            days: classData.days,
            location: classData.location
          });
        }

        return classData;
      });

      if (verbose) {
        console.log(`✅ Successfully converted ${classes.length} events to classes`);
      }
      return classes;
    } catch (error) {
      console.error('Error getting events:', error);
      return [];
    }
  }

  static async createEvent(userId: string, classData: Class): Promise<Class> {
    try {
      // Check if user is authenticated before proceeding
      const currentUser = await this.getCurrentUser();
      if (!currentUser) {
        throw new Error('Authentication required: No valid user session found. Please log in to create events.');
      }

      // Verify that the userId matches the current user
      if (currentUser.id !== userId) {
        throw new Error('Authentication error: User ID mismatch. Cannot create event for different user.');
      }

      console.log('💾 Creating event in database:', classData.name);
      
      // Convert time from 12-hour to 24-hour format for database storage
      let eventTime = classData.time;
      if (eventTime && (eventTime.includes('AM') || eventTime.includes('PM'))) {
        const [time, ampm] = eventTime.split(' ');
        const [hours, minutes] = time.split(':');
        let hour24 = parseInt(hours);
        if (ampm === 'PM' && hour24 !== 12) {
          hour24 += 12;
        } else if (ampm === 'AM' && hour24 === 12) {
          hour24 = 0;
        }
        eventTime = `${hour24.toString().padStart(2, '0')}:${minutes}`;
      }
      
      // Convert days to text[] format for database storage (matching actual database schema)
      const daysArray = classData.days.map(day => day.toLowerCase());

      const { data, error } = await supabase
        .from('events')
        .insert({
          user_id: userId,
          title: classData.name,
          description: '',
          event_date: new Date().toISOString().split('T')[0], // Today's date as default
          event_time: eventTime,
          location: classData.location,
          selected_days: daysArray, // Store as text[] array to match database schema
          event_type: 'lecture',
          reminder_minutes: 15, // Default reminder
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Database error creating event:', error);
        throw error;
      }

      console.log('✅ Event created successfully:', data.id);
      
      // Return the created class with the database ID
      const createdClass = {
        ...classData,
        id: data.id,
      };
      
      // Auto-schedule notifications for the new class
      try {
        console.log('🔔 Auto-scheduling notifications for new class:', createdClass.name);
        await NotificationService.autoScheduleClassReminders([createdClass]);
      } catch (notificationError) {
        console.error('❌ Error auto-scheduling notifications:', notificationError);
        // Don't throw error - class creation should still succeed even if notifications fail
      }
      
      // Trigger a manual refresh to ensure UI is updated immediately
      // This helps with synchronization issues
      setTimeout(async () => {
        try {
          await this.forceRefreshEvents(userId);
        } catch (refreshError) {
          console.error('Error in post-create refresh:', refreshError);
        }
      }, 500);

      return createdClass;
    } catch (error) {
      console.error('Error creating event:', error);
      throw error;
    }
  }

  static async updateEvent(eventId: string, updates: Partial<Class>): Promise<void> {
    try {
      // Check if user is authenticated before proceeding
      const currentUser = await this.getCurrentUser();
      if (!currentUser) {
        throw new Error('Authentication required: No valid user session found. Please log in to update events.');
      }

      console.log('📝 Updating event in database:', eventId);
      
      const updateData: any = {};
      
      if (updates.name) updateData.title = updates.name;
      if (updates.time) {
        // Convert time from 12-hour to 24-hour format for database storage
        let eventTime = updates.time;
        if (eventTime && (eventTime.includes('AM') || eventTime.includes('PM'))) {
          const [time, ampm] = eventTime.split(' ');
          const [hours, minutes] = time.split(':');
          let hour24 = parseInt(hours);
          if (ampm === 'PM' && hour24 !== 12) {
            hour24 += 12;
          } else if (ampm === 'AM' && hour24 === 12) {
            hour24 = 0;
          }
          eventTime = `${hour24.toString().padStart(2, '0')}:${minutes}`;
        }
        updateData.event_time = eventTime;
      }
      if (updates.location) updateData.location = updates.location;
      if (updates.days) {
        // Convert days to text[] format for database storage (matching actual database schema)
        const daysArray = updates.days.map(day => day.toLowerCase());
        updateData.selected_days = daysArray;
      }
      
      updateData.updated_at = new Date().toISOString();

      const { error } = await supabase
        .from('events')
        .update(updateData)
        .eq('id', eventId)
        .eq('user_id', currentUser.id); // Ensure user can only update their own events

      if (error) {
        console.error('❌ Database error updating event:', error);
        throw error;
      }

      console.log('✅ Event updated successfully:', eventId);
      
      // Auto-schedule notifications for the updated class
      try {
        console.log('🔔 Auto-scheduling notifications for updated class');
        // Get all classes to reschedule all notifications
        const allClasses = await this.getEvents(currentUser.id);
        await NotificationService.autoScheduleClassReminders(allClasses);
      } catch (notificationError) {
        console.error('❌ Error auto-scheduling notifications after update:', notificationError);
        // Don't throw error - class update should still succeed even if notifications fail
      }
      
      // Trigger a manual refresh to ensure UI is updated immediately
      setTimeout(async () => {
        try {
          await this.forceRefreshEvents(currentUser.id);
        } catch (refreshError) {
          console.error('Error in post-update refresh:', refreshError);
        }
      }, 500);
    } catch (error) {
      console.error('Error updating event:', error);
      throw error;
    }
  }

  static async deleteEvent(eventId: string): Promise<void> {
    try {
      // Check if user is authenticated before proceeding
      const currentUser = await this.getCurrentUser();
      if (!currentUser) {
        throw new Error('Authentication required: No valid user session found. Please log in to delete events.');
      }

      console.log('🗑️ Deleting event from database:', eventId);
      
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', eventId)
        .eq('user_id', currentUser.id); // Ensure user can only delete their own events

      if (error) {
        console.error('❌ Database error deleting event:', error);
        throw error;
      }

      console.log('✅ Event deleted successfully:', eventId);
      
      // Trigger a manual refresh to ensure UI is updated immediately
      setTimeout(async () => {
        try {
          await this.forceRefreshEvents(currentUser.id);
        } catch (refreshError) {
          console.error('Error in post-delete refresh:', refreshError);
        }
      }, 500);
    } catch (error) {
      console.error('Error deleting event:', error);
      throw error;
    }
  }

  // Notifications operations
  static async getNotifications(userId: string) {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting notifications:', error);
      return [];
    }
  }

  static async createNotification(userId: string, notification: {
    title: string;
    message: string;
    type?: string;
  }) {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          title: notification.title,
          message: notification.message,
          type: notification.type || 'general',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  static async markNotificationAsRead(notificationId: string) {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true, updated_at: new Date().toISOString() })
        .eq('id', notificationId);

      if (error) throw error;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  // Helper method to get current user
  static async getCurrentUser() {
    try {
      // First check if there's an active session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Session error:', sessionError);
        return null;
      }
      
      if (!session) {
        // No active session, return null silently
        return null;
      }
      
      // Return the user from the session
      return session.user;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  // Real-time subscriptions for automatic data synchronization
  static subscribeToEvents(userId: string, onDataChange: (events: Class[]) => void): RealtimeChannel {
    console.log('🔄 Setting up real-time subscription for events for user:', userId);
    
    try {
      // Create a simple channel with minimal configuration
      const channel = supabase
        .channel(`events_changes_${userId}`)
        .on(
          'postgres_changes',
          {
            event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
            schema: 'public',
            table: 'events',
            filter: `user_id=eq.${userId}`
          },
          async (payload) => {
            console.log('📡 Real-time event received:', payload.eventType, 'for user:', userId);
            
            try {
              // Add a small delay to ensure database consistency
              await new Promise(resolve => setTimeout(resolve, 500));
              
              // Refresh events data when changes occur
              const events = await this.getEvents(userId, false); // Silent refresh for real-time updates
              console.log(`📡 Refreshed ${events.length} events after real-time update`);
              onDataChange(events);
            } catch (error) {
              console.error('Error refreshing events after real-time update:', error);
            }
          }
        )
        .subscribe((status, err) => {
          console.log('📡 Real-time subscription status:', status);
          if (err) {
            console.error('📡 Real-time subscription error details:', err);
          }
          
          if (status === 'SUBSCRIBED') {
            console.log('✅ Real-time subscription active for events');
          } else if (status === 'CHANNEL_ERROR') {
            console.error('❌ Real-time subscription error for events');
          } else if (status === 'TIMED_OUT') {
            console.warn('⚠️ Real-time subscription timed out for events');
          } else if (status === 'CLOSED') {
            console.log('🔌 Real-time subscription closed for events');
          }
        });

      return channel;
    } catch (error) {
      console.error('❌ Error creating real-time subscription:', error);
      // Return a dummy channel to prevent crashes
      return {
        unsubscribe: () => {},
        send: () => {},
        on: () => {},
        subscribe: () => {}
      } as any;
    }
  }

  // Alternative real-time subscription method with better error handling
  static async createRealtimeSubscription(userId: string, onDataChange: (events: Class[]) => void): Promise<RealtimeChannel | null> {
    console.log('🔄 Creating real-time subscription with enhanced error handling');
    
    try {
      // First, ensure we have a valid session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        console.error('❌ No valid session for real-time subscription');
        return null;
      }

      // Create channel with a unique name to avoid conflicts
      const channelName = `events_${userId}_${Date.now()}`;
      console.log('📡 Creating channel:', channelName);
      
      const channel = supabase.channel(channelName);
      
      // Add the postgres changes listener
      channel.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'events',
          filter: `user_id=eq.${userId}`
        },
        async (payload) => {
          console.log('📡 Real-time event received:', payload.eventType);
          try {
            const events = await this.getEvents(userId);
            onDataChange(events);
          } catch (error) {
            console.error('Error in real-time callback:', error);
          }
        }
      );

      // Subscribe with enhanced error handling
      const subscription = channel.subscribe((status, err) => {
        console.log('📡 Subscription status:', status);
        if (err) {
          console.error('📡 Subscription error:', err);
        }
      });

      // Wait a moment to see if subscription is successful
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return channel;
    } catch (error) {
      console.error('❌ Error creating real-time subscription:', error);
      return null;
    }
  }

  static subscribeToNotifications(userId: string, onDataChange: (notifications: any[]) => void): RealtimeChannel {
    console.log('🔄 Setting up real-time subscription for notifications');
    
    const channel = supabase
      .channel(`notifications_changes_${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        async (payload) => {
          console.log('📡 Real-time notification received:', payload.eventType);
          console.log('📡 Notification payload:', payload.new || payload.old);
          
          try {
            // Add a small delay to ensure database consistency
            await new Promise(resolve => setTimeout(resolve, 200));
            
            // Refresh notifications data when changes occur
            const notifications = await this.getNotifications(userId);
            onDataChange(notifications);
          } catch (error) {
            console.error('Error refreshing notifications after real-time update:', error);
            // Try to refresh again after a longer delay
            setTimeout(async () => {
              try {
                const notifications = await this.getNotifications(userId);
                onDataChange(notifications);
              } catch (retryError) {
                console.error('Error on retry refresh notifications:', retryError);
              }
            }, 2000);
          }
        }
      )
      .subscribe((status, err) => {
        console.log('📡 Real-time notifications subscription status:', status);
        if (err) {
          console.error('📡 Real-time notifications subscription error details:', err);
        }
        
        if (status === 'SUBSCRIBED') {
          console.log('✅ Real-time subscription active for notifications');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Real-time subscription error for notifications');
          // Try to reconnect after a delay
          setTimeout(() => {
            console.log('🔄 Attempting to reconnect notifications subscription...');
            this.subscribeToNotifications(userId, onDataChange);
          }, 5000);
        } else if (status === 'TIMED_OUT') {
          console.warn('⚠️ Real-time subscription timed out for notifications');
        } else if (status === 'CLOSED') {
          console.log('🔌 Real-time subscription closed for notifications');
        }
      });

    return channel;
  }

  // Helper method to unsubscribe from real-time channels
  static unsubscribeFromChannel(channel: RealtimeChannel) {
    console.log('🔌 Unsubscribing from real-time channel');
    supabase.removeChannel(channel);
  }

  // Force refresh data - useful for manual refresh
  static async forceRefreshEvents(userId: string): Promise<Class[]> {
    console.log('🔄 Force refreshing events for user:', userId);
    try {
      const events = await this.getEvents(userId);
      console.log(`✅ Force refreshed ${events.length} events`);
      return events;
    } catch (error) {
      console.error('Error force refreshing events:', error);
      return [];
    }
  }

  // Manual sync function
  static async manualSync(userId: string): Promise<{ success: boolean; events: Class[]; error?: string }> {
    console.log('🔄 Starting manual sync for user:', userId);
    
    try {
      // Check authentication first
      const currentUser = await this.getCurrentUser();
      if (!currentUser || currentUser.id !== userId) {
        throw new Error('Authentication required for manual sync');
      }

      // Fetch events directly from Supabase
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('user_id', userId)
        .order('event_date', { ascending: true });

      if (error) {
        console.error('❌ Database error during manual sync:', error);
        throw error;
      }

      console.log(`📊 Manual sync found ${data.length} events in database`);

      // Convert to Class format
      const events = data.map(event => {
        let days: string[] = [];
        if (event.selected_days && Array.isArray(event.selected_days)) {
          // Handle text[] array directly
          days = event.selected_days;
        } else if (event.selected_days && typeof event.selected_days === 'string') {
          try {
            // Try to parse as JSON first
            const parsed = JSON.parse(event.selected_days);
            if (Array.isArray(parsed)) {
              days = parsed;
            } else if (typeof parsed === 'object' && parsed !== null) {
              // Handle JSON object like {"sunday"} -> convert to array
              days = Object.keys(parsed);
            }
          } catch (e) {
            // If JSON parsing fails, try to split by comma
            try {
              days = event.selected_days.split(',').map(day => day.trim());
            } catch (splitError) {
              console.warn('Failed to parse selected_days in manual sync:', event.selected_days);
              days = [];
            }
          }
        }
        
        // Normalize day names to proper case (capitalize first letter)
        days = days.map(day => {
          if (typeof day === 'string') {
            const normalizedDay = day.charAt(0).toUpperCase() + day.slice(1).toLowerCase();
            console.log(`📅 Manual sync - Normalizing day: ${day} -> ${normalizedDay}`);
            return normalizedDay;
          }
          return day;
        });

        let time = event.event_time || '';
        if (time && !time.includes('AM') && !time.includes('PM')) {
          const [hours, minutes] = time.split(':');
          const hour = parseInt(hours);
          const ampm = hour >= 12 ? 'PM' : 'AM';
          const hour12 = hour % 12 || 12;
          time = `${hour12}:${minutes} ${ampm}`;
        }

        return {
          id: event.id,
          name: event.title,
          time: time,
          days: days,
          location: event.location || undefined,
          recurring: true,
          reminders: event.reminder_minutes ? [`${event.reminder_minutes} minutes before`] : [],
          repetitionInterval: 1,
        };
      });

      console.log('✅ Manual sync completed successfully');
      return { success: true, events };
    } catch (error) {
      console.error('❌ Manual sync failed:', error);
      return { 
        success: false, 
        events: [], 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // Check if real-time subscription is active and reconnect if needed
  static async ensureRealtimeConnection(userId: string, onDataChange: (events: Class[]) => void): Promise<RealtimeChannel> {
    console.log('🔍 Checking real-time connection status');
    
    try {
      // Check if Supabase client is connected
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        console.error('❌ Auth session error:', error);
        throw new Error('Authentication required for real-time connection');
      }
      
      if (!data.session) {
        console.error('❌ No active session for real-time connection');
        throw new Error('No active session');
      }
      
      // Create new subscription with error handling
      const channel = this.subscribeToEvents(userId, onDataChange);
      
      // Verify channel was created successfully
      if (!channel || typeof channel.subscribe !== 'function') {
        throw new Error('Failed to create real-time channel');
      }
      
      return channel;
    } catch (error) {
      console.error('❌ Error in ensureRealtimeConnection:', error);
      throw error;
    }
  }

  // Setup real-time with retry mechanism
  static async setupRealtimeWithRetry(userId: string, onDataChange: (events: Class[]) => void, retries: number = 3): Promise<RealtimeChannel | null> {
    console.log(`🔄 Setting up real-time with ${retries} retries for user: ${userId}`);
    
    for (let i = 0; i < retries; i++) {
      try {
        console.log(`🔄 Attempt ${i + 1}/${retries}`);
        const subscription = await this.ensureRealtimeConnection(userId, onDataChange);
        if (subscription) {
          console.log('✅ Real-time subscription established successfully');
          return subscription;
        }
      } catch (error) {
        console.error(`❌ Attempt ${i + 1} failed:`, error);
        if (i < retries - 1) {
          const delay = 2000 * (i + 1); // Exponential backoff
          console.log(`⏳ Waiting ${delay}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    console.warn('⚠️ Failed to establish real-time connection after retries, falling back to polling');
    return null;
  }

  // Polling mechanism as fallback
  static startPolling(userId: string, onDataChange: (events: Class[]) => void, interval: number = 30000): NodeJS.Timeout {
    console.log(`🔄 Starting polling for user ${userId} every ${interval}ms`);
    
    const pollData = async () => {
      try {
        console.log('🔄 Polling for data updates...');
        const events = await this.getEvents(userId, false); // Silent polling
        onDataChange(events);
        console.log(`✅ Polling completed: ${events.length} events loaded`);
      } catch (error) {
        console.error('❌ Polling error:', error);
      }
    };

    // Initial poll
    pollData();
    
    // Set up interval
    return setInterval(pollData, interval);
  }

  // Stop polling
  static stopPolling(intervalId: NodeJS.Timeout) {
    console.log('🛑 Stopping polling');
    clearInterval(intervalId);
  }

  // Test real-time connection
  static async testRealtimeConnection(): Promise<boolean> {
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error || !data.session) {
        return false;
      }
      
      // Test with a simple query
      const { error: queryError } = await supabase
        .from('events')
        .select('id')
        .limit(1);
        
      return !queryError;
    } catch (error) {
      console.error('Error testing real-time connection:', error);
      return false;
    }
  }

  // Debug method to test synchronization
  static async debugSyncStatus(userId: string): Promise<{
    isConnected: boolean;
    eventCount: number;
    lastEvent: any;
    realtimeStatus: string;
  }> {
    try {
      const isConnected = await this.testRealtimeConnection();
      const events = await this.getEvents(userId);
      const lastEvent = events.length > 0 ? events[events.length - 1] : null;
      
      return {
        isConnected,
        eventCount: events.length,
        lastEvent,
        realtimeStatus: isConnected ? 'Connected' : 'Disconnected'
      };
    } catch (error) {
      console.error('Error in debug sync status:', error);
      return {
        isConnected: false,
        eventCount: 0,
        lastEvent: null,
        realtimeStatus: 'Error'
      };
    }
  }
}
