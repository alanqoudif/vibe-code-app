-- اختبار مبسط لتشخيص المشكلة
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

-- 2. فحص نوع البيانات
SELECT 
    'Data Type Check' as test_name,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_name = 'events' 
AND column_name = 'selected_days';

-- 3. عرض جميع الأحداث للمستخدم
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

-- 4. فحص selected_days بشكل آمن
SELECT 
    'Selected Days Analysis' as test_name,
    id,
    title,
    selected_days,
    CASE 
        WHEN selected_days IS NULL THEN 'NULL'
        WHEN selected_days::text = '{}' THEN 'Empty Object'
        WHEN selected_days::text = '[]' THEN 'Empty Array'
        WHEN array_length(selected_days, 1) = 0 THEN 'Empty Array'
        ELSE 'Has Data'
    END as status
FROM public.events 
WHERE user_id = '9e8eff68-e157-4bcb-bce7-7701f6cca84c'
ORDER BY created_at DESC;

-- 5. اختبار بسيط لتحويل JSON
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
