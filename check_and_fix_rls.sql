-- التحقق من وإصلاح سياسات RLS الموجودة
-- تشغيل هذا الملف في Supabase Dashboard > SQL Editor

-- 1. التحقق من تفعيل RLS
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'events';

-- 2. عرض السياسات الموجودة
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'events';

-- 3. التحقق من تفعيل Real-time
SELECT schemaname, tablename, hasindexes, hasrules, hastriggers
FROM pg_tables 
WHERE tablename = 'events';

-- 4. التحقق من وجود الجدول في النشر
SELECT * FROM pg_publication_tables WHERE tablename = 'events';

-- 5. إذا لم يكن الجدول في النشر، أضفه
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'events'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.events;
        RAISE NOTICE 'Added events table to realtime publication';
    ELSE
        RAISE NOTICE 'Events table already in realtime publication';
    END IF;
END $$;

-- 6. التحقق من صلاحيات المستخدم الحالي
SELECT current_user, session_user;

-- 7. اختبار بسيط للوصول للجدول
SELECT COUNT(*) as total_events FROM public.events;

-- 8. التحقق من وجود user_id في الجدول
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'events' 
AND column_name = 'user_id';

-- 9. عرض عينة من البيانات
SELECT id, user_id, title, event_date, event_time, selected_days
FROM public.events 
LIMIT 5;
