import { createClient } from '@supabase/supabase-js';

// Supabase configuration - using the correct publishable key
const supabaseUrl = 'https://ymkatahxzfwiyhpzvxts.supabase.co';
const supabaseAnonKey = 'sb_publishable_ZVE5eadI2S--fYmZL2-HVQ_VAbFjeAA';

// Debug logging
console.log('🔧 Supabase Configuration:');
console.log('URL:', supabaseUrl);
console.log('Key (first 20 chars):', supabaseAnonKey.substring(0, 20) + '...');

// Validate configuration
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase configuration.');
}

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false
  },
  realtime: {
    params: {
      eventsPerSecond: 2, // Further reduced for stability
    }
  }
});

// Test connection on import
supabase.auth.getSession().then(({ data, error }) => {
  if (error) {
    console.error('❌ Supabase Auth Error:', error.message);
  } else {
    console.log('✅ Supabase Auth Connected Successfully');
  }
});

// Database types based on your schema
export interface Database {
  public: {
    Tables: {
      events: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string | null;
          event_date: string;
          event_time: string | null;
          reminder_sent: boolean;
          reminder_datetime: string | null;
          created_at: string;
          updated_at: string;
          event_type: string;
          end_time: string | null;
          location: string | null;
          selected_days: string[] | null;
          reminder_minutes: number;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          description?: string | null;
          event_date: string;
          event_time?: string | null;
          reminder_sent?: boolean;
          reminder_datetime?: string | null;
          created_at?: string;
          updated_at?: string;
          event_type?: string;
          end_time?: string | null;
          location?: string | null;
          selected_days?: string[] | null;
          reminder_minutes?: number;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          description?: string | null;
          event_date?: string;
          event_time?: string | null;
          reminder_sent?: boolean;
          reminder_datetime?: string | null;
          created_at?: string;
          updated_at?: string;
          event_type?: string;
          end_time?: string | null;
          location?: string | null;
          selected_days?: string[] | null;
          reminder_minutes?: number;
        };
      };
      profiles: {
        Row: {
          id: string;
          user_id: string;
          full_name: string | null;
          phone_number: string | null;
          university: string | null;
          major: string | null;
          created_at: string;
          updated_at: string;
          avatar_url: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          full_name?: string | null;
          phone_number?: string | null;
          university?: string | null;
          major?: string | null;
          created_at?: string;
          updated_at?: string;
          avatar_url?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          full_name?: string | null;
          phone_number?: string | null;
          university?: string | null;
          major?: string | null;
          created_at?: string;
          updated_at?: string;
          avatar_url?: string | null;
        };
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          message: string;
          type: string;
          is_read: boolean;
          whatsapp_message_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          message: string;
          type?: string;
          is_read?: boolean;
          whatsapp_message_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          message?: string;
          type?: string;
          is_read?: boolean;
          whatsapp_message_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}
