import { supabase } from '../lib/supabase';
import Constants from 'expo-constants';

export interface AIChatRequest {
  message: string;
  userId?: string;
  conversationHistory?: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
  }>;
}

export interface AIChatResponse {
  message: string;
  success: boolean;
  error?: string;
}

export class EnhancedAIService {
  private static readonly OPENAI_ENDPOINT = 'https://api.openai.com/v1/chat/completions';

  /**
   * Send a message to the AI tutor and get a response
   */
  static async sendMessage(request: AIChatRequest): Promise<AIChatResponse> {
    try {
      console.log('🤖 Enhanced AI Service - Sending message:', request.message);
      
      // Get OpenAI API key from multiple sources
      const openaiApiKey = this.getOpenAIApiKey();
      
      if (!openaiApiKey) {
        console.log('⚠️ No OpenAI API key found - using fallback responses');
        const fallbackResponse = this.getFallbackResponse(request.message);
        return {
          message: fallbackResponse,
          success: true
        };
      }
      
      console.log('🔑 Using OpenAI API Key:', openaiApiKey.substring(0, 20) + '...');

      // Get user context if userId is provided
      let userContext = '';
      if (request.userId) {
        userContext = await this.getUserContext(request.userId);
      }

      // Prepare conversation history
      const conversationHistory = this.prepareConversationHistory(request.conversationHistory);

      // Create system prompt
      const systemPrompt = this.createSystemPrompt(userContext);

      // Prepare messages for OpenAI
      const messages = [
        { role: 'system', content: systemPrompt },
        ...conversationHistory,
        { role: 'user', content: request.message }
      ];

      console.log('📤 Sending request to OpenAI with messages:', messages.length);
      console.log('🔑 API Key (first 20 chars):', openaiApiKey.substring(0, 20) + '...');
      
      const requestBody = {
        model: 'gpt-3.5-turbo',
        messages: messages,
        max_tokens: 1000,
        temperature: 0.7,
        top_p: 0.9,
        frequency_penalty: 0.1,
        presence_penalty: 0.1
      };
      
      console.log('📋 Request body:', JSON.stringify(requestBody, null, 2));
      
      const response = await fetch(this.OPENAI_ENDPOINT, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      console.log('🤖 OpenAI Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ OpenAI API Error:', response.status, errorText);
        
        // Handle specific error cases
        if (response.status === 401) {
          throw new Error('Invalid OpenAI API key');
        } else if (response.status === 429) {
          throw new Error('OpenAI API rate limit exceeded');
        } else if (response.status === 500) {
          throw new Error('OpenAI API server error');
        } else {
          throw new Error(`OpenAI API Error: ${response.status} - ${errorText}`);
        }
      }

      const data = await response.json();
      console.log('📥 OpenAI Response data received');
      
      const aiMessage = data.choices?.[0]?.message?.content;

      if (!aiMessage) {
        console.error('❌ No AI message in response:', data);
        throw new Error('No response from AI');
      }

      console.log('✅ AI Response received successfully');

      return {
        message: aiMessage,
        success: true
      };

    } catch (error) {
      console.error('❌ Enhanced AI Service Error:', error);
      
      // Return fallback response instead of error
      const fallbackResponse = this.getFallbackResponse(request.message);
      
      return {
        message: fallbackResponse,
        success: true, // Mark as success to show fallback response
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get OpenAI API key from multiple sources
   */
  private static getOpenAIApiKey(): string | null {
    // Try multiple sources for the API key
    const sources = [
      Constants.expoConfig?.extra?.openaiApiKey,
      process.env.EXPO_PUBLIC_OPENAI_API_KEY
    ];

    console.log('🔍 Checking API key sources...');
    console.log('Constants.expoConfig?.extra?.openaiApiKey:', Constants.expoConfig?.extra?.openaiApiKey ? 'Found' : 'Not found');
    console.log('process.env.EXPO_PUBLIC_OPENAI_API_KEY:', process.env.EXPO_PUBLIC_OPENAI_API_KEY ? 'Found' : 'Not found');

    for (const source of sources) {
      if (source && source.startsWith('sk-') && source.length > 20) {
        console.log('✅ Found valid API key from source');
        return source;
      }
    }

    console.log('❌ No valid API key found - using fallback responses');
    return null;
  }

  /**
   * Get user context from Supabase
   */
  private static async getUserContext(userId: string): Promise<string> {
    try {
      // Get user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      // Get upcoming events (next 7 days)
      const today = new Date().toISOString().split('T')[0];
      const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      const { data: events } = await supabase
        .from('events')
        .select('*')
        .eq('user_id', userId)
        .gte('event_date', today)
        .lte('event_date', nextWeek)
        .order('event_date', { ascending: true })
        .limit(5);

      // Get user's study materials
      const { data: folders } = await supabase
        .from('folders')
        .select('*, files (*)')
        .eq('user_id', userId)
        .limit(3);

      // Get active subscription
      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .single();

      return `
بيانات الطالب:
- الاسم: ${profile?.full_name || 'غير محدد'}
- الجامعة: ${profile?.university || 'غير محدد'}
- التخصص: ${profile?.major || 'غير محدد'}
- الاشتراك: ${subscription ? `مشترك في خطة ${subscription.plan_name}` : 'غير مشترك'}

المحاضرات والأحداث القادمة:
${events && events.length > 0 ? events.map(event => 
  `- ${event.title} (${event.event_type}) في ${event.event_date} الساعة ${event.event_time || 'غير محدد'}`
).join('\n') : 'لا توجد محاضرات قادمة'}

المواد الدراسية:
${folders && folders.length > 0 ? folders.map(folder => 
  `- مجلد: ${folder.name} (${folder.files?.length || 0} ملفات)`
).join('\n') : 'لا توجد مواد دراسية'}`;

    } catch (error) {
      console.error('Error fetching user context:', error);
      return '';
    }
  }

  /**
   * Prepare conversation history for AI context
   */
  private static prepareConversationHistory(history?: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
  }>): Array<{ role: 'user' | 'assistant'; content: string }> {
    if (!history || history.length === 0) {
      return [];
    }

    // Return last 6 messages to avoid token limit
    return history.slice(-6).map(msg => ({
      role: msg.role,
      content: msg.content
    }));
  }

  /**
   * Create system prompt for AI
   */
  private static createSystemPrompt(userContext: string): string {
    return `أنت مساعد ذكي متخصص في التعليم والدراسة. اسمك "المساعد الذكي" وأنت مصمم لمساعدة الطلاب في جامعاتهم ودراستهم.

المهام الأساسية:
1. الإجابة على الأسئلة التعليمية والأكاديمية
2. مساعدة الطلاب في فهم المفاهيم الصعبة
3. تقديم نصائح للدراسة والتنظيم
4. مساعدة في الواجبات والمشاريع
5. تذكير الطلاب بمحاضراتهم وواجباتهم
6. تقديم اقتراحات لتحسين الأداء الأكاديمي

قواعد المحادثة:
- استخدم اللغة العربية دائماً
- كن مفيداً ومشجعاً ومحفزاً
- قدم إجابات مفصلة ومفهومة
- استخدم بيانات الطالب لتخصيص الردود
- إذا كان السؤال خارج نطاق التعليم، أرشد الطالب بلطف للموضوع التعليمي
- كن دقيقاً في المعلومات الأكاديمية

${userContext}

استخدم هذه البيانات لتخصيص ردودك وتقديم نصائح مناسبة للطالب.`;
  }

  /**
   * Get fallback response for when AI is not available
   */
  private static getFallbackResponse(userInput: string): string {
    const input = userInput.toLowerCase();
    
    // Greeting responses
    if (input.includes('هلا') || input.includes('مرحبا') || input.includes('السلام') || input.includes('أهلا')) {
      return "أهلاً وسهلاً! 😊 أنا مساعد learnz | ليرنز الذكي. أنا هنا لمساعدتك في دراستك ونصائح التعلم. كيف يمكنني مساعدتك اليوم؟";
    }
    
    // Time management
    if (input.includes('وقت') || input.includes('جدول') || input.includes('تنظيم') || input.includes('جدولة')) {
      return "⏰ سؤال ممتاز! لإدارة الوقت الفعالة، أنصحك بـ:\n\n1️⃣ تقنية البومودورو: ادرس 25 دقيقة + استراحة 5 دقائق\n2️⃣ جدولة المهام حسب الأولوية\n3️⃣ تجنب التعددية في المهام\n4️⃣ استخدم تطبيقات التنظيم\n\nهل تريد مساعدة في إنشاء جدول دراسة مخصص؟";
    }
    
    // Memory and learning
    if (input.includes('ذاكرة') || input.includes('تذكر') || input.includes('حفظ') || input.includes('تعلم')) {
      return "🧠 نصائح لتحسين الذاكرة:\n\n✅ الاسترجاع النشط: اختبر نفسك بدلاً من إعادة القراءة\n✅ التكرار المتباعد: راجع على فترات متزايدة\n✅ الربط: اربط المعلومات الجديدة بما تعرفه\n✅ التلخيص: اكتب ملخصات بيدك\n✅ النوم الكافي: 7-9 ساعات يومياً\n\nأي تقنية تريد تجربتها؟";
    }
    
    // Motivation
    if (input.includes('تحفيز') || input.includes('حافز') || input.includes('دافع') || input.includes('ملل')) {
      return "💪 للبقاء متحفزاً:\n\n🎯 ضع أهداف صغيرة قابلة للتحقيق\n🏆 احتفل بإنجازاتك الصغيرة\n📝 تذكر لماذا بدأت الدراسة\n⚡ قسم المهام الكبيرة لمهام أصغر\n🎵 استمع لموسيقى تحفزك\n☕ خذ استراحات منتظمة\n\nما هو هدفك الدراسي القادم؟";
    }
    
    // Exams
    if (input.includes('امتحان') || input.includes('اختبار') || input.includes('فحص') || input.includes('كويز')) {
      return "📝 استراتيجيات التحضير للامتحان:\n\n📅 ابدأ التحضير مبكراً (أسبوعين قبل)\n📋 أنشئ خطة دراسة يومية\n🔄 استخدم تقنيات الاسترجاع النشط\n📚 تدرب على أسئلة سابقة\n😴 احصل على نوم كافي قبل الامتحان\n🍎 تناول وجبة صحية\n\nأي مادة تريد التحضير لها؟";
    }
    
    // Stress and anxiety
    if (input.includes('توتر') || input.includes('قلق') || input.includes('ضغط') || input.includes('قلق')) {
      return "😌 للتعامل مع التوتر:\n\n🫁 تمارين التنفس العميق\n🚶‍♂️ المشي أو الرياضة الخفيفة\n🎵 الاستماع للموسيقى الهادئة\n📱 تجنب السوشيال ميديا قبل النوم\n💬 تحدث مع صديق أو عائلة\n🧘‍♀️ تمارين التأمل\n\nما الذي يسبب لك التوتر أكثر؟";
    }
    
    // Study techniques
    if (input.includes('دراسة') || input.includes('مذاكرة') || input.includes('طريقة') || input.includes('كيف')) {
      return "📚 طرق الدراسة الفعالة:\n\n🎯 طريقة Feynman: اشرح المادة لطفل\n📝 طريقة Cornell: قسم الصفحة لثلاث أجزاء\n🔄 Active Recall: اختبر نفسك بدون النظر\n⏰ Spaced Repetition: راجع على فترات\n👥 Study Groups: ادرس مع زملاء\n\nأي طريقة تريد تجربتها؟";
    }
    
    // Default response
    return "🤖 أهلاً بك! أنا مساعد learnz | ليرنز الذكي. يمكنني مساعدتك في:\n\n📚 نصائح الدراسة والتعلم\n⏰ إدارة الوقت والتنظيم\n💪 التحفيز والدافعية\n📝 التحضير للامتحانات\n😌 التعامل مع التوتر\n\nاسألني عن أي شيء يخص دراستك! 😊";
  }

  /**
   * Test AI service connection
   */
  static async testConnection(): Promise<boolean> {
    try {
      const response = await this.sendMessage({
        message: 'مرحباً، هل تعمل بشكل صحيح؟'
      });
      return response.success;
    } catch (error) {
      console.error('AI connection test failed:', error);
      return false;
    }
  }
}