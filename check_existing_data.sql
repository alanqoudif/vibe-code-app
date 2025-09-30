-- فحص البيانات الموجودة في قاعدة البيانات
-- تشغيل هذا الملف في Supabase SQL Editor

-- 1. إحصائيات عامة
SELECT 
    COUNT(*) as total_events,
    COUNT(DISTINCT user_id) as unique_users,
    MIN(created_at) as oldest_event,
    MAX(created_at) as newest_event
FROM public.events;

-- 2. عرض جميع المستخدمين والأحداث
SELECT 
    user_id,
    COUNT(*) as event_count,
    array_agg(title ORDER BY created_at DESC) as event_titles
FROM public.events 
GROUP BY user_id
ORDER BY event_count DESC;

-- 3. عرض تفاصيل الأحداث
SELECT 
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

-- 4. فحص أنواع البيانات في selected_days
SELECT 
    id,
    title,
    selected_days,
    pg_typeof(selected_days) as data_type,
    array_length(selected_days, 1) as array_length
FROM public.events 
WHERE selected_days IS NOT NULL
LIMIT 10;

-- 5. البحث عن أحداث محددة (إذا كنت تعرف user_id)
-- استبدل 'YOUR_USER_ID' بـ user_id الفعلي
SELECT 
    id,
    title,
    event_date,
    event_time,
    selected_days,
    location
FROM public.events 
WHERE user_id = 'd471d95c-984e-4859-92d5-45e3f8104287'
ORDER BY created_at DESC;
