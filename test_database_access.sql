-- اختبار الوصول لقاعدة البيانات
-- تشغيل هذا الملف في Supabase Dashboard > SQL Editor

-- 1. اختبار الوصول الأساسي
SELECT 'Database connection successful' as status;

-- 2. التحقق من وجود الجدول
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'events') 
        THEN 'Events table exists' 
        ELSE 'Events table NOT found' 
    END as table_status;

-- 3. التحقق من عدد السجلات
SELECT 
    COUNT(*) as total_events,
    COUNT(DISTINCT user_id) as unique_users
FROM public.events;

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
LIMIT 10;

-- 5. التحقق من أنواع البيانات
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'events'
ORDER BY ordinal_position;

-- 6. اختبار إدراج سجل تجريبي (للمستخدم الحالي)
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
    auth.uid(),
    'Test Event - ' || NOW()::text,
    'This is a test event to verify database access',
    CURRENT_DATE,
    '10:00 AM',
    'Test Location',
    ARRAY['Monday', 'Wednesday']::text[],
    'lecture',
    15
) RETURNING id, title, created_at;

-- 7. التحقق من السجل المضاف
SELECT 
    id,
    title,
    user_id,
    created_at
FROM public.events 
WHERE title LIKE 'Test Event%'
ORDER BY created_at DESC 
LIMIT 5;

-- 8. حذف السجلات التجريبية (اختياري)
-- DELETE FROM public.events WHERE title LIKE 'Test Event%';
