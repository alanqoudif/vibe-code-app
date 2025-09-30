# دليل تشخيص مشاكل AI

## 🔧 **التحسينات المطبقة:**

### 1. **إضافة SimpleAIService للاختبار**
- خدمة مبسطة للاختبار السريع
- API key مدمج للاختبار
- تسجيل مفصل للأخطاء

### 2. **زر التبديل بين الخدمتين**
- Simple AI: للاختبار السريع
- Full AI: للاستخدام الكامل مع السياق

### 3. **تحسين التسجيل**
- تسجيل مفصل لكل خطوة
- رسائل خطأ واضحة
- تتبع حالة API

## 🧪 **كيفية الاختبار:**

### **الخطوة 1: اختبار Simple AI**
1. افتح التطبيق
2. تأكد من أن زر "Simple AI" مفعل (أزرق)
3. اكتب رسالة واختبر

### **الخطوة 2: فحص Console**
ابحث عن هذه الرسائل في Console:
```
🤖 Simple AI - Sending message: [رسالتك]
🤖 Simple AI - Response status: 200
✅ Simple AI - Success: [رد AI]
```

### **الخطوة 3: إذا فشل Simple AI**
ابحث عن رسائل الخطأ:
```
❌ Simple AI - API Error: [كود الخطأ]
```

## 🔍 **أخطاء شائعة وحلولها:**

### **خطأ 401: Invalid API Key**
```
❌ Simple AI - API Error: 401
```
**الحل:** تحقق من صحة API key

### **خطأ 429: Rate Limit**
```
❌ Simple AI - API Error: 429
```
**الحل:** انتظر قليلاً ثم جرب مرة أخرى

### **خطأ 500: Server Error**
```
❌ Simple AI - API Error: 500
```
**الحل:** مشكلة في OpenAI، جرب لاحقاً

## 📊 **مقارنة الخدمتين:**

| الميزة | Simple AI | Full AI |
|--------|-----------|---------|
| السرعة | سريع جداً | متوسط |
| السياق | لا | نعم |
| المحادثة المستمرة | لا | نعم |
| بيانات المستخدم | لا | نعم |
| التعقيد | بسيط | معقد |

## 🚀 **خطوات التشخيص:**

### **1. اختبار الاتصال:**
```typescript
// في Console
const test = await SimpleAIService.sendMessage('مرحبا');
console.log(test);
```

### **2. فحص API Key:**
```typescript
// تأكد من وجود API key
console.log('API Key:', process.env.EXPO_PUBLIC_OPENAI_API_KEY);
```

### **3. اختبار الشبكة:**
```typescript
// اختبار الاتصال بـ OpenAI
fetch('https://api.openai.com/v1/models', {
  headers: {
    'Authorization': 'Bearer sk-0r7vYH3bX5mX1bX1uYzT3BlbkFJHHW2rGZz4u6v3m8H2r8'
  }
}).then(r => console.log('OpenAI Status:', r.status));
```

## 📝 **ملاحظات مهمة:**

1. **Simple AI** يستخدم API key مدمج للاختبار
2. **Full AI** يحتاج إعداد متغيرات البيئة
3. راقب Console للأخطاء
4. جرب Simple AI أولاً للتأكد من الاتصال

## 🎯 **النتيجة المتوقعة:**

إذا عمل Simple AI، فالمشكلة في إعدادات Full AI
إذا لم يعمل Simple AI، فالمشكلة في الاتصال أو API key

جرب الآن وأخبرني بالنتيجة! 🚀
