-- اختبار أساسي وآمن
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
    created_at
FROM public.events 
WHERE id = 'a55a415a-78e0-4a86-b4e8-037a2d05134d';

-- 2. عرض جميع الأحداث للمستخدم
SELECT 
    'User Events' as test_name,
    id,
    title,
    event_date,
    event_time,
    selected_days,
    created_at
FROM public.events 
WHERE user_id = '9e8eff68-e157-4bcb-bce7-7701f6cca84c'
ORDER BY created_at DESC;

-- 3. فحص نوع البيانات
SELECT 
    'Data Type' as test_name,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_name = 'events' 
AND column_name = 'selected_days';

-- 4. اختبار بسيط لتحويل JSON
SELECT 
    'JSON Test' as test_name,
    id,
    title,
    selected_days,
    -- محاولة تحويل JSON إلى نص
    CASE 
        WHEN selected_days::text LIKE '{%' THEN 'JSON Object'
        WHEN selected_days::text LIKE '[%' THEN 'JSON Array'
        ELSE 'Other Format'
    END as format_type
FROM public.events 
WHERE user_id = '9e8eff68-e157-4bcb-bce7-7701f6cca84c'
ORDER BY created_at DESC;

-- 5. إحصائيات بسيطة
SELECT 
    'Statistics' as test_name,
    COUNT(*) as total_events,
    COUNT(CASE WHEN selected_days IS NOT NULL THEN 1 END) as events_with_days,
    MIN(created_at) as oldest_event,
    MAX(created_at) as newest_event
FROM public.events 
WHERE user_id = '9e8eff68-e157-4bcb-bce7-7701f6cca84c';
