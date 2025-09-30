import { Class, Task } from '../types';

export const formatTime = (time: string): string => {
  const [hours, minutes] = time.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
};

export const formatDate = (date: Date): string => {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export const formatDateShort = (date: Date): string => {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
};

export const getArabicDayName = (date: Date): string => {
  const dayNames = {
    'Sunday': 'الأحد',
    'Monday': 'الاثنين', 
    'Tuesday': 'الثلاثاء',
    'Wednesday': 'الأربعاء',
    'Thursday': 'الخميس',
    'Friday': 'الجمعة',
    'Saturday': 'السبت'
  };
  
  // استخدام الطريقة المحسنة لحساب اسم اليوم
  // JavaScript getDay() returns: 0=Sunday, 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday
  const dayIndex = date.getDay();
  const englishDayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const englishDay = englishDayNames[dayIndex];
  return dayNames[englishDay as keyof typeof dayNames] || englishDay;
};

export const getArabicDayShort = (date: Date): string => {
  const dayNames = {
    'Sun': 'أحد',
    'Mon': 'اثن',
    'Tue': 'ثلث',
    'Wed': 'أرب',
    'Thu': 'خمس',
    'Fri': 'جمع',
    'Sat': 'سبت'
  };
  
  // استخدام الطريقة المحسنة لحساب اسم اليوم المختصر
  // JavaScript getDay() returns: 0=Sunday, 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday
  const dayIndex = date.getDay();
  const englishDayShortNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const englishDay = englishDayShortNames[dayIndex];
  return dayNames[englishDay as keyof typeof dayNames] || englishDay;
};

// Arabic month names for Gregorian calendar
export const getArabicMonthName = (date: Date): string => {
  const monthNames = {
    'January': 'يناير',
    'February': 'فبراير',
    'March': 'مارس',
    'April': 'أبريل',
    'May': 'مايو',
    'June': 'يونيو',
    'July': 'يوليو',
    'August': 'أغسطس',
    'September': 'سبتمبر',
    'October': 'أكتوبر',
    'November': 'نوفمبر',
    'December': 'ديسمبر'
  };
  
  const englishMonth = date.toLocaleDateString('en-US', { month: 'long' });
  return monthNames[englishMonth as keyof typeof monthNames] || englishMonth;
};

// Format date in Arabic with Gregorian calendar
export const formatArabicDate = (date: Date): string => {
  const day = date.getDate();
  const month = getArabicMonthName(date);
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
};

// Format date with month and year only in Arabic
export const formatArabicMonthYear = (date: Date): string => {
  const month = getArabicMonthName(date);
  const year = date.getFullYear();
  return `${month} ${year}`;
};

export const getTimeUntilClass = (classTime: string): string => {
  const now = new Date();
  const [hours, minutes] = classTime.split(':').map(Number);
  
  const classDateTime = new Date();
  classDateTime.setHours(hours, minutes, 0, 0);
  
  const diffMs = classDateTime.getTime() - now.getTime();
  
  if (diffMs < 0) {
    return 'Class has passed';
  }
  
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  
  if (diffHours > 0) {
    return `${diffHours}h ${diffMinutes}m`;
  } else {
    return `${diffMinutes}m`;
  }
};

export const getDaysUntilDeadline = (dueDate: Date): number => {
  const now = new Date();
  const diffTime = dueDate.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export const getPriorityColor = (priority: Task['priority']): string => {
  switch (priority) {
    case 'high':
      return '#ef4444'; // Red
    case 'medium':
      return '#f59e0b'; // Amber
    case 'low':
      return '#10b981'; // Green
    default:
      return '#6b7280'; // Gray
  }
};

export const getTaskTypeIcon = (type: Task['type']): string => {
  switch (type) {
    case 'homework':
      return 'book';
    case 'assignment':
      return 'document-text';
    case 'exam':
      return 'school';
    case 'project':
      return 'folder';
    default:
      return 'checkmark-circle';
  }
};

export const getClassColor = (index: number): string => {
  const colors = [
    '#6366f1', // Indigo
    '#8b5cf6', // Purple
    '#10b981', // Emerald
    '#f59e0b', // Amber
    '#ef4444', // Red
    '#06b6d4', // Cyan
    '#84cc16', // Lime
    '#f97316', // Orange
    '#ec4899', // Pink
    '#8b5a2b', // Brown
  ];
  
  return colors[index % colors.length];
};

export const generateClassId = (): string => {
  return `class_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export const generateTaskId = (): string => {
  return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export const validateClassData = (classData: Partial<Class>): string[] => {
  const errors: string[] = [];
  
  if (!classData.name || classData.name.trim() === '') {
    errors.push('Class name is required');
  }
  
  if (!classData.subject || classData.subject.trim() === '') {
    errors.push('Subject is required');
  }
  
  if (!classData.time || !/^\d{2}:\d{2}$/.test(classData.time)) {
    errors.push('Valid time is required (HH:MM format)');
  }
  
  if (!classData.day || !['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'].includes(classData.day)) {
    errors.push('Valid day is required');
  }
  
  return errors;
};

export const validateTaskData = (taskData: Partial<Task>): string[] => {
  const errors: string[] = [];
  
  if (!taskData.title || taskData.title.trim() === '') {
    errors.push('Task title is required');
  }
  
  if (!taskData.dueDate || !(taskData.dueDate instanceof Date)) {
    errors.push('Valid due date is required');
  }
  
  if (!taskData.type || !['homework', 'assignment', 'exam', 'project'].includes(taskData.type)) {
    errors.push('Valid task type is required');
  }
  
  if (!taskData.priority || !['low', 'medium', 'high'].includes(taskData.priority)) {
    errors.push('Valid priority is required');
  }
  
  return errors;
};

export const sortClassesByTime = (classes: Class[]): Class[] => {
  return classes.sort((a, b) => a.time.localeCompare(b.time));
};

export const sortTasksByDueDate = (tasks: Task[]): Task[] => {
  return tasks.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
};

export const filterTasksByPriority = (tasks: Task[], priority: Task['priority']): Task[] => {
  return tasks.filter(task => task.priority === priority);
};

export const filterTasksByType = (tasks: Task[], type: Task['type']): Task[] => {
  return tasks.filter(task => task.type === type);
};

export const getCompletedTasksCount = (tasks: Task[]): number => {
  return tasks.filter(task => task.completed).length;
};

export const getPendingTasksCount = (tasks: Task[]): number => {
  return tasks.filter(task => !task.completed).length;
};

export const getOverdueTasks = (tasks: Task[]): Task[] => {
  const now = new Date();
  return tasks.filter(task => !task.completed && task.dueDate < now);
};

export const getTasksDueSoon = (tasks: Task[], days: number = 3): Task[] => {
  const now = new Date();
  const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  
  return tasks.filter(task => 
    !task.completed && 
    task.dueDate >= now && 
    task.dueDate <= futureDate
  );
};

export const calculateCompletionPercentage = (tasks: Task[]): number => {
  if (tasks.length === 0) return 0;
  const completed = getCompletedTasksCount(tasks);
  return Math.round((completed / tasks.length) * 100);
};

export const getStudyStreak = (tasks: Task[]): number => {
  // Simple implementation - in a real app, you'd track actual study sessions
  const completedTasks = tasks.filter(task => task.completed);
  const today = new Date();
  let streak = 0;
  
  for (let i = 0; i < 30; i++) {
    const checkDate = new Date(today);
    checkDate.setDate(checkDate.getDate() - i);
    
    const tasksCompletedOnDate = completedTasks.filter(task => {
      const taskDate = new Date(task.dueDate);
      return taskDate.toDateString() === checkDate.toDateString();
    });
    
    if (tasksCompletedOnDate.length > 0) {
      streak++;
    } else {
      break;
    }
  }
  
  return streak;
};
