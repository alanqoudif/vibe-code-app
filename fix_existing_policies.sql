-- إصلاح السياسات الموجودة إذا لزم الأمر
-- تشغيل هذا الملف في Supabase Dashboard > SQL Editor

-- 1. حذف السياسات الموجودة وإعادة إنشائها (إذا لزم الأمر)
DO $$
BEGIN
    -- حذف السياسات الموجودة
    DROP POLICY IF EXISTS "Users can view own events" ON public.events;
    DROP POLICY IF EXISTS "Users can insert own events" ON public.events;
    DROP POLICY IF EXISTS "Users can update own events" ON public.events;
    DROP POLICY IF EXISTS "Users can delete own events" ON public.events;
    
    RAISE NOTICE 'Existing policies dropped';
    
    -- إعادة إنشاء السياسات
    CREATE POLICY "Users can view own events" ON public.events
    FOR SELECT USING (auth.uid() = user_id);
    
    CREATE POLICY "Users can insert own events" ON public.events
    FOR INSERT WITH CHECK (auth.uid() = user_id);
    
    CREATE POLICY "Users can update own events" ON public.events
    FOR UPDATE USING (auth.uid() = user_id);
    
    CREATE POLICY "Users can delete own events" ON public.events
    FOR DELETE USING (auth.uid() = user_id);
    
    RAISE NOTICE 'New policies created successfully';
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error: %', SQLERRM;
END $$;

-- 2. التأكد من تفعيل RLS
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- 3. التأكد من إضافة الجدول للنشر
ALTER PUBLICATION supabase_realtime ADD TABLE public.events;

-- 4. التحقق من النتيجة
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    cmd,
    CASE 
        WHEN qual LIKE '%auth.uid()%' THEN 'Uses auth.uid()'
        ELSE 'Other condition'
    END as auth_check
FROM pg_policies 
WHERE tablename = 'events'
ORDER BY policyname;
