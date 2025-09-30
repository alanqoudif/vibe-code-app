// اختبار النظام الجديد للتواريخ
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAY_NAMES_ARABIC = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

const formatDateOnly = (date) => {
  const dateObj = typeof date === 'string' ? new Date(date + 'T12:00:00') : date;
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const isSameDate = (date1, date2) => {
  const formattedDate1 = formatDateOnly(date1);
  const formattedDate2 = formatDateOnly(date2);
  return formattedDate1 === formattedDate2;
};

const getDayNameFromDate = (date) => {
  const dateObj = new Date(date + 'T12:00:00');
  const dayIndex = dateObj.getDay();
  return DAY_NAMES[dayIndex];
};

const createWeekDateMap = (weekStart) => {
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

const isDayMatch = (classDays, targetDay) => {
  if (!classDays || !Array.isArray(classDays) || !targetDay) {
    return false;
  }
  
  const targetDayLower = targetDay.toLowerCase().trim();
  const targetDayNormalized = targetDay.charAt(0).toUpperCase() + targetDay.slice(1).toLowerCase();
  
  return classDays.some(classDay => {
    if (!classDay || typeof classDay !== 'string') return false;
    
    const classDayTrimmed = classDay.trim();
    const classDayLower = classDayTrimmed.toLowerCase();
    const classDayNormalized = classDay.charAt(0).toUpperCase() + classDay.slice(1).toLowerCase();
    
    return classDayTrimmed === targetDay ||
           classDayLower === targetDayLower ||
           classDayNormalized === targetDayNormalized;
  });
};

const getClassesForSpecificDate = (classes, targetDate) => {
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

console.log('=== اختبار النظام الجديد للتواريخ ===');

// اختبار التواريخ
const testDate = '2025-01-06'; // هذا يجب أن يكون الاثنين
console.log(`التاريخ: ${testDate}`);
console.log(`اسم اليوم: ${getDayNameFromDate(testDate)}`);

// اختبار إنشاء خريطة الأسبوع
const currentWeek = new Date('2025-01-06'); // الاثنين
console.log('\n=== خريطة الأسبوع ===');
const weekMap = createWeekDateMap(currentWeek);
weekMap.forEach((dateInfo, index) => {
  console.log(`اليوم ${index + 1}: ${dateInfo.date} -> ${dateInfo.dayName} (${dateInfo.dayNameArabic})`);
});

// اختبار الحصص
const sampleClasses = [
  {
    id: '1',
    name: 'MATH2100',
    days: ['Monday'],
    time: '09:00:00'
  },
  {
    id: '2',
    name: 'COMP2131',
    days: ['Tuesday'],
    time: '10:00:00'
  },
  {
    id: '3',
    name: 'علوم',
    days: ['Monday', 'Wednesday'],
    time: '11:00:00'
  },
  {
    id: '4',
    name: 'تاريخ',
    days: ['Sunday'],
    time: '08:00:00'
  }
];

console.log('\n=== اختبار فلترة الحصص ===');

// اختبار الاثنين
const mondayDate = '2025-01-06'; // الاثنين
console.log(`\nفلترة الحصص للتاريخ: ${mondayDate} (${getDayNameFromDate(mondayDate)})`);
const mondayClasses = getClassesForSpecificDate(sampleClasses, mondayDate);
console.log(`عدد الحصص: ${mondayClasses.length}`);
mondayClasses.forEach(cls => {
  console.log(`- ${cls.name} في ${cls.time}`);
});

// اختبار الثلاثاء
const tuesdayDate = '2025-01-07'; // الثلاثاء
console.log(`\nفلترة الحصص للتاريخ: ${tuesdayDate} (${getDayNameFromDate(tuesdayDate)})`);
const tuesdayClasses = getClassesForSpecificDate(sampleClasses, tuesdayDate);
console.log(`عدد الحصص: ${tuesdayClasses.length}`);
tuesdayClasses.forEach(cls => {
  console.log(`- ${cls.name} في ${cls.time}`);
});

// اختبار الأحد
const sundayDate = '2025-01-05'; // الأحد
console.log(`\nفلترة الحصص للتاريخ: ${sundayDate} (${getDayNameFromDate(sundayDate)})`);
const sundayClasses = getClassesForSpecificDate(sampleClasses, sundayDate);
console.log(`عدد الحصص: ${sundayClasses.length}`);
sundayClasses.forEach(cls => {
  console.log(`- ${cls.name} في ${cls.time}`);
});

console.log('\n=== اختبار مقارنة التواريخ ===');
console.log(`هل ${mondayDate} يساوي ${mondayDate}? ${isSameDate(mondayDate, mondayDate)}`);
console.log(`هل ${mondayDate} يساوي ${tuesdayDate}? ${isSameDate(mondayDate, tuesdayDate)}`);
console.log(`هل ${mondayDate} يساوي اليوم الحالي? ${isSameDate(mondayDate, new Date())}`);

