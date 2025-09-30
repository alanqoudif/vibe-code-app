-- اختبار مبسط لإنشاء الأحداث من التطبيق
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
    pg_typeof(selected_days) as data_type
FROM public.events 
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;

-- 3. إحصائيات الأحداث الجديدة
SELECT 
    'New Events Statistics' as test_name,
    COUNT(*) as total_new_events,
    COUNT(CASE WHEN pg_typeof(selected_days)::text = 'jsonb' THEN 1 END) as jsonb_events,
    COUNT(CASE WHEN pg_typeof(selected_days)::text = 'text[]' THEN 1 END) as text_array_events,
    MIN(created_at) as oldest_new_event,
    MAX(created_at) as newest_new_event
FROM public.events 
WHERE created_at > NOW() - INTERVAL '1 hour';

-- 4. اختبار بسيط لتحويل JSON (فقط للبيانات JSON)
SELECT 
    'JSON Test' as test_name,
    id,
    title,
    selected_days,
    -- محاولة تحويل JSON إلى نص
    CASE 
        WHEN selected_days::text LIKE '{%' THEN 'JSON Object'
        WHEN selected_days::text LIKE '[%' THEN 'JSON Array'
        WHEN selected_days::text LIKE '"%' THEN 'String'
        ELSE 'Other Format'
    END as format_type
FROM public.events 
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;
