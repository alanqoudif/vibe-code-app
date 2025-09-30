-- تشخيص تنسيق البيانات الفعلي
-- تشغيل هذا الملف في Supabase SQL Editor

-- 1. فحص تنسيق selected_days بالتفصيل
SELECT 
    'Data Format Analysis' as test_name,
    id,
    title,
    selected_days,
    pg_typeof(selected_days) as actual_type,
    selected_days::text as text_representation,
    LENGTH(selected_days::text) as text_length,
    -- فحص البداية
    CASE 
        WHEN selected_days::text LIKE '{%' THEN 'Starts with {'
        WHEN selected_days::text LIKE '[%' THEN 'Starts with ['
        WHEN selected_days::text LIKE '"%' THEN 'Starts with "'
        ELSE 'Other start'
    END as starts_with
FROM public.events 
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;

-- 2. فحص أنواع البيانات المختلفة
SELECT 
    'Type Analysis' as test_name,
    pg_typeof(selected_days) as data_type,
    COUNT(*) as count,
    array_agg(DISTINCT LEFT(selected_days::text, 10)) as sample_starts
FROM public.events 
WHERE selected_days IS NOT NULL
GROUP BY pg_typeof(selected_days)
ORDER BY count DESC;

-- 3. اختبار تحويل البيانات
SELECT 
    'Conversion Test' as test_name,
    id,
    title,
    selected_days,
    pg_typeof(selected_days) as actual_type,
    -- محاولة تحويل إلى JSONB
    CASE 
        WHEN pg_typeof(selected_days)::text = 'jsonb' THEN 'Already JSONB'
        WHEN pg_typeof(selected_days)::text = 'text[]' THEN 'Text Array'
        WHEN pg_typeof(selected_days)::text = 'json' THEN 'JSON'
        ELSE 'Unknown Type'
    END as type_status
FROM public.events 
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;
