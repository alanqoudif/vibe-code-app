import { supabase } from '../lib/supabase';
import { Task } from '../types';

export interface DatabaseTask {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  due_date?: string;
  completed: boolean;
  completed_at?: string;
  task_type: 'assignment' | 'exam' | 'project' | 'homework' | 'quiz';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  class_id?: string;
  class_name?: string;
  is_overdue: boolean;
  created_at: string;
  updated_at: string;
}

export class TasksService {
  /**
   * Get all tasks for the current user
   */
  static async getTasks(): Promise<Task[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('⚠️ User not authenticated, returning empty tasks array');
        return [];
      }

      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching tasks:', error);
        return [];
      }

      const tasks = data?.map(this.convertDatabaseTaskToTask) || [];
      console.log('✅ Loaded tasks from database:', tasks.length);
      return tasks;
    } catch (error) {
      console.error('❌ Error in getTasks:', error);
      return [];
    }
  }

  /**
   * Add a new task
   */
  static async addTask(task: Omit<Task, 'id' | 'createdAt' | 'isOverdue'>): Promise<Task | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('⚠️ User not authenticated, cannot add task');
        return null;
      }

      const taskData: Omit<DatabaseTask, 'id' | 'created_at' | 'updated_at' | 'is_overdue'> = {
        user_id: user.id,
        title: task.title,
        description: task.description,
        due_date: task.dueDate?.toISOString(),
        completed: task.completed,
        completed_at: task.completedDate?.toISOString(),
        task_type: task.type,
        priority: 'medium',
        class_id: task.classId,
        class_name: undefined, // Will be populated if needed
      };

      const { data, error } = await supabase
        .from('tasks')
        .insert([taskData])
        .select()
        .single();

      if (error) {
        console.error('❌ Error adding task:', error);
        return null;
      }

      const newTask = this.convertDatabaseTaskToTask(data);
      console.log('✅ Task added successfully:', newTask.title);
      return newTask;
    } catch (error) {
      console.error('❌ Error in addTask:', error);
      return null;
    }
  }

  /**
   * Update a task
   */
  static async updateTask(taskId: string, updates: Partial<Task>): Promise<Task> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const updateData: any = {};
      
      if (updates.title !== undefined) updateData.title = updates.title;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.dueDate !== undefined) updateData.due_date = updates.dueDate?.toISOString();
      if (updates.completed !== undefined) updateData.completed = updates.completed;
      if (updates.completedDate !== undefined) updateData.completed_at = updates.completedDate?.toISOString();
      if (updates.type !== undefined) updateData.task_type = updates.type;
      if (updates.classId !== undefined) updateData.class_id = updates.classId;

      const { data, error } = await supabase
        .from('tasks')
        .update(updateData)
        .eq('id', taskId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating task:', error);
        throw error;
      }

      return this.convertDatabaseTaskToTask(data);
    } catch (error) {
      console.error('Error in updateTask:', error);
      throw error;
    }
  }

  /**
   * Toggle task completion status
   */
  static async toggleTaskCompletion(taskId: string): Promise<Task> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // First get the current task
      const { data: currentTask, error: fetchError } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', taskId)
        .eq('user_id', user.id)
        .single();

      if (fetchError) {
        console.error('Error fetching task for toggle:', fetchError);
        throw fetchError;
      }

      // Toggle completion status
      const newCompletedStatus = !currentTask.completed;
      const completedAt = newCompletedStatus ? new Date().toISOString() : null;

      const { data, error } = await supabase
        .from('tasks')
        .update({
          completed: newCompletedStatus,
          completed_at: completedAt,
        })
        .eq('id', taskId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Error toggling task completion:', error);
        throw error;
      }

      return this.convertDatabaseTaskToTask(data);
    } catch (error) {
      console.error('Error in toggleTaskCompletion:', error);
      throw error;
    }
  }

  /**
   * Delete a task
   */
  static async deleteTask(taskId: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error deleting task:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in deleteTask:', error);
      throw error;
    }
  }

  /**
   * Get tasks by type
   */
  static async getTasksByType(type: Task['type']): Promise<Task[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .eq('task_type', type)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching tasks by type:', error);
        throw error;
      }

      return data?.map(this.convertDatabaseTaskToTask) || [];
    } catch (error) {
      console.error('Error in getTasksByType:', error);
      throw error;
    }
  }

  /**
   * Get overdue tasks
   */
  static async getOverdueTasks(): Promise<Task[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_overdue', true)
        .eq('completed', false)
        .order('due_date', { ascending: true });

      if (error) {
        console.error('Error fetching overdue tasks:', error);
        throw error;
      }

      return data?.map(this.convertDatabaseTaskToTask) || [];
    } catch (error) {
      console.error('Error in getOverdueTasks:', error);
      throw error;
    }
  }

  /**
   * Get upcoming tasks (next 7 days)
   */
  static async getUpcomingTasks(): Promise<Task[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const today = new Date();
      const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .eq('completed', false)
        .gte('due_date', today.toISOString())
        .lte('due_date', nextWeek.toISOString())
        .order('due_date', { ascending: true });

      if (error) {
        console.error('Error fetching upcoming tasks:', error);
        throw error;
      }

      return data?.map(this.convertDatabaseTaskToTask) || [];
    } catch (error) {
      console.error('Error in getUpcomingTasks:', error);
      throw error;
    }
  }

  /**
   * Convert database task to app task format
   */
  private static convertDatabaseTaskToTask(dbTask: DatabaseTask): Task {
    return {
      id: dbTask.id,
      title: dbTask.title,
      description: dbTask.description || '',
      dueDate: dbTask.due_date ? new Date(dbTask.due_date) : new Date(),
      completed: dbTask.completed,
      completedDate: dbTask.completed_at ? new Date(dbTask.completed_at) : undefined,
      type: dbTask.task_type,
      classId: dbTask.class_id,
      isOverdue: dbTask.is_overdue,
      createdAt: new Date(dbTask.created_at),
    };
  }

  /**
   * Sync tasks with real-time updates
   */
  static async subscribeToTasksUpdates(callback: (tasks: Task[]) => void) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    return supabase
      .channel('tasks_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
          filter: `user_id=eq.${user.id}`,
        },
        async () => {
          try {
            const tasks = await this.getTasks();
            callback(tasks);
          } catch (error) {
            console.error('Error in tasks subscription callback:', error);
          }
        }
      )
      .subscribe();
  }
}
