# دليل النشر على Vercel (خطوة بخطوة)

> **تنبيه مهم:** لا تشارك أبداً `AUTH_SECRET` أو `CRON_SECRET` أو كلمة مرور قاعدة البيانات في GitHub أو مع أي شخص.

## الخطوة 1 — تحضير قاعدة البيانات (Vercel Postgres)

1. افتح حسابك على [vercel.com](https://vercel.com)
2. اذهب إلى Dashboard → Storage → Create Database → **Postgres**
3. اختر منطقة قريبة من جمهورك (مثلاً `iad1` لواشنطن، أو `fra1` لفرانكفورت)
4. بعد الإنشاء، اذهب إلى لوحة التحكم الخاصة بقاعدة البيانات
5. انسخ **Connection String (Prisma)** — يبدأ بـ `postgresql://neondb_owner:...`

## الخطوة 2 — رفع المشروع على GitHub

افتح PowerShell أو Terminal في مجلد المشروع (`C:\Users\med\Projects\dawrak`) ونفّذ ما يلي **بالتسلسل**:

```bash
cd C:\Users\med\Projects\dawrak

# 1) Initialize git (إذا لم تُفعل من قبل)
git init

# 2) Create the repository on GitHub
curl -u medhachoum \
  -H "Accept: application/vnd.github+json" \
  https://api.github.com/user/repos \
  -d '{"name":"dawrak","description":"دَوْرَك — Digital queue system","private":true}'

# 3) Add remote
git remote add origin https://github.com/medhachoum/dawrak.git

# 4) Stage everything
git add -A

# 5) Commit
git commit -m "Initial production-ready release"

# 6) Push
git branch -M main
git push -u origin main
```

إذا لم يكن لديك GitHub CLI، يمكنك إنشاء الريبو يدوياً:
- افتح [github.com/new](https://github.com/new)
- اكتب `dawrak` كاسم
- اختر **Private**
- لا تُفعل README أو .gitignore — اضغط Create
- ثم عد وشغل الأوامر من `git remote add` فما فوق فقط.

## الخطوة 3 — ربط Vercel بالمشروع

### الخيار أ — عبر المتصفح (المُستحسن للمبتدئين):

1. اذهب إلى [vercel.com/new](https://vercel.com/new)
2. اختر GitHub → استورد `dawrak`
3. تخط Framework Preset (سيتم اكتشافه تلقائياً كـ Next.js)
4. **إضافة Environment Variables**:
5. انقر المشروع → **Settings** → **Environment Variables**، وأضف كل مفتاح وقيمة:

| المفتاح | القيمة | ملاحظة |
|---|---|---|
| `DATABASE_URL` | `postgresql://neondb_owner:...` | انسخها من Vercel Postgres |
| `AUTH_SECRET` | `openssl rand -base64 32` | انشئها بنفسك |
| `AUTH_URL` | `https://dawrak.vercel.app` | غيّر الدومين إذا استخدمت دومين مخصص |
| `NEXT_PUBLIC_BASE_URL` | `https://dawrak.vercel.app` | نفس قيمة AUTH_URL |
| `CRON_SECRET` | `openssl rand -base64 24` | أي سلسلة طويلة |
| `SMS_PROVIDER` | `none` | اتركها لـ production |

### الخيار ب — عبر Vercel CLI (للمتمرسين):

```bash
# نفّذ على جهازك
npx vercel@latest --yes
# ستُسأل عن ربط المشروع بالـ repo على GitHub

# بعد أول نشر، أضف متغيرات البيئة:
npx vercel env add DATABASE_URL
echo "your-vercel-postgres-connection-string" | npx vercel env add DATABASE_URL

npx vercel env add AUTH_SECRET
npx vercel env add NEXT_PUBLIC_BASE_URL
npx vercel env add AUTH_URL
npx vercel env add CRON_SECRET

# ثم أعد النشر
npx vercel --prod
```

## الخطوة 4 — تشغيل Migrations على قاعدة البيانات (خطوة حاسمة ⚠️)

قاعدة البيانات فارغة حالياً — عليك إنشاء الجداول **قبل** أن يعمل الموقع.

### الطريقة 1 — محلياً (الأسهل):

```bash
cd C:\Users\med\Projects\dawrak

# ضع الـ DATABASE_URL الخاص بـ Vercel Postgres مؤقتاً في البيئة
$env:DATABASE_URL="postgresql://neondb_owner:PASSWORD@ep-...aws.neon.tech/DB?sslmode=require"

# نفّذ المايقريشن
npx prisma migrate deploy
```

### الطريقة 2 — عبر Vercel Run Command (إذا لم تُرِد فتح الـ CLI):

```bash
npx vercel run --env DATABASE_URL="your-connection-string" "npx prisma migrate deploy"
```

> **⚠️ لا تستخدم `prisma migrate dev` على production** — يغيّر البيانات وقد يمسحها.
> `migrate deploy` يطبّق فقط الملفات الموجودة بدون أي تعديل.

## الخطوة 5 — Seed بيانات تجريبية (اختياري)

**لا تركّب seed على production إلا إذا كنت تعرف ما تفعل.**

إذا كنت تريد seed للاختبار:

```bash
$env:DATABASE_URL="postgresql://..."
npx prisma db seed
```

للإنتاج، قم بإنشاء حسابك الخاص عبر `/dashboard/signup`.

## الخطوة 6 — تحديث Vercel Cron Jobs

إذا فعلت `CRON_SECRET`، Vercel Cron يعمل تلقائياً من `vercel.json` الموجود في ال repo:

```json
{
  "crons": [
    {
      "path": "/api/cron/cleanup",
      "schedule": "*/5 * * * *"
    },
    {
      "path": "/api/cron/retention",
      "schedule": "0 3 * * *"
    }
  ]
}
```

> تأكد من أن `CRON_SECRET` مضبوط في متغيرات البيئة.

## الخطوة 7 — اختبار ما بعد النشر

1. افتح `https://dawrak.vercel.app` → يجب أن ترى الصفحة التسويقية
2. اذهب إلى `https://dawrak.vercel.app/dashboard/signup`
3. أنشئ حساب محل جديد → تحقق من إنشاء المحل بنجاح
4. اذهب إلى صفحة المحل الجديد (`/q/{slug}`) وانضم للطابور → يجب أن تحصل على تذكرة
5. افتح لوحة التحكم → يجب أن تعرض الطابور والإحصائيات

## استكشاف الأخطاء الشائعة

### "Cannot find module 'next-auth'"
- حدث `git add -A` و `git commit` ثم `git push` — تحقق أن `node_modules` ليست ضمن `.gitignore` (لا يجب رفعها)

### "Database connection error"
- تأكد من `DATABASE_URL` تحتوي `sslmode=require`
- تأكد أنك شغّلت `npx prisma migrate deploy` مرة واحدة على الأقل

### "Invalid server environment variables"
- تأكد من `AUTH_SECRET` طولها 32 حرف على الأقل (44 حرف base64)
- `NEXT_PUBLIC_BASE_URL` يجب أن تبدأ بـ `https://`

### Cron لا يعمل
- تأكد من `CRON_SECRET` مضبوط في متغيرات البيئة
- تحقق من Vercel Dashboard → Cron Jobs

## عند التحديث لاحقاً

```bash
# إجراء تعديلات محلية
npm run build        # تحقق من نجاح البناء
npm run lint         # تأكد من عدم وجود errors
npm run test         # شغّل الاختبارات (إن أضفت)

git add -A
git commit -m "update: ..."
git push
git push vercel main  # أو سيتم auto-deploy من GitHub
```

> كل `git push` سيُعيد نشر الموقع تلقائياً إذا كنت تستخدم GitHub + Vercel.
