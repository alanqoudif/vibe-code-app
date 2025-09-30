-- اختبار بسيط لقاعدة البيانات
-- تشغيل هذا الملف في Supabase SQL Editor

-- 1. التحقق من الاتصال
SELECT 'Database connection successful' as status;

-- 2. التحقق من وجود الجدول
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'events') 
        THEN 'Events table exists' 
        ELSE 'Events table NOT found' 
    END as table_status;

-- 3. التحقق من عدد السجلات
SELECT COUNT(*) as total_events FROM public.events;

-- 4. عرض عينة من البيانات
SELECT 
    id,
    user_id,
    title,
    event_date,
    event_time,
    selected_days,
    created_at
FROM public.events 
ORDER BY created_at DESC 
LIMIT 5;

-- 5. التحقق من أنواع البيانات
SELECT 
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_name = 'events'
AND column_name IN ('selected_days', 'user_id', 'title');

-- 6. اختبار إدراج سجل تجريبي (باستخدام user_id محدد)
-- استبدل 'YOUR_USER_ID' بـ user_id الفعلي من البيانات الموجودة
INSERT INTO public.events (
    user_id, 
    title, 
    description, 
    event_date, 
    event_time, 
    location, 
    selected_days, 
    event_type, 
    reminder_minutes
) VALUES (
    'd471d95c-984e-4859-92d5-45e3f8104287', -- استخدم user_id من البيانات الموجودة
    'Test Event - ' || NOW()::text,
    'This is a test event',
    CURRENT_DATE,
    '10:00 AM',
    'Test Location',
    ARRAY['Monday', 'Wednesday']::text[],
    'lecture',
    15
) RETURNING id, title, selected_days;

-- 7. التحقق من السجل المضاف
SELECT 
    id,
    title,
    selected_days,
    user_id
FROM public.events 
WHERE title LIKE 'Test Event%'
ORDER BY created_at DESC 
LIMIT 3;
