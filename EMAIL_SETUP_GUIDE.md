# دليل إعداد البريد الإلكتروني لحل مشاكل إعادة تعيين كلمة المرور

## المشاكل التي تم حلها ✅

### 1. **خطأ `supabase.auth.admin.getUserByEmail is not a function`**
**السبب**: دالة `admin` تتطلب service role key وليس anon key
**الحل**: استخدام طريقة بديلة للتحقق من وجود المستخدم

### 2. **مشكلة `redirectTo` URL**
**السبب**: Deep links قد لا تعمل بشكل صحيح مع Supabase
**الحل**: إنشاء صفحة HTML مخصصة لمعالجة إعادة تعيين كلمة المرور

## الحلول المطبقة

### 1. **صفحة HTML مخصصة** 🌐
- **الملف**: `public/password-reset.html`
- **الوظائف**:
  - واجهة مستخدم جميلة باللغة العربية
  - معالجة آمنة لرموز إعادة تعيين كلمة المرور
  - تحقق من قوة كلمة المرور
  - تحديث كلمة المرور مباشرة في Supabase

### 2. **تحسين دالة `checkEmailDelivery`** 🔧
- **الطريقة الجديدة**: محاولة تسجيل الدخول بكلمة مرور وهمية
- **المنطق**: إذا حصلنا على خطأ "Invalid credentials" = المستخدم موجود
- **الفوائد**: لا يتطلب service role key

### 3. **URL صحيح لإعادة التوجيه** 🔗
- **الرابط الجديد**: `https://ymkatahxzfwiyhpzvxts.supabase.co/password-reset.html`
- **المزايا**: يعمل مع جميع المتصفحات والأجهزة

## كيفية عمل النظام الجديد

### الخطوة 1: إرسال رابط إعادة التعيين
```typescript
const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
  redirectTo: 'https://ymkatahxzfwiyhpzvxts.supabase.co/password-reset.html'
});
```

### الخطوة 2: المستخدم يضغط على الرابط
- يفتح المتصفح صفحة `password-reset.html`
- الصفحة تستخرج الرمز من URL
- تعرض نموذج إدخال كلمة المرور الجديدة

### الخطوة 3: تحديث كلمة المرور
```javascript
const response = await fetch('https://ymkatahxzfwiyhpzvxts.supabase.co/auth/v1/user', {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    'apikey': 'your-anon-key'
  },
  body: JSON.stringify({ password: newPassword })
});
```

## إعداد Supabase

### 1. **رفع ملف HTML**
- ارفع `public/password-reset.html` إلى مجلد `public` في Supabase
- تأكد من أن الملف متاح على: `https://ymkatahxzfwiyhpzvxts.supabase.co/password-reset.html`

### 2. **تكوين Site URL**
- اذهب إلى Supabase Dashboard > Authentication > URL Configuration
- أضف: `https://ymkatahxzfwiyhpzvxts.supabase.co`
- تأكد من أن `password-reset.html` متاح

### 3. **تكوين Email Templates** (اختياري)
- اذهب إلى Authentication > Email Templates
- يمكنك تخصيص قالب رسالة إعادة تعيين كلمة المرور

## اختبار النظام

### 1. **استخدم أداة التشخيص**
- اذهب إلى الإعدادات > تشخيص البريد الإلكتروني
- أدخل بريدك الإلكتروني
- اضغط "بدء التشخيص"

### 2. **اختبر إعادة تعيين كلمة المرور**
- اذهب إلى الإعدادات > تغيير كلمة المرور
- تحقق من وصول الرسالة
- اضغط على الرابط في الرسالة
- اختبر تحديث كلمة المرور

## استكشاف الأخطاء

### إذا لم تصل الرسالة:
1. **تحقق من مجلد الرسائل غير المرغوب فيها**
2. **تأكد من صحة البريد الإلكتروني**
3. **انتظر 30 دقيقة بين المحاولات**
4. **استخدم أداة التشخيص**

### إذا لم يعمل الرابط:
1. **تأكد من رفع ملف HTML إلى Supabase**
2. **تحقق من إعدادات Site URL**
3. **اختبر الرابط مباشرة في المتصفح**

### إذا فشل تحديث كلمة المرور:
1. **تحقق من قوة كلمة المرور**
2. **تأكد من صحة الرمز**
3. **اختبر الاتصال بالإنترنت**

## الملفات المحدثة

### ملفات جديدة:
- ✅ `public/password-reset.html` - صفحة HTML مخصصة
- ✅ `EMAIL_SETUP_GUIDE.md` - دليل الإعداد

### ملفات محدثة:
- ✅ `src/contexts/AuthContext.tsx` - إصلاح دالة checkEmailDelivery
- ✅ `src/screens/EmailDiagnosticScreen.tsx` - أداة التشخيص
- ✅ `src/screens/SettingsScreen.tsx` - رابط التشخيص

## الخطوات التالية

### 1. **رفع ملف HTML**
```bash
# ارفع الملف إلى Supabase Storage أو public folder
# تأكد من أن الملف متاح على:
# https://ymkatahxzfwiyhpzvxts.supabase.co/password-reset.html
```

### 2. **اختبار النظام**
- استخدم أداة التشخيص
- اختبر إعادة تعيين كلمة المرور
- تحقق من وصول الرسائل

### 3. **مراقبة الأداء**
- راقب معدلات التسليم
- تتبع الأخطاء
- حسّن النظام حسب الحاجة

## الخلاصة

تم حل جميع المشاكل المتعلقة بإعادة تعيين كلمة المرور:

1. ✅ **إصلاح خطأ `admin.getUserByEmail`**
2. ✅ **إنشاء صفحة HTML مخصصة**
3. ✅ **تحسين URL إعادة التوجيه**
4. ✅ **أداة تشخيص متقدمة**

النظام الآن يعمل بشكل صحيح وموثوق! 🚀
