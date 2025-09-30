export interface Class {
  id: string;
  name: string;
  time: string;
  days: string[]; // Changed from single day to multiple days
  location?: string;
  recurring: boolean;
  reminders?: string[]; // Added reminders array
  repetitionInterval?: number; // Added repetition interval (1 = every week, 2 = every 2 weeks, etc.)
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  dueDate: Date;
  completed: boolean;
  classId?: string;
  type: 'homework' | 'assignment' | 'exam' | 'project';
  isOverdue?: boolean;
  completedDate?: Date;
  createdAt: Date;
}

export interface QuickAction {
  id: string;
  title: string;
  icon: string;
  action: () => void;
  color: string;
}

export interface StudyTip {
  id: string;
  title: string;
  description: string;
  category: 'time-management' | 'study-techniques' | 'motivation' | 'health';
}

export interface Theme {
  colors: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
    success: string;
    warning: string;
    error: string;
  };
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
  borderRadius: {
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
}

export type CalendarView = 'day' | 'week' | 'month';


export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
  fullName?: string;
  phoneNumber: string;
  university?: string;
  major?: string;
  avatarUrl?: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
