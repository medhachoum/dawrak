# DEPLOYMENT CHECKLIST — Vercel

## ✅ GitHub Repo
**URL:** https://github.com/medhachoum/dawrak
Branch: `main`

## ✅ Database Status
- **Provider:** Prisma Postgres (Vercel)
- **Migration:** Applied ✅ (`20260524000000_init`)
- **Seed:** Inserted ✅ (2 demo businesses + 2 owner accounts)

## 🚀 Vercel Deployment Steps

### Step 1 — Import Project
1. Go to https://vercel.com/new
2. Click **"Import Git Repository"**
3. Select `medhachoum/dawrak`
4. Framework Preset should auto-detect **Next.js**
5. Click **Deploy** (it will fail first time — that's expected, we need env vars)

### Step 2 — Add Environment Variables
Go to **Project Settings → Environment Variables** and add these EXACT values:

| Variable | Value | Environment |
|----------|-------|-------------|
| `DATABASE_URL` | `postgres://f18c476f2864beb98764c1197c9d9e112408689c08dc809c5700ed546c717811:sk_TJfPTNfX7LvjIX8OCDS1w@db.prisma.io:5432/postgres?sslmode=require` | Production |
| `NEXT_PUBLIC_BASE_URL` | `https://YOUR_VERCEL_DOMAIN.vercel.app` | Production |
| `AUTH_SECRET` | `XgR9mKpL2vQ8sN4wT7yB1jH5cE3aF6dG0hI4kL7nO9qR2tU5vW8xZ1yB4cD6eF8gH0jK3lN6oP9rS2uV5` | Production |
| `AUTH_URL` | `https://YOUR_VERCEL_DOMAIN.vercel.app` | Production |
| `CRON_SECRET` | `dawrak-cron-secret-2025-v2-test-key` | Production |
| `NEXT_PUBLIC_BASE_URL` | `https://YOUR_VERCEL_DOMAIN.vercel.app` | Preview |
| `AUTH_SECRET` | `XgR9mKpL2vQ8sN4wT7yB1jH5cE3aF6dG0hI4kL7nO9qR2tU5vW8xZ1yB4cD6eF8gH0jK3lN6oP9rS2uV5` | Preview |
| `AUTH_URL` | `https://YOUR_VERCEL_DOMAIN.vercel.app` | Preview |
| `CRON_SECRET` | `dawrak-cron-secret-2025-v2-test-key` | Preview |
| `DATABASE_URL` | `postgres://f18c476f2864beb98764c1197c9d9e112408689c08dc809c5700ed546c717811:sk_TJfPTNfX7LvjIX8OCDS1w@db.prisma.io:5432/postgres?sslmode=require` | Preview |

> **Note:** Replace `YOUR_VERCEL_DOMAIN` with your actual Vercel domain after first deploy.
> After getting a custom domain, update `NEXT_PUBLIC_BASE_URL` and `AUTH_URL`.

### Step 3 — Deploy
1. Go back to your project dashboard
2. Click **"Redeploy"** on the latest deployment
3. Wait for build to complete (~2-3 minutes)

### Step 4 — Verify
Test these URLs after deployment:
- `https://YOUR_DOMAIN/` → Marketing page ✅
- `https://YOUR_DOMAIN/api/health` → DB check ✅
- `https://YOUR_DOMAIN/q/salon-al-amir` → Public shop page ✅
- `https://YOUR_DOMAIN/dashboard/login` → Login page ✅

### Step 5 — Demo Login (after deploy)
**Email:** `owner@salon-al-amir.local`  
**Password:** `demo1234`

## 🔧 Important Notes

### Build Command (Vercel already detects this)
```bash
# Vercel runs automatically:
# 1. npm install
# 2. prisma generate
# 3. next build
```

### Cron Jobs (already configured in `vercel.json`)
- `/api/cron/cleanup` every 5 minutes
- `/api/cron/retention` daily at 03:00 UTC

### Custom Domain (optional)
1. Go to Project Settings → Domains
2. Add your domain (e.g. `dawrak.app`)
3. Update `NEXT_PUBLIC_BASE_URL` and `AUTH_URL` env vars
4. Redeploy

## 🔐 Security Reminders
1. **NEVER commit `.env` to Git** — it's already in `.gitignore`
2. **Rotate AUTH_SECRET** after production launch: `openssl rand -base64 32`
3. **Rotate CRON_SECRET** regularly: `openssl rand -base64 24`
4. **Change demo passwords** after first login

## 📋 Post-Deploy Checklist
- [ ] Marketing page loads at `/`
- [ ] Shop page loads at `/q/salon-al-amir`
- [ ] Login works at `/dashboard/login`
- [ ] Dashboard stats load after login
- [ ] Join queue works from customer view
- [ ] SSE stream connects at `/api/queue/{id}/stream`
- [ ] Cron endpoints return 401 without token (protected)
