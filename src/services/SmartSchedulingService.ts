import { Class, Task } from '../types';
import { getDayNameFromDateObject } from '../utils/dayUtils';

export class SmartSchedulingService {
  static parseTimetableText(text: string): Class[] {
    const classes: Class[] = [];
    const lines = text.split('\n').filter(line => line.trim());

    console.log(`Parsing timetable text with ${lines.length} lines`);

    lines.forEach((line, index) => {
      try {
        // Parse different formats of timetable text
        const classData = this.parseTimetableLine(line);
        if (classData) {
          classes.push({
            ...classData,
            id: `class_${Date.now()}_${index}`,
            recurring: true,
          });
        }
      } catch (error) {
        console.error('Error parsing timetable line:', line, error);
      }
    });

    // If no classes found with standard patterns, try alternative parsing
    if (classes.length === 0) {
      console.log('No classes found with standard patterns, trying alternative parsing');
      const alternativeClasses = this.parseAlternativeFormats(text);
      classes.push(...alternativeClasses);
    }

    console.log(`Successfully parsed ${classes.length} classes`);
    return classes;
  }

  private static parseTimetableLine(line: string): Partial<Class> | null {
    // Remove extra whitespace and normalize
    const normalizedLine = line.trim().toLowerCase();

    // Pattern 1: "Monday: 9:00 AM - Math, 11:00 AM - Science"
    const dayTimePattern = /^(\w+):\s*(.+)$/;
    const dayTimeMatch = normalizedLine.match(dayTimePattern);
    
    if (dayTimeMatch) {
      const day = this.normalizeDay(dayTimeMatch[1]);
      const timeSubjects = dayTimeMatch[2];
      
      // Split by comma to get multiple classes for the same day
      const classEntries = timeSubjects.split(',').map(entry => entry.trim());
      
      const classes: Partial<Class>[] = [];
      classEntries.forEach(entry => {
        const classData = this.parseTimeSubject(entry, day);
        if (classData) {
          classes.push(classData);
        }
      });
      
      return classes.length === 1 ? classes[0] : null; // Return single class or null for multiple
    }

    // Pattern 2: "9:00 AM - Math - Monday"
    const timeSubjectDayPattern = /^(\d{1,2}:?\d{0,2}\s*(?:am|pm|ص|م)?)\s*[-–—]\s*(.+?)\s*[-–—]\s*(\w+)$/i;
    const timeSubjectDayMatch = normalizedLine.match(timeSubjectDayPattern);
    
    if (timeSubjectDayMatch) {
      const time = this.normalizeTime(timeSubjectDayMatch[1]);
      const subject = timeSubjectDayMatch[2].trim();
      const day = this.normalizeDay(timeSubjectDayMatch[3]);
      
      return {
        name: subject,
        subject: subject,
        time: time,
        day: day,
        color: this.getRandomColor(),
      };
    }

    // Pattern 3: "Math 9:00 AM Monday"
    const subjectTimeDayPattern = /^(.+?)\s+(\d{1,2}:?\d{0,2}\s*(?:am|pm|ص|م)?)\s+(\w+)$/i;
    const subjectTimeDayMatch = normalizedLine.match(subjectTimeDayPattern);
    
    if (subjectTimeDayMatch) {
      const subject = subjectTimeDayMatch[1].trim();
      const time = this.normalizeTime(subjectTimeDayMatch[2]);
      const day = this.normalizeDay(subjectTimeDayMatch[3]);
      
      return {
        name: subject,
        subject: subject,
        time: time,
        day: day,
        color: this.getRandomColor(),
      };
    }

    // Pattern 4: Table row format (Day | Time | Subject)
    const tableRowPattern = /^(.+?)\s*\|\s*(.+?)\s*\|\s*(.+?)$/;
    const tableRowMatch = normalizedLine.match(tableRowPattern);
    
    if (tableRowMatch) {
      const day = this.normalizeDay(tableRowMatch[1]);
      const time = this.normalizeTime(tableRowMatch[2]);
      const subject = tableRowMatch[3].trim();
      
      return {
        name: subject,
        subject: subject,
        time: time,
        day: day,
        color: this.getRandomColor(),
      };
    }

    // Pattern 5: Tab-separated format
    const tabPattern = /^(.+?)\s+\t\s*(.+?)\s+\t\s*(.+?)$/;
    const tabMatch = normalizedLine.match(tabPattern);
    
    if (tabMatch) {
      const day = this.normalizeDay(tabMatch[1]);
      const time = this.normalizeTime(tabMatch[2]);
      const subject = tabMatch[3].trim();
      
      return {
        name: subject,
        subject: subject,
        time: time,
        day: day,
        color: this.getRandomColor(),
      };
    }

    return null;
  }

  private static parseTimeSubject(entry: string, day: string): Partial<Class> | null {
    // Pattern 1: "9:00 AM - Math" or "9:00 - Math"
    const timeSubjectPattern = /^(\d{1,2}:?\d{0,2}\s*(?:am|pm|ص|م)?)\s*[-–—]\s*(.+)$/i;
    const match = entry.match(timeSubjectPattern);
    
    if (match) {
      const time = this.normalizeTime(match[1]);
      const subject = match[2].trim();
      
      return {
        name: subject,
        subject: subject,
        time: time,
        day: day,
        color: this.getRandomColor(),
      };
    }

    // Pattern 2: "9:00 AM Math" (without dash)
    const timeSubjectNoDashPattern = /^(\d{1,2}:?\d{0,2}\s*(?:am|pm|ص|م)?)\s+(.+)$/i;
    const matchNoDash = entry.match(timeSubjectNoDashPattern);
    
    if (matchNoDash) {
      const time = this.normalizeTime(matchNoDash[1]);
      const subject = matchNoDash[2].trim();
      
      return {
        name: subject,
        subject: subject,
        time: time,
        day: day,
        color: this.getRandomColor(),
      };
    }

    // Pattern 3: "Math 9:00 AM" (subject first)
    const subjectTimePattern = /^(.+?)\s+(\d{1,2}:?\d{0,2}\s*(?:am|pm|ص|م)?)$/i;
    const subjectTimeMatch = entry.match(subjectTimePattern);
    
    if (subjectTimeMatch) {
      const subject = subjectTimeMatch[1].trim();
      const time = this.normalizeTime(subjectTimeMatch[2]);
      
      return {
        name: subject,
        subject: subject,
        time: time,
        day: day,
        color: this.getRandomColor(),
      };
    }

    return null;
  }

  // Alternative parsing methods for different table formats
  private static parseAlternativeFormats(text: string): Class[] {
    const classes: Class[] = [];
    
    // Method 1: Extract all time patterns and try to match with nearby text
    const timeMatches = [...text.matchAll(/(\d{1,2}:?\d{0,2}\s*(?:AM|PM|am|pm|ص|م)?)/g)];
    
    for (const timeMatch of timeMatches) {
      const time = this.normalizeTime(timeMatch[0]);
      const timeIndex = timeMatch.index!;
      
      // Look for context around the time
      const contextStart = Math.max(0, timeIndex - 50);
      const contextEnd = Math.min(text.length, timeIndex + 100);
      const context = text.substring(contextStart, contextEnd);
      
      // Try to extract day and subject from context
      const dayMatch = context.match(/(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday|الاثنين|الثلاثاء|الأربعاء|الخميس|الجمعة|السبت|الأحد|اثنين|ثلاثاء|أربعاء|خميس|جمعة|سبت|أحد)/i);
      const subjectMatch = context.match(/[\u0600-\u06FF\s]{3,}|[A-Za-z\s]{3,}/);
      
      if (dayMatch && subjectMatch) {
        const day = this.normalizeDay(dayMatch[0]);
        const subject = subjectMatch[0].trim();
        
        if (subject.length > 2 && !subject.match(/^\d+$/)) {
          classes.push({
            id: `class_${Date.now()}_${classes.length}`,
            name: subject,
            subject: subject,
            time: time,
            day: day,
            color: this.getRandomColor(),
            recurring: true,
          });
        }
      }
    }
    
    // Method 2: Parse table-like structures
    const tableRows = text.split('\n').filter(line => line.includes('|') || line.includes('\t'));
    for (const row of tableRows) {
      const columns = row.split(/[|\t]/).map(col => col.trim()).filter(col => col.length > 0);
      if (columns.length >= 3) {
        const day = this.normalizeDay(columns[0]);
        const time = this.normalizeTime(columns[1]);
        const subject = columns[2];
        
        if (day && time && subject && subject.length > 2) {
          classes.push({
            id: `class_${Date.now()}_${classes.length}`,
            name: subject,
            subject: subject,
            time: time,
            day: day,
            color: this.getRandomColor(),
            recurring: true,
          });
        }
      }
    }
    
    return classes;
  }

  private static normalizeDay(day: string): string {
    const dayMap: { [key: string]: string } = {
      // English
      'monday': 'Monday', 'mon': 'Monday',
      'tuesday': 'Tuesday', 'tue': 'Tuesday', 'tues': 'Tuesday',
      'wednesday': 'Wednesday', 'wed': 'Wednesday',
      'thursday': 'Thursday', 'thu': 'Thursday', 'thur': 'Thursday',
      'friday': 'Friday', 'fri': 'Friday',
      'saturday': 'Saturday', 'sat': 'Saturday',
      'sunday': 'Sunday', 'sun': 'Sunday',
      
      // Arabic
      'الاثنين': 'Monday', 'اثنين': 'Monday',
      'الثلاثاء': 'Tuesday', 'ثلاثاء': 'Tuesday',
      'الأربعاء': 'Wednesday', 'أربعاء': 'Wednesday',
      'الخميس': 'Thursday', 'خميس': 'Thursday',
      'الجمعة': 'Friday', 'جمعة': 'Friday',
      'السبت': 'Saturday', 'سبت': 'Saturday',
      'الأحد': 'Sunday', 'أحد': 'Sunday',
      
      // Numbers - JavaScript getDay() format: 0=Sunday, 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday
      '0': 'Sunday', '1': 'Monday', '2': 'Tuesday', '3': 'Wednesday',
      '4': 'Thursday', '5': 'Friday', '6': 'Saturday'
    };

    return dayMap[day.toLowerCase()] || day;
  }

  private static normalizeTime(time: string): string {
    // Convert to 24-hour format
    const timeStr = time.trim().toLowerCase();
    
    // Handle Arabic time indicators
    const arabicTime = timeStr.replace(/ص|صباح/g, 'am').replace(/م|مساء/g, 'pm');
    
    // Handle AM/PM
    if (arabicTime.includes('am') || arabicTime.includes('pm')) {
      const [timePart, period] = arabicTime.split(/\s*(am|pm)/);
      const [hours, minutes] = timePart.split(':').map(Number);
      
      let hour24 = hours;
      if (period === 'pm' && hours !== 12) {
        hour24 += 12;
      } else if (period === 'am' && hours === 12) {
        hour24 = 0;
      }
      
      return `${hour24.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }
    
    // Already in 24-hour format or just needs padding
    const [hours, minutes] = timeStr.split(':').map(Number);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }

  private static getRandomColor(): string {
    const colors = [
      '#6366f1', // Indigo
      '#8b5cf6', // Purple
      '#10b981', // Emerald
      '#f59e0b', // Amber
      '#ef4444', // Red
      '#06b6d4', // Cyan
      '#84cc16', // Lime
      '#f97316', // Orange
    ];
    
    return colors[Math.floor(Math.random() * colors.length)];
  }

  static generateSmartTasks(classes: Class[]): Task[] {
    const tasks: Task[] = [];
    const today = new Date();

    classes.forEach((classData, index) => {
      // Generate homework task for each class (due in 3 days)
      const homeworkDueDate = new Date(today);
      homeworkDueDate.setDate(homeworkDueDate.getDate() + 3);

      const homeworkTask: Task = {
        id: `homework_${classData.id}_${index}`,
        title: `${classData.subject} Homework`,
        description: `Complete homework assignment for ${classData.name}`,
        dueDate: homeworkDueDate,
        priority: 'medium',
        completed: false,
        classId: classData.id,
        type: 'homework',
      };

      tasks.push(homeworkTask);

      // Generate study session task (due in 1 day)
      const studyDueDate = new Date(today);
      studyDueDate.setDate(studyDueDate.getDate() + 1);

      const studyTask: Task = {
        id: `study_${classData.id}_${index}`,
        title: `Study ${classData.subject}`,
        description: `Review notes and prepare for ${classData.name}`,
        dueDate: studyDueDate,
        priority: 'high',
        completed: false,
        classId: classData.id,
        type: 'assignment',
      };

      tasks.push(studyTask);
    });

    return tasks;
  }

  static getUpcomingClasses(classes: Class[], days: number = 7): Class[] {
    const today = new Date();
    const upcomingClasses: Class[] = [];

    for (let i = 0; i < days; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() + i);
      
      const dayName = getDayNameFromDateObject(checkDate);
      const dayClasses = classes.filter(cls => cls.day === dayName);
      
      upcomingClasses.push(...dayClasses);
    }

    return upcomingClasses.sort((a, b) => a.time.localeCompare(b.time));
  }

  static getClassesForToday(classes: Class[]): Class[] {
    const today = new Date();
    const dayName = getDayNameFromDateObject(today);
    
    return classes
      .filter(cls => cls.days && cls.days.includes(dayName))
      .sort((a, b) => a.time.localeCompare(b.time));
  }

  static getNextClass(classes: Class[]): Class | null {
    const todayClasses = this.getClassesForToday(classes);
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    const upcomingToday = todayClasses.filter(cls => cls.time > currentTime);
    
    if (upcomingToday.length > 0) {
      return upcomingToday[0];
    }

    // If no classes today, get the next class from upcoming days
    const upcomingClasses = this.getUpcomingClasses(classes, 7);
    return upcomingClasses.length > 0 ? upcomingClasses[0] : null;
  }

  static getStudySuggestions(classes: Class[], tasks: Task[]): string[] {
    const suggestions: string[] = [];
    const today = new Date();
    const dayName = getDayNameFromDateObject(today);
    
    const todayClasses = classes.filter(cls => cls.days && cls.days.includes(dayName));
    const pendingTasks = tasks.filter(task => !task.completed);
    const urgentTasks = pendingTasks.filter(task => {
      const daysUntilDue = Math.ceil((task.dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return daysUntilDue <= 2;
    });

    if (urgentTasks.length > 0) {
      suggestions.push(`You have ${urgentTasks.length} urgent task(s) due soon. Focus on completing them first.`);
    }

    if (todayClasses.length > 0) {
      suggestions.push(`You have ${todayClasses.length} class(es) today. Review your notes beforehand.`);
    }

    if (pendingTasks.length > 5) {
      suggestions.push('You have many pending tasks. Consider breaking them into smaller, manageable chunks.');
    }

    const nextClass = this.getNextClass(classes);
    if (nextClass) {
      suggestions.push(`Your next class is ${nextClass.name} at ${nextClass.time}. Make sure you're prepared!`);
    }

    if (suggestions.length === 0) {
      suggestions.push('Great job! You seem to be on top of your studies. Keep up the good work!');
    }

    return suggestions;
  }
}
