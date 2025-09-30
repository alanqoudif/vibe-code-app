import AsyncStorage from '@react-native-async-storage/async-storage';
import { DatabaseService } from './DatabaseService';
import { Class, Task } from '../types';

const STORAGE_KEYS = {
  CLASSES: 'classes',
  TASKS: 'tasks',
  THEME: 'theme',
} as const;

export class StorageService {
  // Helper method to get current user ID
  private static async getCurrentUserId(): Promise<string | null> {
    try {
      const user = await DatabaseService.getCurrentUser();
      return user?.id || null;
    } catch (error) {
      // Silently handle session errors - this is expected when user is not logged in
      if (error.message && error.message.includes('Auth session missing')) {
        return null;
      }
      console.error('Error getting current user:', error);
      return null;
    }
  }

  // Classes - Now using Supabase
  static async getClasses(): Promise<Class[]> {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) {
        console.log('⚠️ No user ID, falling back to local storage');
        // Fallback to local storage if no user
        const classesJson = await AsyncStorage.getItem(STORAGE_KEYS.CLASSES);
        return classesJson ? JSON.parse(classesJson) : [];
      }
      
      console.log('📚 Getting classes from database for user:', userId);
      const dbClasses = await DatabaseService.getEvents(userId);
      console.log(`✅ Retrieved ${dbClasses.length} classes from database`);
      return dbClasses;
    } catch (error) {
      console.error('Error getting classes:', error);
      // Fallback to local storage
      try {
        console.log('⚠️ Falling back to local storage due to error');
        const classesJson = await AsyncStorage.getItem(STORAGE_KEYS.CLASSES);
        return classesJson ? JSON.parse(classesJson) : [];
      } catch (fallbackError) {
        console.error('Error getting classes from local storage:', fallbackError);
        return [];
      }
    }
  }

  static async saveClasses(classes: Class[]): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(classes));
    } catch (error) {
      console.error('Error saving classes:', error);
    }
  }

  static async addClass(newClass: Class): Promise<void> {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) {
        console.log('⚠️ No user ID, saving to local storage only');
        // Fallback to local storage
        const classes = await this.getClasses();
        classes.push(newClass);
        await this.saveClasses(classes);
        return;
      }
      
      console.log('💾 Adding class to database for user:', userId);
      const createdClass = await DatabaseService.createEvent(userId, newClass);
      console.log('✅ Class added to database:', createdClass.name);
      
      // Note: Real-time subscription will automatically update the UI
      // No need to manually update local state here
    } catch (error) {
      console.error('Error adding class:', error);
      // Fallback to local storage
      try {
        console.log('⚠️ Falling back to local storage due to error');
        const classes = await this.getClasses();
        classes.push(newClass);
        await this.saveClasses(classes);
        console.log('✅ Class saved to local storage as fallback');
      } catch (fallbackError) {
        console.error('Error adding class to local storage:', fallbackError);
      }
    }
  }

  static async updateClass(classId: string, updatedClass: Partial<Class>): Promise<void> {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) {
        console.log('⚠️ No user ID, updating in local storage only');
        // Fallback to local storage
        const classes = await this.getClasses();
        const index = classes.findIndex(cls => cls.id === classId);
        if (index !== -1) {
          classes[index] = { ...classes[index], ...updatedClass };
          await this.saveClasses(classes);
        }
        return;
      }
      
      console.log('📝 Updating class in database:', classId);
      await DatabaseService.updateEvent(classId, updatedClass);
      console.log('✅ Class updated in database');
      
      // Note: Real-time subscription will automatically update the UI
    } catch (error) {
      console.error('Error updating class:', error);
      // Fallback to local storage
      try {
        console.log('⚠️ Falling back to local storage due to error');
        const classes = await this.getClasses();
        const index = classes.findIndex(cls => cls.id === classId);
        if (index !== -1) {
          classes[index] = { ...classes[index], ...updatedClass };
          await this.saveClasses(classes);
        }
      } catch (fallbackError) {
        console.error('Error updating class in local storage:', fallbackError);
      }
    }
  }

  static async deleteClass(classId: string): Promise<void> {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) {
        console.log('⚠️ No user ID, deleting from local storage only');
        // Fallback to local storage
        const classes = await this.getClasses();
        const filteredClasses = classes.filter(cls => cls.id !== classId);
        await this.saveClasses(filteredClasses);
        return;
      }
      
      console.log('🗑️ Deleting class from database:', classId);
      await DatabaseService.deleteEvent(classId);
      console.log('✅ Class deleted from database');
      
      // Note: Real-time subscription will automatically update the UI
    } catch (error) {
      console.error('Error deleting class:', error);
      // Fallback to local storage
      try {
        console.log('⚠️ Falling back to local storage due to error');
        const classes = await this.getClasses();
        const filteredClasses = classes.filter(cls => cls.id !== classId);
        await this.saveClasses(filteredClasses);
      } catch (fallbackError) {
        console.error('Error deleting class from local storage:', fallbackError);
      }
    }
  }

  // Tasks
  static async getTasks(): Promise<Task[]> {
    try {
      const tasksJson = await AsyncStorage.getItem(STORAGE_KEYS.TASKS);
      if (tasksJson) {
        const tasks = JSON.parse(tasksJson);
        // Convert date strings back to Date objects
        return tasks.map((task: any) => ({
          ...task,
          dueDate: new Date(task.dueDate),
          createdAt: new Date(task.createdAt),
          completedDate: task.completedDate ? new Date(task.completedDate) : undefined,
        }));
      }
      return [];
    } catch (error) {
      console.error('Error getting tasks:', error);
      return [];
    }
  }

  static async saveTasks(tasks: Task[]): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
    } catch (error) {
      console.error('Error saving tasks:', error);
    }
  }

  static async addTask(newTask: Task): Promise<void> {
    try {
      const tasks = await this.getTasks();
      tasks.push(newTask);
      await this.saveTasks(tasks);
    } catch (error) {
      console.error('Error adding task:', error);
    }
  }

  static async updateTask(taskId: string, updatedTask: Partial<Task>): Promise<void> {
    try {
      const tasks = await this.getTasks();
      const index = tasks.findIndex(task => task.id === taskId);
      if (index !== -1) {
        tasks[index] = { ...tasks[index], ...updatedTask };
        await this.saveTasks(tasks);
      }
    } catch (error) {
      console.error('Error updating task:', error);
    }
  }

  static async deleteTask(taskId: string): Promise<void> {
    try {
      const tasks = await this.getTasks();
      const filteredTasks = tasks.filter(task => task.id !== taskId);
      await this.saveTasks(filteredTasks);
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  }

  static async toggleTaskCompletion(taskId: string): Promise<void> {
    try {
      const tasks = await this.getTasks();
      const index = tasks.findIndex(task => task.id === taskId);
      if (index !== -1) {
        // Only allow marking as completed, not uncompleted
        if (!tasks[index].completed) {
          tasks[index].completed = true;
          tasks[index].completedDate = new Date();
        }
        await this.saveTasks(tasks);
      }
    } catch (error) {
      console.error('Error toggling task completion:', error);
    }
  }

  static async markOverdueTasks(): Promise<void> {
    try {
      const tasks = await this.getTasks();
      const today = new Date();
      today.setHours(23, 59, 59, 999); // End of today
      
      const updatedTasks = tasks.map(task => {
        if (!task.completed && task.dueDate < today) {
          return { ...task, isOverdue: true };
        }
        return task;
      });
      
      await this.saveTasks(updatedTasks);
    } catch (error) {
      console.error('Error marking overdue tasks:', error);
    }
  }

  static async deleteCompletedTasks(): Promise<void> {
    try {
      const tasks = await this.getTasks();
      const pendingTasks = tasks.filter(task => !task.completed);
      await this.saveTasks(pendingTasks);
    } catch (error) {
      console.error('Error deleting completed tasks:', error);
    }
  }

  static async dailyCleanup(): Promise<void> {
    try {
      await this.markOverdueTasks();
      await this.deleteCompletedTasks();
    } catch (error) {
      console.error('Error during daily cleanup:', error);
    }
  }


  // Theme
  static async getTheme(): Promise<'light' | 'dark'> {
    try {
      const theme = await AsyncStorage.getItem(STORAGE_KEYS.THEME);
      return theme === 'dark' ? 'dark' : 'light';
    } catch (error) {
      console.error('Error getting theme:', error);
      return 'light';
    }
  }

  static async saveTheme(theme: 'light' | 'dark'): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.THEME, theme);
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  }

  // Clear all data
  static async clearAllData(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.CLASSES,
        STORAGE_KEYS.TASKS,
        STORAGE_KEYS.NOTIFICATION_SETTINGS,
      ]);
    } catch (error) {
      console.error('Error clearing data:', error);
    }
  }

  // Export data
  static async exportData(): Promise<string> {
    try {
      const [classes, tasks] = await Promise.all([
        this.getClasses(),
        this.getTasks(),
      ]);

      const exportData = {
        classes,
        tasks,
        exportDate: new Date().toISOString(),
        version: '1.0.0',
      };

      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      console.error('Error exporting data:', error);
      throw error;
    }
  }

  // Import data
  static async importData(dataJson: string): Promise<void> {
    try {
      const data = JSON.parse(dataJson);
      
      if (data.classes) {
        await this.saveClasses(data.classes);
      }
      
      if (data.tasks) {
        await this.saveTasks(data.tasks);
      }
    } catch (error) {
      console.error('Error importing data:', error);
      throw error;
    }
  }
}
