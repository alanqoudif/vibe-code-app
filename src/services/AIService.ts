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

export class AIService {
  private static readonly OPENAI_ENDPOINT = 'https://api.openai.com/v1/chat/completions';

  /**
   * Send a message to the AI tutor and get a response
   */
  static async sendMessage(request: AIChatRequest): Promise<AIChatResponse> {
    try {
      console.log('🤖 Sending message to AI tutor:', request.message);
      
      // Get OpenAI API key from environment variables
      const openaiApiKey = Constants.expoConfig?.extra?.openaiApiKey || process.env.EXPO_PUBLIC_OPENAI_API_KEY;
      
      if (!openaiApiKey) {
        throw new Error('OpenAI API key not found. Please check your environment variables.');
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
      
      const response = await fetch(this.OPENAI_ENDPOINT, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: messages,
          max_tokens: 1000,
          temperature: 0.7,
          top_p: 0.9,
          frequency_penalty: 0.1,
          presence_penalty: 0.1
        })
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
      console.log('📥 OpenAI Response data:', JSON.stringify(data, null, 2));
      
      const aiMessage = data.choices?.[0]?.message?.content;

      if (!aiMessage) {
        console.error('❌ No AI message in response:', data);
        throw new Error('No response from AI');
      }

      console.log('✅ AI Response received:', aiMessage.substring(0, 100) + '...');

      return {
        message: aiMessage,
        success: true
      };

    } catch (error) {
      console.error('❌ AI Service Error:', error);
      
      return {
        message: 'عذراً، حدث خطأ في الاتصال بالمساعد الذكي. يرجى المحاولة مرة أخرى.',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
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

  /**
   * Get fallback response for when AI is not available
   */
  static getFallbackResponse(userInput: string): string {
    const input = userInput.toLowerCase();
    
    if (input.includes('وقت') || input.includes('جدول') || input.includes('تنظيم')) {
      return "سؤال رائع! لإدارة الوقت الفعالة، أنصحك بتقنية البومودورو. ادرس لمدة 25 دقيقة، ثم خذ استراحة لمدة 5 دقائق. هذا يساعد في الحفاظ على التركيز ويمنع الإرهاق. هل تريد مني مساعدتك في إنشاء جدول دراسة؟";
    }
    
    if (input.includes('ذاكرة') || input.includes('تذكر') || input.includes('حفظ')) {
      return "يمكن تحسين الاحتفاظ بالذاكرة من خلال الاسترجاع النشط والتكرار المتباعد. جرب اختبار نفسك على المادة بدلاً من إعادة القراءة فقط. أيضاً، راجع ملاحظاتك على فترات متزايدة - اليوم، غداً، في أسبوع، ثم في شهر.";
    }
    
    if (input.includes('تحفيز') || input.includes('حافز') || input.includes('دافع')) {
      return "البقاء متحفزاً يمكن أن يكون تحدياً! جرب وضع أهداف صغيرة قابلة للتحقيق والاحتفال بتقدمك. تذكر لماذا بدأت الدراسة في المقام الأول. قسم المهام الكبيرة إلى مهام أصغر، ولا تنس مكافأة نفسك عند إكمالها.";
    }
    
    if (input.includes('امتحان') || input.includes('اختبار') || input.includes('فحص')) {
      return "التحضير للامتحان كله يتعلق بالاستراتيجية! ابدأ مبكراً، أنشئ خطة دراسة، واستخدم تقنيات الاسترجاع النشط. تدرب على أوراق الامتحانات السابقة إذا كانت متاحة، وتأكد من الحصول على قسط كافٍ من النوم قبل الامتحان. هل تريد نصائح محددة لمادة معينة؟";
    }
    
    if (input.includes('توتر') || input.includes('قلق') || input.includes('ضغط')) {
      return "من الطبيعي أن تشعر بالتوتر بشأن الدراسة. جرب تمارين التنفس العميق، خذ استراحات منتظمة، وحافظ على روتين صحي. تذكر ممارسة الرياضة والحصول على قسط كافٍ من النوم. إذا أصبح التوتر ساحقاً، لا تتردد في التحدث مع شخص تثق به.";
    }
    
    if (input.includes('دراسة') || input.includes('مذاكرة') || input.includes('تعلم')) {
      return "هذا سؤال مثير للاهتمام! سأكون سعيداً لمساعدتك في استراتيجيات الدراسة، إدارة الوقت، التحفيز، أو أي مخاوف أكاديمية أخرى. هل يمكنك أن تكون أكثر تحديداً حول ما تريد أن تعرفه؟";
    }
    
    return "هذا سؤال مثير للاهتمام! سأكون سعيداً لمساعدتك في استراتيجيات الدراسة، إدارة الوقت، التحفيز، أو أي مخاوف أكاديمية أخرى. هل يمكنك أن تكون أكثر تحديداً حول ما تريد أن تعرفه؟";
  }
}
