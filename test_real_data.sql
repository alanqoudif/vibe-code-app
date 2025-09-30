-- اختبار البيانات الفعلية من قاعدة البيانات
-- تشغيل هذا الملف في Supabase SQL Editor

-- 1. عرض عينة من البيانات الفعلية
SELECT 
    'Real Data Sample' as test_name,
    id,
    user_id,
    title,
    event_date,
    event_time,
    selected_days,
    location,
    event_type,
    created_at
FROM public.events 
ORDER BY created_at DESC 
LIMIT 10;

-- 2. فحص أنواع selected_days المختلفة
SELECT 
    'Selected Days Types' as test_name,
    selected_days,
    pg_typeof(selected_days) as data_type,
    CASE 
        WHEN pg_typeof(selected_days)::text = 'jsonb' THEN 'JSONB'
        WHEN pg_typeof(selected_days)::text = 'text[]' THEN 'Text Array'
        WHEN pg_typeof(selected_days)::text = 'json' THEN 'JSON'
        ELSE 'Other'
    END as format_type
FROM public.events 
WHERE selected_days IS NOT NULL
GROUP BY selected_days, pg_typeof(selected_days)
ORDER BY MAX(created_at) DESC
LIMIT 10;

-- 3. اختبار تحويل JSON إلى array
SELECT 
    'JSON to Array Test' as test_name,
    id,
    title,
    selected_days,
    -- تحويل JSON إلى array
    CASE 
        WHEN pg_typeof(selected_days)::text = 'jsonb' THEN
            array_agg(
                INITCAP(LOWER(key)) 
                ORDER BY key
            )
        ELSE selected_days
    END as converted_days
FROM public.events,
LATERAL jsonb_object_keys(selected_days::jsonb) as key
WHERE pg_typeof(selected_days)::text = 'jsonb'
GROUP BY id, title, selected_days, pg_typeof(selected_days)
ORDER BY created_at DESC
LIMIT 10;

-- 4. اختبار استعلام مشابه لما يفعله التطبيق
SELECT 
    'App Query Test' as test_name,
    id,
    user_id,
    title,
    event_date,
    event_time,
    selected_days,
    location,
    event_type,
    created_at
FROM public.events 
WHERE user_id = '781fde0b-1202-4e9c-b284-3b4c5f6be1b7'  -- مستخدم من البيانات
ORDER BY event_date ASC, event_time ASC;

-- 5. إحصائيات البيانات
SELECT 
    'Data Statistics' as test_name,
    COUNT(*) as total_events,
    COUNT(DISTINCT user_id) as unique_users,
    COUNT(CASE WHEN selected_days IS NOT NULL THEN 1 END) as events_with_days,
    COUNT(CASE WHEN pg_typeof(selected_days)::text = 'jsonb' THEN 1 END) as jsonb_events,
    COUNT(CASE WHEN pg_typeof(selected_days)::text = 'text[]' THEN 1 END) as text_array_events,
    MIN(created_at) as oldest_event,
    MAX(created_at) as newest_event
FROM public.events;
