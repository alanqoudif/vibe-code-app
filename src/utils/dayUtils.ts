// Utility functions for day name handling

// تثبيت أسماء الأيام بمصفوفة تبدأ من الأحد للسبت
export const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;
export const DAY_NAMES_ARABIC = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'] as const;

export const normalizeDayName = (day: string): string => {
  if (typeof day !== 'string') return day;
  return day.charAt(0).toUpperCase() + day.slice(1).toLowerCase();
};

export const normalizeDayNames = (days: string[]): string[] => {
  return days.map(day => normalizeDayName(day));
};

// دالة محسنة لحساب اسم اليوم من التاريخ مع تجنب مشاكل المنطقة الزمنية
export const getDayNameFromDate = (date: string): string => {
  // استخدام تاريخ محلي بدون مشاكل المنطقة الزمنية
  const dateObj = new Date(date + 'T12:00:00');
  const dayIndex = dateObj.getDay();
  // JavaScript getDay() returns: 0=Sunday, 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday
  return DAY_NAMES[dayIndex];
};

// دالة لحساب اسم اليوم من كائن Date
export const getDayNameFromDateObject = (date: Date): string => {
  const dayIndex = date.getDay();
  return DAY_NAMES[dayIndex];
};

// دالة جديدة: تحويل التاريخ إلى صيغة YYYY-MM-DD بدون وقت
export const formatDateOnly = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? new Date(date + 'T12:00:00') : date;
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// دالة جديدة: مقارنة التواريخ بدون وقت
export const isSameDate = (date1: string | Date, date2: string | Date): boolean => {
  const formattedDate1 = formatDateOnly(date1);
  const formattedDate2 = formatDateOnly(date2);
  return formattedDate1 === formattedDate2;
};

export const isDayMatch = (classDays: string[], targetDay: string): boolean => {
  if (!classDays || !Array.isArray(classDays) || !targetDay) {
    return false;
  }
  
  // Normalize target day to handle different formats
  const targetDayLower = targetDay.toLowerCase().trim();
  const targetDayNormalized = normalizeDayName(targetDay);
  
  // Check if any of the class days match the target day
  return classDays.some(classDay => {
    if (!classDay || typeof classDay !== 'string') return false;
    
    const classDayTrimmed = classDay.trim();
    const classDayLower = classDayTrimmed.toLowerCase();
    const classDayNormalized = normalizeDayName(classDayTrimmed);
    
    // Multiple matching strategies
    return classDayTrimmed === targetDay ||
           classDayLower === targetDayLower ||
           classDayNormalized === targetDayNormalized ||
           classDayLower.includes(targetDayLower) ||
           targetDayLower.includes(classDayLower);
  });
};

// دالة جديدة: فلترة الحصص بناءً على التاريخ الفعلي
export const getClassesForSpecificDate = (classes: any[], targetDate: string): any[] => {
  if (!classes || !Array.isArray(classes) || !targetDate) {
    return [];
  }
  
  // تحويل التاريخ المحدد إلى اسم اليوم
  const targetDayName = getDayNameFromDate(targetDate);
  
  // فلترة الحصص التي تحتوي على اليوم المحدد
  return classes.filter(cls => {
    if (!cls.days || !Array.isArray(cls.days)) {
      return false;
    }
    
    // التحقق من أن الحصة تحتوي على اليوم المحدد
    return isDayMatch(cls.days, targetDayName);
  });
};

// دالة جديدة: إنشاء خريطة تواريخ الأسبوع مع أسماء الأيام
export const createWeekDateMap = (weekStart: Date): { date: string; dayName: string; dayNameArabic: string }[] => {
  const dates = [];
  const start = new Date(weekStart);
  
  // العثور على الأحد من الأسبوع الحالي
  const dayOfWeek = start.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const sunday = new Date(start);
  sunday.setDate(start.getDate() - dayOfWeek); // العودة إلى الأحد
  
  // إنشاء التواريخ من الأحد إلى الخميس (5 أيام)
  for (let i = 0; i < 5; i++) {
    const date = new Date(sunday);
    date.setDate(sunday.getDate() + i);
    const dateString = formatDateOnly(date);
    const dayName = DAY_NAMES[date.getDay()];
    const dayNameArabic = DAY_NAMES_ARABIC[date.getDay()];
    
    dates.push({
      date: dateString,
      dayName: dayName,
      dayNameArabic: dayNameArabic
    });
  }
  
  return dates;
};

export const getCurrentWeekDates = (weekStart: Date): Date[] => {
  const dates = [];
  const start = new Date(weekStart);
  
  // Find Sunday of the current week بطريقة صحيحة
  // JavaScript getDay() returns: 0=Sunday, 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday
  const dayOfWeek = start.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const sunday = new Date(start);
  sunday.setDate(start.getDate() - dayOfWeek); // العودة إلى الأحد
  
  // Get Sunday to Thursday (5 days)
  for (let i = 0; i < 5; i++) {
    const date = new Date(sunday);
    date.setDate(sunday.getDate() + i);
    dates.push(date);
  }
  return dates;
};

// دالة جديدة: تحسين الفلترة حسب الوقت
export const filterClassesByTime = (classes: any[], timeFilter: 'morning' | 'afternoon' | 'evening'): any[] => {
  if (!classes || !Array.isArray(classes)) {
    return [];
  }

  return classes.filter(cls => {
    const time = cls.time;
    if (!time) return false;
    
    let hour = 0;
    if (time.includes('AM') || time.includes('PM')) {
      // 12-hour format
      const [timePart, period] = time.split(' ');
      const [hours] = timePart.split(':').map(Number);
      hour = hours;
      if (period === 'PM' && hours !== 12) hour += 12;
      if (period === 'AM' && hours === 12) hour = 0;
    } else {
      // 24-hour format
      hour = parseInt(time.split(':')[0]);
    }
    
    switch (timeFilter) {
      case 'morning':
        return hour >= 6 && hour < 12;
      case 'afternoon':
        return hour >= 12 && hour < 18;
      case 'evening':
        return hour >= 18 || hour < 6;
      default:
        return true;
    }
  });
};

// دالة جديدة: فلترة الحصص حسب المادة
export const filterClassesBySubject = (classes: any[], subject: string): any[] => {
  if (!classes || !Array.isArray(classes) || !subject) {
    return [];
  }

  const subjectLower = subject.toLowerCase();
  return classes.filter(cls => {
    return (cls.name && cls.name.toLowerCase().includes(subjectLower)) ||
           (cls.subject && cls.subject.toLowerCase().includes(subjectLower));
  });
};

// دالة جديدة: فلترة الحصص حسب اليوم
export const filterClassesByDay = (classes: any[], dayName: string): any[] => {
  if (!classes || !Array.isArray(classes) || !dayName) {
    return [];
  }

  return classes.filter(cls => {
    if (!cls.days || !Array.isArray(cls.days)) return false;
    return isDayMatch(cls.days, dayName);
  });
};
