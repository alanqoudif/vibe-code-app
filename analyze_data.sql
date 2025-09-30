-- تحليل البيانات الموجودة في قاعدة البيانات
-- تشغيل هذا الملف في Supabase SQL Editor

-- 1. إحصائيات عامة
SELECT 
    'General Statistics' as section,
    COUNT(*) as total_events,
    COUNT(DISTINCT user_id) as unique_users,
    MIN(created_at) as oldest_event,
    MAX(created_at) as newest_event
FROM public.events;

-- 2. تفاصيل المستخدمين
SELECT 
    'User Details' as section,
    user_id,
    COUNT(*) as event_count,
    array_agg(DISTINCT title ORDER BY title) as event_titles,
    MIN(created_at) as first_event,
    MAX(created_at) as last_event
FROM public.events 
GROUP BY user_id
ORDER BY event_count DESC;

-- 3. تفاصيل الأحداث
SELECT 
    'Event Details' as section,
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

-- 4. فحص أنواع البيانات
SELECT 
    'Data Types' as section,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'events'
ORDER BY ordinal_position;

-- 5. فحص selected_days بشكل مفصل
SELECT 
    'Selected Days Analysis' as section,
    id,
    title,
    selected_days,
    pg_typeof(selected_days) as data_type,
    array_length(selected_days, 1) as array_length,
    CASE 
        WHEN selected_days IS NULL THEN 'NULL'
        WHEN array_length(selected_days, 1) = 0 THEN 'Empty Array'
        ELSE 'Has Data'
    END as status
FROM public.events 
WHERE selected_days IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;

-- 6. فحص الأحداث الفارغة أو المشكوك فيها
SELECT 
    'Problematic Events' as section,
    id,
    user_id,
    title,
    event_date,
    event_time,
    selected_days,
    CASE 
        WHEN user_id IS NULL THEN 'Missing user_id'
        WHEN title IS NULL OR title = '' THEN 'Missing title'
        WHEN selected_days IS NULL THEN 'Missing selected_days'
        WHEN array_length(selected_days, 1) = 0 THEN 'Empty selected_days'
        ELSE 'OK'
    END as issue
FROM public.events 
WHERE user_id IS NULL 
   OR title IS NULL 
   OR title = '' 
   OR selected_days IS NULL 
   OR array_length(selected_days, 1) = 0
ORDER BY created_at DESC;
