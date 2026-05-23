# دليل النشر إلى Vercel + GitHub

جهّزت لك المشروع بالكامل. هذا دليل خطوة بخطوة لتضغط وتنفذ.

---

## المتطلبات

| الحساب | الرابط |
|--------|--------|
| GitHub | https://github.com/signup |
| Vercel | https://vercel.com/signup (اختر "Continue with GitHub") |

---

## الخطوة 1 — توليد أسرار البيئة

شغّل هذا في **Terminal أو PowerShell**:

```powershell
cd C:\Users\med\Projects\dawrak

# Auth secret (32 bytes hex)
$authSecret = (openssl rand -hex 32)
Write-Host "AUTH_SECRET: $authSecret"

# Cron secret (16 bytes hex)
$cronSecret = (openssl rand -hex 16)
Write-Host "CRON_SECRET: $cronSecret"
```

أو إذا لم تُثبت OpenSSL:
```powershell
(-join ((1..32) | ForEach-Object { '{0:x2}' -f (Get-Random -Maximum 256) }))
(-join ((1..16) | ForEach-Object { '{0:x2}' -f (Get-Random -Maximum 256) }))
```

**احفظ الناتجين**. ستدخلهما في Vercel.

---

## الخطوة 2 — تدوير Prisma إلى PostgreSQL

افتح `prisma/schema.prisma` في Notepad وغيّر:

```diff
  datasource db {
-   provider = "sqlite"
+   provider = "postgresql"
    url      = env("DATABASE_URL")
  }
```

ثم شغّل (لتحديث التوليف ومشاهدة التغيير):
```bash
npx prisma generate
```

---

## الخطوة 3 — رفع المشروع إلى GitHub

### 3.1 أنشئ repo جديد
ادخل: https://github.com/new
- **Name**: `dawrak`
- خيار `Public` أو `Private`
- لا تضيف README (ناسف)
- اضغط **Create repository**

### 3.2 رفع الكود (انسخ الأمر بالكامل)

استبدل `YOUR_USERNAME` باسمك الحقيقي على GitHub:

```bash
cd C:\Users\med\Projects\dawrak
git remote add origin https://github.com/YOUR_USERNAME/dawrak.git
git branch -M main
git push -u origin main
```

> إذا طُلب اسم مستخدم + كلمة مرور، استخدم **Personal Access Token**:  
> https://github.com/settings/tokens/new → `classic` → ☑ `repo` → Generate  
> استبدل كلمة المرور بهذا التوكن.

---

## الخطوة 4 — إنشاء Vercel Postgres

1. https://vercel.com/dashboard → **Storage** → **Create** → **Postgres**
2. اختر نطاق `qatar` (أقرب لدول الخليج) أو `fra1` (فرانكفورت)
3. اختر اسم للمشروع مثلاً `dawrak-db`
4. بعد إنشائها، انسخ **Connection String** (يبدأ بـ `postgres://`)
5. هذا السطر هو قيمة `DATABASE_URL`.

> استخدم الرابط الذي يحتوي على **-pooler** إن وجد (أفضل لبيئة Serverless).

---

## الخطوة 5 — نشر المشروع على Vercel

1. Vercel Dashboard → **Add New Project**
2. اختر `dawrak` من قائمة GitHub repos → **Import**
3. Framework Preset: **Next.js** (يُكتشف تلقائياً)
4. Root Directory: `./` (افتراضي)
5. **Environment Variables** (أضف الكل 밑):

| Key | Value | Environment |
|-----|-------|-------------|
| `DATABASE_URL` | السطر المنسوخ من Vercel Postgres | Production (و Preview) |
| `AUTH_SECRET` | القيمة ذات 64 حرفاً من الخطوة 1 | Production + Preview |
| `NEXT_PUBLIC_BASE_URL` | رابطك النهائي (مثلاً `https://dawrak.vercel.app`) | Production + Preview |
| `CRON_SECRET` | القيمة ذات 32 حرفاً من الخطوة 1 | Production |
| `SMS_PROVIDER` | `none` | Production |

6. اضغط **Deploy**

> تأكد أنك تُرسل `NEXT_PUBLIC_BASE_URL` إلى **Production + Preview** وليس Production فقط — لأن Preview URLs مثل `dawrak-abc123.vercel.app` قد ترغب باختبارها.

---

## الخطوة 6 — تطبيق تهجيرات Prisma (مطلوب قبل أول استخدام)

عند أول نشر، الجداول غير موجودة في Postgres. يجب تشغيل `prisma migrate deploy`.

### الطريقة السهلة — من Vercel Console
1. Vercel Dashboard → اذهب لصفحة المشروع
2. اضغط على زر **...** بجانب أي Deployment → **Runtime Logs** → **Console**
3. شغّل:
```bash
npx prisma migrate deploy
```

### أو محلياً (إن أردت)
1. ضع `DATABASE_URL` القيمة Postgres في ملف `.env.local` (مؤقتاً)
2. شغّل:
```bash
npx prisma migrate deploy
npx prisma db seed
```
3. احذف `.env.local` بعد إرسال الحزمة

---

## الخطوة 7 — التحقق من النشر

افتح روابطك النهائية بعد نجاح البناء:

| عتب | الرابط |
|-----|--------|
| الموقع الرئيسي | `https://dawrak.vercel.app` |
| صفحة المحل (التي أنشّأها seed) | `https://dawrak.vercel.app/q/salon-al-amir` |
| دخول لوحة التحكم | `https://dawrak.vercel.app/dashboard/login` |
| إنشاء حساب جديد | `https://dawrak.vercel.app/dashboard/signup` |
| الخصوصية | `https://dawrak.vercel.app/privacy` |
| الشروط | `https://dawrak.vercel.app/terms` |

بيانات الدخول التجريبية (من Seed):
```
البريد: owner@salon-al-amir.local
كلمة المرور: demo1234
```

---

## الخطوة 8 — ربط نطاق مخصص (إن أردت)

Vercel Dashboard → Settings → Domains → Add Domain:
- أدخل `yourdomain.com`
- اتبع التعليمات لإضافة سجلات DNS `@` A-record و `www` CNAME
- انتظر اكتساب SSL تلقائياً (قد يستغرق بضع دقائق)

لا تنسَ تحديث:
- `NEXT_PUBLIC_BASE_URL` → `https://yourdomain.com`
- `AUTH_URL` (إن أردت) → `https://yourdomain.com`

---

## حل المشاكل الشائعة

### "Can't reach database server" عند build
- أكد أن `DATABASE_URL` يحتوي على `?sslmode=require` أو `ssl=true`
- للـ Vercel Postgres: استخدم Vercel Storage Dashboard → `.env.local` tab → انسخ واستخدم الرابط الذي يحتوي على pooler

### "Missing environment variable NEXT_PUBLIC_BASE_URL"
- تأكد أن هذا المتغير مُضاف إلى **Production + Preview + Development**
- (Vercel تُفرّق بين بيئات النشر)

### Cron لا يعمل (مجاني Hobby)
- Vercel Cron يعمل فقط في Production
- التأكيد أن `CRON_SECRET` مُضاف
- لو Cron أهميته عالية للأعمال، يمكنك استخدام GitHub Actions أو EasyCron بديلاً عن Vercel Cron

### "You do not have a Subscription"
- Vercel Postgres مجاني حتى حد معين (~256 MB). إذا ازدادت البيانات بعد فترة، يفّعل خطّة مدفوعة قدرما يزيد المشروع.

---

جاهز! إذا واجهتك أي رسالة خطأ أثناء النشر، أرسلها لي نصّاً كاملاً وأحلها معك.
