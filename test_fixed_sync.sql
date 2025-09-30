-- اختبار المزامنة بعد الإصلاح
-- تشغيل هذا الملف في Supabase SQL Editor

-- 1. فحص البيانات الجديدة (آخر ساعة)
SELECT 
    'Recent Events Check' as test_name,
    id,
    title,
    selected_days,
    pg_typeof(selected_days) as actual_type,
    created_at
FROM public.events 
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;

-- 2. فحص تنسيق البيانات
SELECT 
    'Data Format Check' as test_name,
    pg_typeof(selected_days) as data_type,
    COUNT(*) as count,
    array_agg(DISTINCT LEFT(selected_days::text, 20)) as sample_data
FROM public.events 
WHERE selected_days IS NOT NULL
GROUP BY pg_typeof(selected_days)
ORDER BY count DESC;

-- 3. اختبار إدراج بيانات جديدة (محاكاة التطبيق)
INSERT INTO public.events (
    id,
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
    gen_random_uuid(),
    '781fde0b-1202-4e9c-b284-3b4c5f6be1b7', -- استخدام user_id موجود
    'Test Event - Fixed Format',
    'Test event with correct text[] format',
    '2025-09-26',
    '14:30:00',
    'Test Location',
    ARRAY['monday', 'wednesday', 'friday']::text[], -- تنسيق text[] صحيح
    'lecture',
    15
)
RETURNING id, title, selected_days, pg_typeof(selected_days) as data_type;

-- 4. التحقق من البيانات المدرجة
SELECT 
    'Inserted Event Check' as test_name,
    id,
    title,
    selected_days,
    pg_typeof(selected_days) as actual_type,
    created_at
FROM public.events 
WHERE title = 'Test Event - Fixed Format'
ORDER BY created_at DESC;
