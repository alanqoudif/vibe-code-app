-- اختبار إنشاء الأحداث من التطبيق
-- تشغيل هذا الملف في Supabase SQL Editor

-- 1. عرض أحدث الأحداث المضافة
SELECT 
    'Latest Events' as test_name,
    id,
    user_id,
    title,
    event_date,
    event_time,
    selected_days,
    pg_typeof(selected_days) as data_type,
    created_at
FROM public.events 
ORDER BY created_at DESC 
LIMIT 10;

-- 2. فحص تنسيق selected_days للأحداث الجديدة
SELECT 
    'New Events Format' as test_name,
    id,
    title,
    selected_days,
    pg_typeof(selected_days) as data_type,
    CASE 
        WHEN pg_typeof(selected_days)::text = 'jsonb' THEN 'JSONB'
        WHEN pg_typeof(selected_days)::text = 'text[]' THEN 'Text Array'
        ELSE 'Other'
    END as format_type
FROM public.events 
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;

-- 3. اختبار تحويل JSON إلى array للأحداث الجديدة
SELECT 
    'JSON Conversion for New Events' as test_name,
    id,
    title,
    selected_days,
    -- تحويل JSON إلى array
    array_agg(
        INITCAP(LOWER(key)) 
        ORDER BY key
    ) as converted_days
FROM public.events,
LATERAL jsonb_object_keys(selected_days::jsonb) as key
WHERE created_at > NOW() - INTERVAL '1 hour'
  AND pg_typeof(selected_days)::text = 'jsonb'
GROUP BY id, title, selected_days
ORDER BY created_at DESC;

-- 4. إحصائيات الأحداث الجديدة
SELECT 
    'New Events Statistics' as test_name,
    COUNT(*) as total_new_events,
    COUNT(CASE WHEN pg_typeof(selected_days)::text = 'jsonb' THEN 1 END) as jsonb_events,
    COUNT(CASE WHEN pg_typeof(selected_days)::text = 'text[]' THEN 1 END) as text_array_events,
    MIN(created_at) as oldest_new_event,
    MAX(created_at) as newest_new_event
FROM public.events 
WHERE created_at > NOW() - INTERVAL '1 hour';
