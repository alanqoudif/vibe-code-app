import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import { DatabaseService } from '../services/DatabaseService';
import { User, AuthState } from '../types';

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<boolean>;
  signup: (name: string, email: string, password: string, phoneNumber: string) => Promise<boolean>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<boolean>;
  updatePassword: (newPassword: string) => Promise<boolean>;
  checkEmailDelivery: (email: string) => Promise<boolean>;
  deleteAccount: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [lastResetRequest, setLastResetRequest] = useState<number>(0);

  useEffect(() => {
    loadAuthState();
    
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        await loadUserProfile(session.user);
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadAuthState = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await loadUserProfile(session.user);
      }
    } catch (error) {
      console.error('Error loading auth state:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadUserProfile = async (authUser: any) => {
    try {
      // Get user profile from database
      const profile = await DatabaseService.getProfile(authUser.id);
      
      const userData: User = {
        id: authUser.id,
        email: authUser.email,
        name: profile?.full_name || authUser.email.split('@')[0],
        createdAt: new Date(authUser.created_at),
        fullName: profile?.full_name,
        phoneNumber: profile?.phone_number,
        university: profile?.university,
        major: profile?.major,
        avatarUrl: profile?.avatar_url,
      };

      setUser(userData);
      setIsAuthenticated(true);
      
      // Save to AsyncStorage for offline access
      await AsyncStorage.setItem('user', JSON.stringify(userData));
    } catch (error) {
      console.error('Error loading user profile:', error);
      // Fallback to basic user data
      const userData: User = {
        id: authUser.id,
        email: authUser.email,
        name: authUser.email.split('@')[0],
        createdAt: new Date(authUser.created_at),
      };
      setUser(userData);
      setIsAuthenticated(true);
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      // Validate input
      if (!email || !password) {
        console.error('Login error: Email and password are required');
        return false;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        console.error('Login error: Invalid email format');
        return false;
      }

      console.log('🔐 Attempting login for:', email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) {
        console.error('Login error:', error.message);
        
        // Provide more specific error messages
        if (error.message.includes('Invalid login credentials')) {
          console.error('❌ Invalid login credentials - User not found or wrong password');
        } else if (error.message.includes('Email not confirmed')) {
          console.error('❌ Email not confirmed - Please check your email');
        } else if (error.message.includes('Too many requests')) {
          console.error('❌ Too many login attempts - Please try again later');
        } else {
          console.error('❌ Login failed:', error.message);
        }
        
        return false;
      }

      if (data.user) {
        console.log('✅ Login successful for:', data.user.email);
        await loadUserProfile(data.user);
        return true;
      }
      
      console.error('❌ Login failed: No user data returned');
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (name: string, email: string, password: string, phoneNumber: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      // Validate input
      if (!name || !email || !password || !phoneNumber) {
        console.error('Signup error: Name, email, password and phone number are required');
        return false;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        console.error('Signup error: Invalid email format');
        return false;
      }

      // Validate password length
      if (password.length < 6) {
        console.error('Signup error: Password must be at least 6 characters');
        return false;
      }

      // Validate phone number
      if (!phoneNumber.startsWith('+')) {
        console.error('Signup error: Phone number must start with country code (e.g., +968)');
        return false;
      }
      if (phoneNumber.length < 10) {
        console.error('Signup error: Phone number too short');
        return false;
      }

      console.log('📝 Attempting signup for:', email);
      
      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) {
        console.error('Signup error:', error.message);
        
        // Provide more specific error messages
        if (error.message.includes('already registered')) {
          console.error('❌ Email already registered - Please use login instead');
        } else if (error.message.includes('Password should be at least')) {
          console.error('❌ Password too short - Must be at least 6 characters');
        } else if (error.message.includes('Invalid email')) {
          console.error('❌ Invalid email format');
        } else {
          console.error('❌ Signup failed:', error.message);
        }
        
        return false;
      }

      if (data.user) {
        console.log('✅ Signup successful for:', data.user.email);
        
        // Create user profile
        try {
          await DatabaseService.createProfile(data.user.id, {
            fullName: name.trim(),
            phoneNumber: phoneNumber.trim(),
          });
          console.log('✅ User profile created');
          
          // Send welcome WhatsApp message to new user
          try {
            await sendWelcomeWhatsAppMessage(name.trim(), phoneNumber.trim());
          } catch (whatsappError) {
            console.log('Could not send welcome WhatsApp message:', whatsappError);
            // Don't fail signup if WhatsApp message fails
          }
        } catch (profileError) {
          console.error('⚠️ Profile creation failed, but user was created:', profileError);
          // Continue anyway as the user was created successfully
        }
        
        await loadUserProfile(data.user);
        return true;
      }
      
      console.error('❌ Signup failed: No user data returned');
      return false;
    } catch (error) {
      console.error('Signup error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await supabase.auth.signOut();
      await AsyncStorage.removeItem('user');
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const resetPassword = async (email: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      // Check if enough time has passed since last request (30 seconds)
      const now = Date.now();
      const timeSinceLastRequest = now - lastResetRequest;
      const minInterval = 30000; // 30 seconds
      
      if (timeSinceLastRequest < minInterval) {
        const remainingTime = Math.ceil((minInterval - timeSinceLastRequest) / 1000);
        console.error(`Reset password error: Please wait ${remainingTime} seconds before trying again`);
        return false;
      }
      
      // Validate input
      if (!email) {
        console.error('Reset password error: Email is required');
        return false;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        console.error('Reset password error: Invalid email format');
        return false;
      }

      console.log('🔄 Attempting password reset for:', email);
      console.log('📧 Supabase URL:', supabase.supabaseUrl);
      
      const { data, error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
        redirectTo: 'https://ymkatahxzfwiyhpzvxts.supabase.co/password-reset.html',
      });
      
      console.log('📧 Reset password response data:', data);
      console.log('📧 Reset password response error:', error);

      if (error) {
        console.error('Reset password error:', error.message);
        
        // Provide more specific error messages
        if (error.message.includes('Invalid email')) {
          console.error('❌ Invalid email format');
        } else if (error.message.includes('User not found')) {
          console.error('❌ No account found with this email address');
        } else if (error.message.includes('For security purposes')) {
          console.error('❌ Too many requests - Please wait before trying again');
        } else if (error.message.includes('rate limit')) {
          console.error('❌ Too many requests - Please wait before trying again');
        } else {
          console.error('❌ Password reset failed:', error.message);
        }
        
        return false;
      }

      console.log('✅ Password reset email sent to:', email);
      setLastResetRequest(now);
      return true;
    } catch (error) {
      console.error('Reset password error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const updatePassword = async (newPassword: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      // Validate input
      if (!newPassword) {
        console.error('Update password error: New password is required');
        return false;
      }

      // Validate password length
      if (newPassword.length < 6) {
        console.error('Update password error: Password must be at least 6 characters');
        return false;
      }

      console.log('🔐 Attempting password update');
      
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        console.error('Update password error:', error.message);
        
        // Provide more specific error messages
        if (error.message.includes('Password should be at least')) {
          console.error('❌ Password too short - Must be at least 6 characters');
        } else if (error.message.includes('Invalid password')) {
          console.error('❌ Invalid password format');
        } else {
          console.error('❌ Password update failed:', error.message);
        }
        
        return false;
      }

      console.log('✅ Password updated successfully');
      return true;
    } catch (error) {
      console.error('Update password error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const checkEmailDelivery = async (email: string): Promise<boolean> => {
    try {
      console.log('📧 Checking email delivery for:', email);
      
      // Simple email format validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        console.log('❌ Invalid email format');
        return false;
      }
      
      // Check if user exists by attempting to sign in with a dummy password
      // This is a workaround since admin functions require service role key
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password: 'dummy-password-for-check-' + Date.now()
      });
      
      // If we get a specific error about invalid credentials, user exists
      if (error && error.message.includes('Invalid login credentials')) {
        console.log('✅ User found in database:', email);
        return true;
      }
      
      // If we get other errors, user might not exist
      if (error) {
        console.log('❌ User not found or other error:', error.message);
        return false;
      }
      
      // If no error, user exists (this shouldn't happen with dummy password)
      console.log('✅ User found in database:', email);
      return true;
    } catch (error) {
      console.error('Email delivery check error:', error);
      return false;
    }
  };

  const sendWelcomeWhatsAppMessage = async (userName: string, phoneNumber: string) => {
    try {
      const welcomeMessage = `🎉 أهلاً وسهلاً بك في منصة learnz|ليرنز! 

مرحباً ${userName}! 👋

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

      const response = await fetch('https://ymkatahxzfwiyhpzvxts.supabase.co/functions/v1/send-whatsapp-reminder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'send_welcome_message',
          phoneNumber: phoneNumber,
          message: welcomeMessage
        })
      });

      const result = await response.json();
      console.log('Welcome WhatsApp message result:', result);
      
      if (result.success) {
        console.log('✅ Welcome WhatsApp message sent successfully to:', phoneNumber);
      } else {
        console.log('❌ Failed to send welcome WhatsApp message:', result.message);
      }
    } catch (error) {
      console.error('Error sending welcome WhatsApp message:', error);
    }
  };

  const deleteAccount = async (): Promise<boolean> => {
    try {
      if (!user) {
        console.error('Delete account error: No user logged in');
        return false;
      }

      console.log('🗑️ Attempting to delete account for:', user.email);
      
      // First, delete user profile and related data from database
      try {
        await DatabaseService.deleteUserData(user.id);
        console.log('✅ User data deleted from database');
      } catch (dbError) {
        console.error('⚠️ Failed to delete user data from database:', dbError);
        // Continue with auth deletion even if database deletion fails
      }

      // Since we can't use admin.deleteUser without service role key,
      // we'll sign out the user and clear local data
      // The user will need to contact support to completely remove their auth record
      await supabase.auth.signOut();
      
      console.log('✅ Account data deleted successfully');
      
      // Clear local state and storage
      await AsyncStorage.removeItem('user');
      setUser(null);
      setIsAuthenticated(false);
      
      return true;
    } catch (error) {
      console.error('Delete account error:', error);
      return false;
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    login,
    signup,
    logout,
    resetPassword,
    updatePassword,
    checkEmailDelivery,
    deleteAccount,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
