-- تشخيص مشكلة المزامنة
-- تشغيل هذا الملف في Supabase SQL Editor

-- 1. البحث عن الحدث المضاف
SELECT 
    'Event Added from Website' as test_name,
    id,
    user_id,
    title,
    event_date,
    event_time,
    selected_days,
    pg_typeof(selected_days) as data_type,
    created_at
FROM public.events 
WHERE id = 'a55a415a-78e0-4a86-b4e8-037a2d05134d';

-- 2. فحص جميع المستخدمين
SELECT 
    'All Users' as test_name,
    user_id,
    COUNT(*) as event_count,
    MIN(created_at) as first_event,
    MAX(created_at) as last_event
FROM public.events 
GROUP BY user_id
ORDER BY event_count DESC;

-- 3. فحص selected_days بتنسيقات مختلفة
SELECT 
    'Selected Days Formats' as test_name,
    id,
    title,
    selected_days,
    pg_typeof(selected_days) as data_type,
    CASE 
        WHEN pg_typeof(selected_days)::text = 'text[]' THEN 'Text Array'
        WHEN pg_typeof(selected_days)::text = 'jsonb' THEN 'JSONB'
        WHEN pg_typeof(selected_days)::text = 'json' THEN 'JSON'
        ELSE 'Other'
    END as format_type
FROM public.events 
WHERE selected_days IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;

-- 4. اختبار استعلام مشابه لما يفعله التطبيق
SELECT 
    'App Query Simulation' as test_name,
    id,
    user_id,
    title,
    event_date,
    event_time,
    selected_days,
    location,
    created_at
FROM public.events 
WHERE user_id = '9e8eff68-e157-4bcb-bce7-7701f6cca84c'  -- user_id من الحدث المضاف
ORDER BY event_date ASC, event_time ASC;

-- 5. فحص السياسات
SELECT 
    'RLS Policies Check' as test_name,
    policyname,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'events';

-- 6. اختبار Real-time
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
