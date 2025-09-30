import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

interface ChatRequest {
  message: string;
  userId?: string;
  conversationHistory?: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
  }>;
}

interface UserContext {
  profile: any;
  events: any[];
  folders: any[];
  subscription: any;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('=== Enhanced AI Tutor Chat Function Started ===');
    
    const { message, userId, conversationHistory = [] }: ChatRequest = await req.json();
    
    console.log('Received request:', {
      message: message.substring(0, 100) + '...',
      userId,
      historyLength: conversationHistory.length
    });

    if (!message?.trim()) {
      throw new Error('Message is required');
    }

    // Validate OpenAI API key
    const openaiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiKey) {
      console.error('OPENAI_API_KEY not found in environment');
      throw new Error('OpenAI API key not configured');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase configuration missing');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get enhanced user context
    const userContext = await getUserContext(supabase, userId);

    // Build conversation context
    const conversationContext = buildConversationContext(conversationHistory);

    // Create enhanced system prompt
    const systemPrompt = createSystemPrompt(userContext, conversationContext);

    // Call OpenAI with enhanced parameters
    const aiResponse = await callOpenAI(openaiKey, systemPrompt, message, conversationHistory);

    // Log successful response
    console.log('✅ AI Response generated successfully');

    return new Response(JSON.stringify({
      message: aiResponse,
      success: true,
      timestamp: new Date().toISOString()
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });

  } catch (error) {
    console.error('❌ Error in ai-tutor-chat function:', error);
    
    return new Response(JSON.stringify({
      error: error.message,
      message: 'عذراً، حدث خطأ. يرجى المحاولة مرة أخرى.',
      success: false
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
});

async function getUserContext(supabase: any, userId?: string): Promise<UserContext> {
  if (!userId) {
    return {
      profile: null,
      events: [],
      folders: [],
      subscription: null
    };
  }

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
      .limit(10);

    // Get user's study materials
    const { data: folders } = await supabase
      .from('folders')
      .select('*, files (*)')
      .eq('user_id', userId)
      .limit(5);

    // Get active subscription
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    return {
      profile,
      events: events || [],
      folders: folders || [],
      subscription
    };
  } catch (error) {
    console.error('Error fetching user context:', error);
    return {
      profile: null,
      events: [],
      folders: [],
      subscription: null
    };
  }
}

function buildConversationContext(history: any[]): string {
  if (history.length === 0) return '';

  const recentHistory = history.slice(-6); // Last 6 messages
  return `\n\nالمحادثة السابقة:\n${recentHistory.map(msg => 
    `${msg.role === 'user' ? 'الطالب' : 'المساعد'}: ${msg.content}`
  ).join('\n')}`;
}

function createSystemPrompt(userContext: UserContext, conversationContext: string): string {
  const { profile, events, folders, subscription } = userContext;

  const contextData = profile ? `
بيانات الطالب:
- الاسم: ${profile.full_name || 'غير محدد'}
- الجامعة: ${profile.university || 'غير محدد'}
- التخصص: ${profile.major || 'غير محدد'}
- رقم الهاتف: ${profile.phone_number || 'غير محدد'}
- الاشتراك: ${subscription ? `مشترك في خطة ${subscription.plan_name}` : 'غير مشترك'}

المحاضرات والأحداث القادمة (الأسبوع القادم):
${events.length > 0 ? events.map(event => 
  `- ${event.title} (${event.event_type}) في ${event.event_date} الساعة ${event.event_time || 'غير محدد'}`
).join('\n') : 'لا توجد محاضرات قادمة'}

المواد الدراسية:
${folders.length > 0 ? folders.map(folder => 
  `- مجلد: ${folder.name} (${folder.files?.length || 0} ملفات)`
).join('\n') : 'لا توجد مواد دراسية'}` : '';

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
- استخدم المحادثة السابقة لفهم السياق بشكل أفضل
- كن دقيقاً في المعلومات الأكاديمية

${contextData}${conversationContext}

استخدم هذه البيانات لتخصيص ردودك وتقديم نصائح مناسبة للطالب.`;
}

async function callOpenAI(apiKey: string, systemPrompt: string, message: string, history: any[]): Promise<string> {
  const messages = [
    { role: 'system', content: systemPrompt },
    ...history.slice(-10).map(msg => ({
      role: msg.role,
      content: msg.content
    })),
    { role: 'user', content: message }
  ];

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-5-nano',
      messages,
      max_tokens: 1000,
      temperature: 0.7,
      top_p: 0.9,
      frequency_penalty: 0.1,
      presence_penalty: 0.1
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('OpenAI API error:', errorText);
    throw new Error(`OpenAI API Error: ${response.status}`);
  }

  const data = await response.json();
  const aiMessage = data.choices?.[0]?.message?.content;

  if (!aiMessage) {
    throw new Error('No response from AI');
  }

  return aiMessage;
}
