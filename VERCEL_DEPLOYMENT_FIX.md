# Fix: Print Bridge URL in Production

## Problem

Your Vercel deployment is still trying to connect to `http://localhost:3333` even though the code has been updated. This happens because:

1. **Vercel hasn't rebuilt with the new code yet** - You need to trigger a new deployment
2. **Environment variable is not set** - You need to add `NEXT_PUBLIC_PRINT_BRIDGE_URL` in Vercel

## Solution

### Step 1: Trigger a New Deployment

The code has been updated and pushed to GitHub, but Vercel needs to rebuild:

1. Go to your Vercel dashboard: https://vercel.com/dashboard
2. Find your `Sunshine` project
3. Click on the project
4. Go to the "Deployments" tab
5. Click the "..." menu on the latest deployment
6. Click "Redeploy" (or push a new commit to trigger auto-deploy)

### Step 2: Add Environment Variable

1. In your Vercel project, go to **Settings** → **Environment Variables**
2. Add a new variable:
   - **Name:** `NEXT_PUBLIC_PRINT_BRIDGE_URL`
   - **Value:** Your Print Bridge URL (e.g., `https://your-print-bridge.railway.app`)
   - **Environment:** Production, Preview, Development (select all)
3. Click **Save**
4. **Redeploy** the application (the environment variable change requires a redeploy)

### Step 3: Deploy Print Bridge (If Not Done Yet)

If you haven't deployed Print Bridge yet, see `PRINT_BRIDGE_SETUP_PRODUCTION.md` for instructions.

Quick options:
- **Railway:** https://railway.app (easiest)
- **Render:** https://render.com
- **VPS:** Any server with Node.js

### Step 4: Verify

After redeploying:

1. Check the browser console - you should see:
   - ✅ No more "localhost:3333" errors
   - ✅ Either printing works OR you see: "Print Bridge não configurado" (which is expected if URL not set)

2. Test a sale - it should complete successfully even if printing fails

## Current Behavior

With the updated code:
- ✅ Sales complete successfully even if printing fails
- ✅ Shows info message instead of error when Print Bridge not configured
- ✅ No more CORS errors blocking sales
- ✅ Production automatically detects and skips localhost

## Quick Checklist

- [ ] Code pushed to GitHub ✅ (already done)
- [ ] Trigger new Vercel deployment
- [ ] Add `NEXT_PUBLIC_PRINT_BRIDGE_URL` environment variable in Vercel
- [ ] Redeploy after adding environment variable
- [ ] Deploy Print Bridge to cloud service (if not done)
- [ ] Test a sale - should work even without Print Bridge
- [ ] Test printing - should work after Print Bridge is configured

## Why This Happened

The error "Print Bridge não está acessível. Verifique se o serviço está rodando em http://localhost:3333" means:

1. The old build is still running on Vercel
2. The production detection didn't work (now fixed)
3. Environment variable wasn't set

After redeploying with the new code, it will:
- Detect production environment correctly
- Return `null` for Print Bridge URL if not configured
- Show a friendly message instead of trying to connect to localhost

