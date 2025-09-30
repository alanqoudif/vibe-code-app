-- اختبار آمن لقاعدة البيانات
-- تشغيل هذا الملف في Supabase SQL Editor

-- 1. التحقق من الاتصال
SELECT 'Database connection successful' as status;

-- 2. التحقق من وجود الجدول
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'events') 
        THEN 'Events table exists' 
        ELSE 'Events table NOT found' 
    END as table_status;

-- 3. التحقق من عدد السجلات
SELECT COUNT(*) as total_events FROM public.events;

-- 4. عرض عينة من البيانات
SELECT 
    id,
    user_id,
    title,
    event_date,
    event_time,
    selected_days,
    created_at
FROM public.events 
ORDER BY created_at DESC 
LIMIT 5;

-- 5. التحقق من أنواع البيانات
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'events'
AND column_name IN ('selected_days', 'user_id', 'title', 'event_date', 'event_time')
ORDER BY ordinal_position;

-- 6. عرض المستخدمين الموجودين
SELECT 
    user_id,
    COUNT(*) as event_count,
    MIN(created_at) as first_event,
    MAX(created_at) as last_event
FROM public.events 
GROUP BY user_id
ORDER BY event_count DESC;

-- 7. اختبار إدراج سجل تجريبي (فقط إذا كان هناك مستخدمين موجودين)
DO $$
DECLARE
    test_user_id UUID;
BEGIN
    -- البحث عن أول user_id موجود
    SELECT user_id INTO test_user_id 
    FROM public.events 
    LIMIT 1;
    
    IF test_user_id IS NOT NULL THEN
        -- إدراج سجل تجريبي
        INSERT INTO public.events (
            user_id, 
            title, 
            description, 
            event_date, 
            event_time, 
            location, 
            selected_days, 
            event_type, 
            reminder_minutes
        ) VALUES (
            test_user_id,
            'Test Event - ' || NOW()::text,
            'This is a test event created by SQL',
            CURRENT_DATE,
            '10:00 AM',
            'Test Location',
            ARRAY['Monday', 'Wednesday']::text[],
            'lecture',
            15
        );
        
        RAISE NOTICE 'Test event created successfully for user: %', test_user_id;
    ELSE
        RAISE NOTICE 'No existing users found, skipping test insert';
    END IF;
END $$;

-- 8. التحقق من السجلات التجريبية
SELECT 
    id,
    title,
    user_id,
    selected_days,
    created_at
FROM public.events 
WHERE title LIKE 'Test Event%'
ORDER BY created_at DESC 
LIMIT 3;

-- 9. حذف السجلات التجريبية (اختياري)
-- DELETE FROM public.events WHERE title LIKE 'Test Event%';
