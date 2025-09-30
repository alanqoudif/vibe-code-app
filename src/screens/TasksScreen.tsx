import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { Task } from '../types';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import { TasksService } from '../services/TasksService';
import { formatArabicDate } from '../utils/helpers';

const TasksScreen: React.FC = () => {
  const { theme } = useTheme();
  const { isAuthenticated } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [showAddTask, setShowAddTask] = useState(false);

  // Load tasks from database
  useEffect(() => {
    const loadTasks = async () => {
      if (!isAuthenticated) return;
      
      try {
        console.log('📋 Loading tasks from database...');
        const tasks = await TasksService.getTasks();
        console.log('✅ Loaded tasks:', tasks.length);
        setTasks(tasks);
      } catch (error) {
        console.error('❌ Error loading tasks:', error);
        // Fallback to empty array if there's an error
        setTasks([]);
      }
    };

    loadTasks();
  }, [isAuthenticated]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!isAuthenticated) return;

    let subscription: any = null;

    const setupSubscription = async () => {
      try {
        subscription = await TasksService.subscribeToTasksUpdates((updatedTasks) => {
          console.log('🔄 Tasks updated via real-time:', updatedTasks.length);
          setTasks(updatedTasks);
        });
        if (subscription) {
          console.log('📡 Subscribed to tasks real-time updates');
        }
      } catch (error) {
        console.error('❌ Error setting up tasks subscription:', error);
        // Fallback: reload tasks manually
        const fallbackTasks = await TasksService.getTasks();
        setTasks(fallbackTasks);
      }
    };

    setupSubscription();

    return () => {
      if (subscription) {
        subscription.unsubscribe();
        console.log('📡 Unsubscribed from tasks updates');
      }
    };
  }, [isAuthenticated]);

  // Manual refresh function
  const refreshTasks = async () => {
    try {
      console.log('🔄 Manually refreshing tasks...');
      const tasks = await TasksService.getTasks();
      setTasks(tasks);
    } catch (error) {
      console.error('❌ Error refreshing tasks:', error);
    }
  };

  // If user is not authenticated, don't show any data
  if (!isAuthenticated) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.centerContent}>
          <Ionicons name="lock-closed" size={64} color={theme.colors.textSecondary} />
          <Text style={[styles.lockMessage, { color: theme.colors.textSecondary }]}>
            learnz | ليرنز
          </Text>
          <Text style={[styles.lockMessage, { color: theme.colors.textSecondary }]}>
            يرجى تسجيل الدخول لعرض البيانات
          </Text>
        </View>
      </View>
    );
  }

  const toggleTaskCompletion = async (taskId: string) => {
    // Find the current task
    const currentTask = tasks.find(task => task.id === taskId);
    if (!currentTask) return;

    // Optimistic update - toggle immediately in UI
    const optimisticTask = {
      ...currentTask,
      completed: !currentTask.completed,
      completedDate: !currentTask.completed ? new Date() : undefined,
    };

    // Update UI immediately
    setTasks(prevTasks => 
      prevTasks.map(task => 
        task.id === taskId ? optimisticTask : task
      )
    );

    // Then save to database in background
    try {
      console.log('🔄 Toggling task completion:', taskId);
      const updatedTask = await TasksService.toggleTaskCompletion(taskId);
      if (updatedTask) {
        // Replace optimistic task with real task
        setTasks(prevTasks => 
          prevTasks.map(task => 
            task.id === taskId ? updatedTask : task
          )
        );
      } else {
        // Revert optimistic update if failed
        setTasks(prevTasks => 
          prevTasks.map(task => 
            task.id === taskId ? currentTask : task
          )
        );
      }
    } catch (error) {
      // Revert optimistic update if failed
      setTasks(prevTasks => 
        prevTasks.map(task => 
          task.id === taskId ? currentTask : task
        )
      );
      console.error('❌ Error toggling task completion:', error);
    }
  };

  const addTask = async () => {
    if (newTask.trim()) {
      // Create optimistic task immediately
      const optimisticTask: Task = {
        id: `temp-${Date.now()}`, // Temporary ID
        title: newTask,
        description: newTaskDescription.trim(),
        dueDate: new Date(),
        completed: false,
        type: 'homework',
        classId: undefined,
        isOverdue: false,
        createdAt: new Date(),
      };

      // Add to UI immediately (optimistic update)
      setTasks(prevTasks => [optimisticTask, ...prevTasks]);
      setNewTask('');
      setNewTaskDescription('');
      setShowAddTask(false);

      // Then save to database in background
      try {
        console.log('➕ Adding new task:', newTask);
        const taskData = {
          title: newTask,
          description: newTaskDescription.trim(),
          dueDate: new Date(),
          completed: false,
          type: 'homework' as const,
          classId: undefined,
        };
        
        const result = await TasksService.addTask(taskData);
        if (result) {
          // Replace optimistic task with real task
          setTasks(prevTasks => 
            prevTasks.map(task => 
              task.id === optimisticTask.id ? result : task
            )
          );
        } else {
          // Remove optimistic task if failed
          setTasks(prevTasks => 
            prevTasks.filter(task => task.id !== optimisticTask.id)
          );
          console.error('❌ Failed to add task');
        }
      } catch (error) {
        // Remove optimistic task if failed
        setTasks(prevTasks => 
          prevTasks.filter(task => task.id !== optimisticTask.id)
        );
        console.error('❌ Error adding task:', error);
      }
    }
  };

  const deleteTask = async (taskId: string) => {
    // Find the current task
    const currentTask = tasks.find(task => task.id === taskId);
    if (!currentTask) return;

    // Optimistic update - remove immediately from UI
    setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));

    // Then delete from database in background
    try {
      console.log('🗑️ Deleting task:', taskId);
      await TasksService.deleteTask(taskId);
    } catch (error) {
      // Revert optimistic update if failed
      setTasks(prevTasks => [...prevTasks, currentTask].sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ));
      console.error('❌ Error deleting task:', error);
    }
  };



  const getTaskIcon = (type: Task['type']) => {
    switch (type) {
      case 'assignment': return 'document-text';
      case 'exam': return 'school';
      case 'project': return 'folder';
      case 'homework': return 'book';
      default: return 'checkmark-circle';
    }
  };

  const renderTaskItem = ({ item }: { item: Task }) => (
    <Card
      style={[
        styles.taskItem,
        item.completed && styles.completedTask,
        item.isOverdue && !item.completed && styles.overdueTask,
      ]}
      onPress={() => !item.completed && toggleTaskCompletion(item.id)}
    >
      <View style={styles.taskHeader}>
        <View style={styles.taskLeft}>
          <TouchableOpacity
            style={[
              styles.checkbox,
              {
                backgroundColor: item.completed ? theme.colors.success : 'transparent',
                borderColor: item.completed ? theme.colors.success : theme.colors.border,
              },
            ]}
            onPress={() => !item.completed && toggleTaskCompletion(item.id)}
            disabled={item.completed}
          >
            {item.completed && (
              <Ionicons name="checkmark" size={16} color="#ffffff" />
            )}
          </TouchableOpacity>
          <View style={styles.taskInfo}>
            <Text
              style={[
                styles.taskTitle,
                {
                  color: item.completed ? theme.colors.textSecondary : theme.colors.text,
                  textDecorationLine: item.completed ? 'line-through' : 'none',
                },
              ]}
            >
              {item.title}
            </Text>
            {item.description && (
              <Text
                style={[
                  styles.taskDescription,
                  { color: theme.colors.textSecondary },
                ]}
              >
                {item.description}
              </Text>
            )}
            {item.isOverdue && !item.completed && (
              <Text
                style={[
                  styles.overdueText,
                  { color: theme.colors.error },
                ]}
              >
                متأخرة - لم تكتمل
              </Text>
            )}
          </View>
        </View>
        <View style={styles.taskRight}>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => deleteTask(item.id)}
          >
            <Ionicons
              name="trash-outline"
              size={18}
              color={theme.colors.error}
            />
          </TouchableOpacity>
          <Ionicons
            name={getTaskIcon(item.type)}
            size={20}
            color={theme.colors.textSecondary}
          />
        </View>
      </View>
      <View style={styles.taskFooter}>
        <Text style={[styles.dueDate, { color: theme.colors.textSecondary }]}>
          مستحقة: {formatArabicDate(item.dueDate)}
        </Text>
      </View>
    </Card>
  );

  const renderAddTaskForm = () => (
    <Card style={styles.addTaskForm}>
      <Input
        label="عنوان المهمة"
        value={newTask}
        onChangeText={setNewTask}
        placeholder="أدخل عنوان المهمة..."
        leftIcon="add-circle"
      />
      <Input
        label="الوصف (اختياري)"
        value={newTaskDescription}
        onChangeText={setNewTaskDescription}
        placeholder="أدخل وصف المهمة..."
        multiline
        numberOfLines={3}
      />
      <View style={styles.addTaskActions}>
        <Button
          title="إلغاء"
          onPress={() => {
            setShowAddTask(false);
            setNewTask('');
            setNewTaskDescription('');
          }}
          variant="outline"
          size="small"
        />
        <Button
          title="إضافة مهمة"
          onPress={addTask}
          size="small"
        />
      </View>
    </Card>
  );


  const completedTasks = tasks.filter(task => task.completed);
  const pendingTasks = tasks.filter(task => !task.completed);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          المهام والواجبات
        </Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={[styles.refreshButton, { backgroundColor: theme.colors.surface }]}
            onPress={refreshTasks}
          >
            <Ionicons name="refresh" size={20} color={theme.colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: theme.colors.primary }]}
            onPress={() => setShowAddTask(!showAddTask)}
          >
            <Ionicons name="add" size={24} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
      >
        {showAddTask && renderAddTaskForm()}

        <View style={styles.statsContainer}>
          <Card style={styles.statCard}>
            <Text style={[styles.statNumber, { color: theme.colors.primary }]}>
              {pendingTasks.length}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
              المهام اللي في الانتظار
            </Text>
          </Card>
          <Card style={styles.statCard}>
            <Text style={[styles.statNumber, { color: theme.colors.success }]}>
              {completedTasks.length}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
              مكتملة
            </Text>
          </Card>
          <Card style={styles.statCard}>
            <Text style={[styles.statNumber, { color: theme.colors.error }]}>
              {tasks.filter(task => 
                !task.completed && 
                task.isOverdue
              ).length}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
              متأخرة
            </Text>
          </Card>
        </View>

        <Text style={[styles.sectionTitle, { color: theme.colors.text, textAlign: 'right' }]}>
          المهام في الانتظار
        </Text>
        {pendingTasks.length > 0 ? (
          <FlatList
            data={pendingTasks}
            renderItem={renderTaskItem}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
          />
        ) : (
          <Card style={styles.emptyState}>
            <Ionicons name="checkmark-circle-outline" size={48} color={theme.colors.textSecondary} />
            <Text style={[styles.emptyStateText, { color: theme.colors.textSecondary }]}>
              لا توجد مهام في الانتظار
            </Text>
            <Text style={[styles.emptyStateSubtext, { color: theme.colors.textSecondary }]}>
              اضغط زر "+" لإضافة مهمة جديدة
            </Text>
          </Card>
        )}

        {completedTasks.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { color: theme.colors.text, textAlign: 'right' }]}>
              المهام المكتملة
            </Text>
            <FlatList
              data={completedTasks}
              renderItem={renderTaskItem}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
            />
          </>
        )}
      </ScrollView>
      
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  lockMessage: {
    fontSize: 18,
    textAlign: 'center',
    marginTop: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  scrollContent: {
    paddingBottom: 120, // مساحة كافية لشريط التنقل السفلي
  },
  addTaskForm: {
    marginBottom: 16,
  },
  addTaskActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 4,
    paddingVertical: 16,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  taskItem: {
    marginBottom: 12,
  },
  completedTask: {
    opacity: 0.7,
  },
  overdueTask: {
    borderLeftWidth: 4,
    borderLeftColor: '#ff4444',
  },
  taskHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  taskLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  taskInfo: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  taskDescription: {
    fontSize: 14,
  },
  taskRight: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
  },
  deleteButton: {
    padding: 8,
    marginRight: 8,
  },
  taskFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  dueDate: {
    fontSize: 12,
  },
  overdueText: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 16,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
});

export default TasksScreen;
