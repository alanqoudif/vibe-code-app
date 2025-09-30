-- اختبار الحدث المضاف من الموقع
-- تشغيل هذا الملف في Supabase SQL Editor

-- 1. البحث عن الحدث المضاف
SELECT 
    'Website Event' as test_name,
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

-- 2. فحص selected_days بتنسيق JSON
SELECT 
    'JSON Parsing Test' as test_name,
    selected_days,
    pg_typeof(selected_days) as data_type,
    -- محاولة تحويل JSON إلى array
    CASE 
        WHEN pg_typeof(selected_days)::text = 'jsonb' THEN
            array_agg(key ORDER BY key)
        ELSE 'Not JSONB'
    END as converted_days
FROM public.events,
LATERAL jsonb_object_keys(selected_days::jsonb) as key
WHERE id = 'a55a415a-78e0-4a86-b4e8-037a2d05134d'
  AND pg_typeof(selected_days)::text = 'jsonb'
GROUP BY selected_days, pg_typeof(selected_days);

-- 3. اختبار استعلام مشابه لما يفعله التطبيق
SELECT 
    'App Query Test' as test_name,
    id,
    user_id,
    title,
    event_date,
    event_time,
    selected_days,
    location,
    created_at
FROM public.events 
WHERE user_id = '9e8eff68-e157-4bcb-bce7-7701f6cca84c'
ORDER BY event_date ASC, event_time ASC;

-- 4. فحص جميع الأحداث لهذا المستخدم
SELECT 
    'All Events for User' as test_name,
    id,
    title,
    event_date,
    event_time,
    selected_days,
    pg_typeof(selected_days) as data_type
FROM public.events 
WHERE user_id = '9e8eff68-e157-4bcb-bce7-7701f6cca84c'
ORDER BY created_at DESC;

-- 5. اختبار تحويل selected_days
SELECT 
    'Day Conversion Test' as test_name,
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
WHERE user_id = '9e8eff68-e157-4bcb-bce7-7701f6cca84c'
  AND pg_typeof(selected_days)::text = 'jsonb'
GROUP BY id, title, selected_days, pg_typeof(selected_days)
ORDER BY created_at DESC;
