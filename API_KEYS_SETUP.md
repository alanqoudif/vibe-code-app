# إعداد API Keys - تطبيق learnz | ليرنز

## 🔑 إعداد OpenAI API Key

### الخطوة 1: الحصول على API Key
1. اذهب إلى [OpenAI Platform](https://platform.openai.com/)
2. سجل دخولك أو أنشئ حساب جديد
3. اذهب إلى [API Keys](https://platform.openai.com/api-keys)
4. اضغط "Create new secret key"
5. انسخ المفتاح (يبدأ بـ `sk-proj-`)

### الخطوة 2: إعداد المفتاح محلياً
1. أنشئ ملف `.env` في مجلد المشروع
2. أضف السطر التالي:
```
EXPO_PUBLIC_OPENAI_API_KEY=sk-proj-your-actual-api-key-here
```
3. استبدل `your-actual-api-key-here` بمفتاحك الفعلي

### الخطوة 3: التحقق من الإعداد
1. تأكد من أن ملف `.env` موجود في `.gitignore`
2. أعد تشغيل التطبيق
3. اختبر المساعد الذكي

## 🛡️ الأمان

### ⚠️ تحذيرات مهمة:
- **لا تشارك API keys أبداً**
- **لا ترفع ملف `.env` إلى GitHub**
- **استخدم متغيرات البيئة فقط**

### ✅ أفضل الممارسات:
- استخدم ملف `.env` محلياً
- أضف `.env` إلى `.gitignore`
- استخدم `env.example` كقالب

## 🔧 استكشاف الأخطاء

### إذا لم يعمل AI:
1. تحقق من صحة API key
2. تأكد من وجود ملف `.env`
3. تحقق من تنسيق المفتاح (يبدأ بـ `sk-proj-`)
4. أعد تشغيل التطبيق

### رسائل الخطأ الشائعة:
```
OpenAI API key not found
```
**الحل:** تأكد من وجود ملف `.env` مع المفتاح الصحيح

```
Invalid OpenAI API key
```
**الحل:** تحقق من صحة المفتاح في OpenAI Platform

## 📱 للاستخدام في الإنتاج

### Expo/EAS Build:
1. أضف متغيرات البيئة في EAS Dashboard
2. استخدم `eas secret:create` للأمان
3. لا تضع API keys في الكود

### React Native:
1. استخدم `react-native-config`
2. أضف متغيرات البيئة في `android/app/build.gradle`
3. أضف متغيرات البيئة في `ios/Info.plist`

## 🎯 ملخص سريع

1. **احصل على API key** من OpenAI
2. **أنشئ ملف `.env`** مع المفتاح
3. **تأكد من `.gitignore`** يتضمن `.env`
4. **اختبر التطبيق** للتأكد من العمل

---

**ملاحظة:** هذا الملف آمن للرفع إلى GitHub لأنه لا يحتوي على API keys حقيقية.
