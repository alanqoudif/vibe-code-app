-- سياسات الأمان (Row Level Security) لجدول events
-- يجب تشغيل هذه الاستعلامات في Supabase Dashboard > SQL Editor

-- تفعيل RLS على جدول events
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- سياسة للسماح للمستخدمين برؤية أحداثهم فقط
CREATE POLICY "Users can view own events" ON public.events
FOR SELECT USING (auth.uid() = user_id);

-- سياسة للسماح للمستخدمين بإدراج أحداثهم فقط
CREATE POLICY "Users can insert own events" ON public.events
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- سياسة للسماح للمستخدمين بتحديث أحداثهم فقط
CREATE POLICY "Users can update own events" ON public.events
FOR UPDATE USING (auth.uid() = user_id);

-- سياسة للسماح للمستخدمين بحذف أحداثهم فقط
CREATE POLICY "Users can delete own events" ON public.events
FOR DELETE USING (auth.uid() = user_id);

-- تفعيل Real-time للجدول
ALTER PUBLICATION supabase_realtime ADD TABLE public.events;

-- التحقق من السياسات
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'events';

-- التحقق من تفعيل RLS
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'events';
