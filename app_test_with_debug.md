# اختبار التطبيق مع تشخيص تنسيق البيانات

## 🔍 المشكلة المكتشفة

من الصورة أرى أن:
- البيانات تظهر كـ JSON Array (تبدأ بـ `[`)
- لكن `format_type` يظهر "JSON Object"
- هذا يعني أن هناك مشكلة في منطق الاستعلام

## 🧪 خطوات التشخيص

### 1. تشخيص تنسيق البيانات الفعلي
شغل ملف `debug_data_format.sql` في Supabase SQL Editor:

```sql
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
```

### 2. اختبار التطبيق
1. **شغل التطبيق**
2. **سجل دخول** بحساب المستخدم
3. **أضف حدث جديد** من التطبيق
4. **تحقق من ظهوره** في التقويم

### 3. التحقق من الموقع
1. **اذهب إلى Supabase Dashboard**
2. **تحقق من جدول `events`**
3. **يجب أن ترى الحدث الجديد** بتنسيق JSON

## 🔧 الحلول المطبقة

### 1. إصلاح `createEvent`
- الآن يحفظ `selected_days` كـ JSON object: `{"monday": true, "wednesday": true}`
- يطابق تنسيق البيانات الموجودة في قاعدة البيانات

### 2. إصلاح `updateEvent`
- نفس الإصلاح للتحديث
- يضمن التنسيق المتسق

### 3. تحسين معالجة البيانات
- دعم JSON Objects: `{"tuesday"}` → `["Tuesday"]`
- دعم JSON Arrays: `["monday", "wednesday"]` → `["Monday", "Wednesday"]`
- دعم Text Arrays: `{"Monday","Wednesday"}` → `["Monday", "Wednesday"]`

## 🎯 النتائج المتوقعة

### في قاعدة البيانات:
- الحدث الجديد يظهر بتنسيق JSON: `{"monday": true, "wednesday": true}`
- نفس تنسيق البيانات الموجودة
- `user_id` صحيح

### في التطبيق:
- الحدث يظهر في التقويم فوراً
- المزامنة تعمل في كلا الاتجاهين
- الأوقات تظهر بتنسيق 12 ساعة

## 🚨 إذا لم يعمل

### 1. تحقق من Console
- ابحث عن أخطاء في `DatabaseService`
- راقب رسائل `createEvent`

### 2. جرب المزامنة اليدوية
- اسحب الشاشة لأسفل في التقويم
- راقب رسائل المزامنة

### 3. أعد تشغيل التطبيق
- بعد التحديثات
- جرب إضافة حدث جديد

### 4. تحقق من Supabase
- اذهب إلى Logs في Supabase Dashboard
- راقب أخطاء قاعدة البيانات

## 📱 الميزات الجديدة

1. **مزامنة كاملة** بين التطبيق والموقع
2. **تنسيق موحد** للبيانات
3. **دعم تنسيقات متعددة** لـ `selected_days`
4. **تحويل الوقت** من 24 ساعة إلى 12 ساعة
5. **معالجة أفضل للأخطاء**

## ✅ النتيجة النهائية

بعد تطبيق هذه الإصلاحات:
- ✅ البيانات من الموقع تظهر في التطبيق
- ✅ البيانات من التطبيق تظهر في الموقع
- ✅ المزامنة تعمل في كلا الاتجاهين
- ✅ التنسيق موحد ومتسق

---

**ملاحظة**: إذا استمرت المشاكل، تحقق من Console وشارك رسائل الخطأ.
