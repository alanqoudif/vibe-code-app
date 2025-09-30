import { supabase } from '../lib/supabase';
import Constants from 'expo-constants';
import { filterClassesByTime, filterClassesBySubject, filterClassesByDay } from '../utils/dayUtils';

export interface TimetableFilterRequest {
  query: string;
  userId?: string;
  classes: any[];
  currentDate?: string;
}

export interface TimetableFilterResponse {
  filteredClasses: any[];
  suggestions: string[];
  success: boolean;
  error?: string;
}

export interface SmartScheduleRequest {
  userId: string;
  preferences: {
    studyHours: number;
    breakDuration: number;
    preferredTimes: string[];
    subjects: string[];
  };
  currentClasses: any[];
}

export interface SmartScheduleResponse {
  schedule: {
    day: string;
    timeSlots: {
      time: string;
      activity: string;
      subject?: string;
      duration: number;
    }[];
  }[];
  success: boolean;
  error?: string;
}

export class TimetableAIService {
  private static readonly OPENAI_ENDPOINT = 'https://api.openai.com/v1/chat/completions';

  /**
   * Get OpenAI API key from multiple sources
   */
  private static getOpenAIApiKey(): string | null {
    const sources = [
      Constants.expoConfig?.extra?.openaiApiKey,
      process.env.EXPO_PUBLIC_OPENAI_API_KEY
    ];

    for (const source of sources) {
      if (source && source.startsWith('sk-') && source.length > 20) {
        return source;
      }
    }

    return null;
  }

  /**
   * Filter timetable classes using AI based on natural language query
   */
  static async filterTimetableByQuery(request: TimetableFilterRequest): Promise<TimetableFilterResponse> {
    try {
      console.log('🤖 AI Timetable Filter - Processing query:', request.query);
      
      const openaiApiKey = this.getOpenAIApiKey();
      
      if (!openaiApiKey) {
        console.log('⚠️ No OpenAI API key found - using fallback filtering');
        return this.getFallbackFilterResponse(request);
      }

      // Get user context if userId is provided
      let userContext = '';
      if (request.userId) {
        userContext = await this.getUserContext(request.userId);
      }

      // Prepare classes data for AI analysis
      const classesData = request.classes.map(cls => ({
        id: cls.id,
        name: cls.name,
        time: cls.time,
        days: cls.days,
        location: cls.location,
        subject: cls.subject,
        type: cls.type
      }));

      const systemPrompt = `أنت مساعد ذكي متخصص في فلترة الجداول الدراسية. مهمتك هي فهم استعلامات الطلاب الطبيعية وفلترة الحصص الدراسية بناءً عليها.

المهام:
1. فهم الاستعلام الطبيعي للطالب (مثل "حصص اليوم"، "حصص الرياضيات"، "حصص الصباح")
2. فلترة الحصص الدراسية بناءً على الاستعلام
3. تقديم اقتراحات مفيدة للطالب

قواعد الفلترة:
- "اليوم" أو "هذا اليوم" = الحصص المجدولة اليوم
- "غداً" = الحصص المجدولة غداً
- "هذا الأسبوع" = جميع حصص الأسبوع الحالي
- "الصباح" = الحصص من 6:00 صباحاً إلى 12:00 ظهراً
- "المساء" = الحصص من 12:00 ظهراً إلى 6:00 مساءً
- "الليل" = الحصص من 6:00 مساءً إلى 12:00 ليلاً
- اسم المادة = الحصص المتعلقة بهذه المادة
- اسم اليوم = الحصص في هذا اليوم

${userContext}

البيانات المتاحة:
${JSON.stringify(classesData, null, 2)}

التاريخ الحالي: ${request.currentDate || new Date().toISOString().split('T')[0]}

أجب بصيغة JSON فقط:
{
  "filteredClasses": [مصفوفة الحصص المفلترة],
  "suggestions": [مصفوفة الاقتراحات],
  "reasoning": "شرح سبب الفلترة"
}`;

      const response = await fetch(this.OPENAI_ENDPOINT, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: request.query }
          ],
          max_tokens: 1500,
          temperature: 0.3
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API Error: ${response.status}`);
      }

      const data = await response.json();
      const aiResponse = data.choices?.[0]?.message?.content;

      if (!aiResponse) {
        throw new Error('No response from AI');
      }

      // Parse AI response
      const parsedResponse = JSON.parse(aiResponse);
      
      return {
        filteredClasses: parsedResponse.filteredClasses || [],
        suggestions: parsedResponse.suggestions || [],
        success: true
      };

    } catch (error) {
      console.error('❌ AI Timetable Filter Error:', error);
      return this.getFallbackFilterResponse(request);
    }
  }

  /**
   * Generate smart schedule suggestions using AI
   */
  static async generateSmartSchedule(request: SmartScheduleRequest): Promise<SmartScheduleResponse> {
    try {
      console.log('🤖 AI Smart Schedule - Generating schedule for user:', request.userId);
      
      const openaiApiKey = this.getOpenAIApiKey();
      
      if (!openaiApiKey) {
        console.log('⚠️ No OpenAI API key found - using fallback schedule');
        return this.getFallbackScheduleResponse(request);
      }

      const systemPrompt = `أنت مساعد ذكي متخصص في إنشاء الجداول الدراسية المثلى. مهمتك هي إنشاء جدول دراسة شخصي بناءً على تفضيلات الطالب وحصصه الحالية.

المبادئ:
1. احترام الحصص المجدولة مسبقاً
2. توزيع أوقات الدراسة بشكل متوازن
3. إدراج فترات راحة مناسبة
4. مراعاة التفضيلات الشخصية
5. تجنب الإرهاق والضغط

${JSON.stringify(request, null, 2)}

أجب بصيغة JSON فقط:
{
  "schedule": [
    {
      "day": "الأحد",
      "timeSlots": [
        {
          "time": "08:00",
          "activity": "دراسة",
          "subject": "الرياضيات",
          "duration": 90
        }
      ]
    }
  ],
  "reasoning": "شرح الجدول المقترح"
}`;

      const response = await fetch(this.OPENAI_ENDPOINT, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: systemPrompt }
          ],
          max_tokens: 2000,
          temperature: 0.4
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API Error: ${response.status}`);
      }

      const data = await response.json();
      const aiResponse = data.choices?.[0]?.message?.content;

      if (!aiResponse) {
        throw new Error('No response from AI');
      }

      const parsedResponse = JSON.parse(aiResponse);
      
      return {
        schedule: parsedResponse.schedule || [],
        success: true
      };

    } catch (error) {
      console.error('❌ AI Smart Schedule Error:', error);
      return this.getFallbackScheduleResponse(request);
    }
  }

  /**
   * Get user context from Supabase
   */
  private static async getUserContext(userId: string): Promise<string> {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      const { data: events } = await supabase
        .from('events')
        .select('*')
        .eq('user_id', userId)
        .order('event_date', { ascending: true })
        .limit(10);

      return `
بيانات الطالب:
- الاسم: ${profile?.full_name || 'غير محدد'}
- الجامعة: ${profile?.university || 'غير محدد'}
- التخصص: ${profile?.major || 'غير محدد'}

الحصص الحالية:
${events && events.length > 0 ? events.map(event => 
  `- ${event.title} (${event.event_type}) في ${event.event_date} الساعة ${event.event_time || 'غير محدد'}`
).join('\n') : 'لا توجد حصص مجدولة'}`;

    } catch (error) {
      console.error('Error fetching user context:', error);
      return '';
    }
  }

  /**
   * Fallback filter response when AI is not available
   */
  private static getFallbackFilterResponse(request: TimetableFilterRequest): TimetableFilterResponse {
    const query = request.query.toLowerCase();
    let filteredClasses = request.classes;
    const suggestions: string[] = [];

    console.log('🔍 Fallback filtering for query:', query);
    console.log('📚 Available classes:', request.classes.length);

    // Simple keyword-based filtering
    if (query.includes('اليوم') || query.includes('هذا اليوم')) {
      const today = new Date();
      const todayDayName = today.toLocaleDateString('en-US', { weekday: 'long' });
      console.log('📅 Today is:', todayDayName);
      
      filteredClasses = request.classes.filter((cls: any) => {
        if (!cls.days || !Array.isArray(cls.days)) return false;
        const hasToday = cls.days.some((day: string) => 
          day.toLowerCase() === todayDayName.toLowerCase()
        );
        console.log(`Class ${cls.name} days:`, cls.days, 'has today:', hasToday);
        return hasToday;
      });
      suggestions.push('يمكنك أيضاً عرض حصص الأسبوع أو حصص مادة معينة');
    } else if (query.includes('غداً')) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowDayName = tomorrow.toLocaleDateString('en-US', { weekday: 'long' });
      console.log('📅 Tomorrow is:', tomorrowDayName);
      
      filteredClasses = request.classes.filter((cls: any) => {
        if (!cls.days || !Array.isArray(cls.days)) return false;
        return cls.days.some((day: string) => 
          day.toLowerCase() === tomorrowDayName.toLowerCase()
        );
      });
      suggestions.push('يمكنك أيضاً عرض حصص هذا الأسبوع');
    } else if (query.includes('الصباح')) {
      filteredClasses = filterClassesByTime(request.classes, 'morning');
      suggestions.push('يمكنك أيضاً عرض حصص المساء أو الليل');
    } else if (query.includes('المساء')) {
      filteredClasses = filterClassesByTime(request.classes, 'afternoon');
      suggestions.push('يمكنك أيضاً عرض حصص الصباح أو الليل');
    } else if (query.includes('الليل')) {
      filteredClasses = filterClassesByTime(request.classes, 'evening');
      suggestions.push('يمكنك أيضاً عرض حصص الصباح أو المساء');
    } else if (query.includes('الرياضيات') || query.includes('رياضيات')) {
      filteredClasses = filterClassesBySubject(request.classes, 'رياضيات');
      suggestions.push('يمكنك أيضاً البحث عن مواد أخرى مثل الفيزياء أو الكيمياء');
    } else if (query.includes('الفيزياء') || query.includes('فيزياء')) {
      filteredClasses = filterClassesBySubject(request.classes, 'فيزياء');
      suggestions.push('يمكنك أيضاً البحث عن مواد أخرى مثل الرياضيات أو الكيمياء');
    } else if (query.includes('الكيمياء') || query.includes('كيمياء')) {
      filteredClasses = filterClassesBySubject(request.classes, 'كيمياء');
      suggestions.push('يمكنك أيضاً البحث عن مواد أخرى مثل الرياضيات أو الفيزياء');
    } else if (query.includes('اللغة الإنجليزية') || query.includes('إنجليزي')) {
      filteredClasses = filterClassesBySubject(request.classes, 'إنجليزي');
      suggestions.push('يمكنك أيضاً البحث عن مواد أخرى مثل الرياضيات أو الفيزياء');
    } else if (query.includes('البرمجة') || query.includes('برمجة')) {
      filteredClasses = filterClassesBySubject(request.classes, 'برمجة');
      suggestions.push('يمكنك أيضاً البحث عن مواد أخرى مثل الرياضيات أو الفيزياء');
    } else if (query.includes('الاثنين') || query.includes('اثنين')) {
      filteredClasses = filterClassesByDay(request.classes, 'Monday');
      suggestions.push('يمكنك أيضاً البحث عن أيام أخرى مثل الثلاثاء أو الأربعاء');
    } else if (query.includes('الثلاثاء') || query.includes('ثلاثاء')) {
      filteredClasses = filterClassesByDay(request.classes, 'Tuesday');
      suggestions.push('يمكنك أيضاً البحث عن أيام أخرى مثل الاثنين أو الأربعاء');
    } else if (query.includes('الأربعاء') || query.includes('أربعاء')) {
      filteredClasses = filterClassesByDay(request.classes, 'Wednesday');
      suggestions.push('يمكنك أيضاً البحث عن أيام أخرى مثل الثلاثاء أو الخميس');
    } else if (query.includes('الخميس') || query.includes('خميس')) {
      filteredClasses = filterClassesByDay(request.classes, 'Thursday');
      suggestions.push('يمكنك أيضاً البحث عن أيام أخرى مثل الأربعاء أو الجمعة');
    } else if (query.includes('الجمعة') || query.includes('جمعة')) {
      filteredClasses = filterClassesByDay(request.classes, 'Friday');
      suggestions.push('يمكنك أيضاً البحث عن أيام أخرى مثل الخميس أو السبت');
    } else if (query.includes('الأحد') || query.includes('أحد')) {
      filteredClasses = filterClassesByDay(request.classes, 'Sunday');
      suggestions.push('يمكنك أيضاً البحث عن أيام أخرى مثل الاثنين أو الثلاثاء');
    } else if (query.includes('السبت') || query.includes('سبت')) {
      filteredClasses = filterClassesByDay(request.classes, 'Saturday');
      suggestions.push('يمكنك أيضاً البحث عن أيام أخرى مثل الجمعة أو الأحد');
    }

    console.log('✅ Filtered classes count:', filteredClasses.length);
    console.log('📋 Suggestions:', suggestions);

    return {
      filteredClasses,
      suggestions,
      success: true
    };
  }

  /**
   * Fallback schedule response when AI is not available
   */
  private static getFallbackScheduleResponse(request: SmartScheduleRequest): SmartScheduleResponse {
    const schedule = [
      {
        day: 'الأحد',
        timeSlots: [
          { time: '08:00', activity: 'دراسة', subject: 'الرياضيات', duration: 90 },
          { time: '10:00', activity: 'استراحة', duration: 15 },
          { time: '10:15', activity: 'دراسة', subject: 'الفيزياء', duration: 90 }
        ]
      },
      {
        day: 'الاثنين',
        timeSlots: [
          { time: '09:00', activity: 'دراسة', subject: 'الكيمياء', duration: 90 },
          { time: '11:00', activity: 'استراحة', duration: 15 },
          { time: '11:15', activity: 'مراجعة', subject: 'الرياضيات', duration: 60 }
        ]
      }
    ];

    return {
      schedule,
      success: true
    };
  }

  /**
   * Test AI service connection
   */
  static async testConnection(): Promise<boolean> {
    try {
      const response = await this.filterTimetableByQuery({
        query: 'حصص اليوم',
        classes: []
      });
      return response.success;
    } catch (error) {
      console.error('AI Timetable connection test failed:', error);
      return false;
    }
  }
}
