-- اختبار نهائي للتأكد من عمل قاعدة البيانات
-- تشغيل هذا الملف في Supabase SQL Editor

-- 1. التحقق من جميع البيانات الموجودة
SELECT 
    'All Events' as test_name,
    COUNT(*) as total_count
FROM public.events;

-- 2. عرض جميع الأحداث مع تفاصيلها
SELECT 
    'Event Details' as test_name,
    id,
    user_id,
    title,
    event_date,
    event_time,
    selected_days,
    location,
    created_at
FROM public.events 
ORDER BY created_at DESC;

-- 3. اختبار استعلام مشابه لما يفعله التطبيق
SELECT 
    'App-like Query' as test_name,
    id,
    user_id,
    title,
    event_date,
    event_time,
    selected_days,
    location,
    event_type,
    reminder_minutes,
    created_at,
    updated_at
FROM public.events 
WHERE user_id = '781fde0b-1202-4e9c-b284-3b4c5f6be1b7'  -- استخدم user_id من النتيجة السابقة
ORDER BY event_date ASC, event_time ASC;

-- 4. اختبار تحويل selected_days (كما يفعله التطبيق)
SELECT 
    'Selected Days Conversion' as test_name,
    id,
    title,
    selected_days,
    array_length(selected_days, 1) as day_count,
    -- محاكاة تحويل التطبيق
    array_agg(
        INITCAP(LOWER(day)) 
        ORDER BY day
    ) as converted_days
FROM public.events,
LATERAL unnest(selected_days) as day
WHERE user_id = '781fde0b-1202-4e9c-b284-3b4c5f6be1b7'
GROUP BY id, title, selected_days
ORDER BY created_at DESC;

-- 5. اختبار Real-time (التحقق من أن الجدول في النشر)
SELECT 
    'Real-time Check' as test_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_publication_tables 
            WHERE pubname = 'supabase_realtime' 
            AND tablename = 'events'
        ) THEN 'Real-time enabled'
        ELSE 'Real-time NOT enabled'
    END as realtime_status;

-- 6. اختبار السياسات
SELECT 
    'RLS Policies' as test_name,
    policyname,
    cmd,
    CASE 
        WHEN qual LIKE '%auth.uid()%' THEN 'Uses auth.uid()'
        ELSE 'Other condition'
    END as auth_check
FROM pg_policies 
WHERE tablename = 'events'
ORDER BY policyname;

-- 7. إحصائيات نهائية
SELECT 
    'Final Statistics' as test_name,
    COUNT(*) as total_events,
    COUNT(DISTINCT user_id) as unique_users,
    COUNT(CASE WHEN selected_days IS NOT NULL AND array_length(selected_days, 1) > 0 THEN 1 END) as events_with_days,
    COUNT(CASE WHEN location IS NOT NULL AND location != '' THEN 1 END) as events_with_location,
    MIN(created_at) as oldest_event,
    MAX(created_at) as newest_event
FROM public.events;
