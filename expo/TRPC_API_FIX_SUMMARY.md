# tRPC API Connection Fix Summary

## Problem
The app was receiving HTML (the Expo web app) instead of JSON from the tRPC backend when trying to generate quiz questions. This caused "Failed to fetch" errors and forced the app to fall back to mock questions.

## Root Cause
The API route `app/api/[...slug]+api.ts` wasn't properly catching tRPC routes on the Rork platform. When the client tried to hit `/api/trpc/*`, it was getting the Expo app HTML instead of the backend JSON response.

## Solution

### 1. Created Specific tRPC Catch-All Route
**File:** `app/api/trpc/[...trpc]+api.ts`

This new route specifically handles all `/api/trpc/*` requests and forwards them to the Hono backend. The route:
- Catches all requests to `/api/trpc/**`
- Strips the `/api` prefix
- Forwards to the Hono backend
- Returns the JSON response from tRPC

### 2. Simplified tRPC URL Resolution
**File:** `lib/trpc.ts`

Updated the URL resolution to:
- Use `window.location.origin + /api/trpc` on web (absolute URL instead of relative)
- Remove complex fallback logic that was trying too many invalid URLs
- Focus on the primary candidate: same-origin `/api/trpc`

### 3. Added Health Check Endpoint
**File:** `app/api/health+api.ts`

Simple diagnostic endpoint to verify:
- API routes are working
- GEMINI_API_KEY is configured
- Backend is responding with JSON

### 4. Enhanced Error Messages
**File:** `services/question.service.ts`

Added better troubleshooting messages that guide developers to:
1. Check `/api/health` endpoint
2. Verify GEMINI_API_KEY in .env
3. Look for specific console log patterns

## How to Verify the Fix

### Step 1: Check Health Endpoint
Open your browser console and run:
```javascript
fetch('/api/health').then(r => r.json()).then(console.log)
```

Expected output:
```json
{
  "status": "ok",
  "message": "API routes are working",
  "geminiConfigured": true,
  "geminiKeyLength": 39
}
```

### Step 2: Check Console Logs
When you start Solo mode and select a topic/difficulty, look for these console messages:

✅ **Success Pattern:**
```
🔗 [tRPC] Initial tRPC URL: https://your-domain.com/api/trpc
🔍 [tRPC Client] Trying: https://your-domain.com/api/trpc/questions.generate
🔍 [tRPC Client] Status: 200 CT: application/json
📥 [tRPC Catch-All] POST https://your-domain.com/api/trpc/questions.generate
✅ [tRPC Catch-All] Response: 200 Content-Type: application/json
✅ [Question Service] Backend successfully generated question
```

❌ **Failure Pattern (if still broken):**
```
❌ [tRPC Client] Expected JSON but got: text/html
❌ [tRPC Client] Body: <!DOCTYPE html>...
```

### Step 3: Test Question Generation
1. Open the app
2. Go to Solo Mode
3. Select a topic (e.g., "Science")
4. Select difficulty (e.g., "Medium")
5. Click Start
6. The quiz should load with AI-generated questions (not mock questions)

## Files Changed
- ✅ `app/api/trpc/[...trpc]+api.ts` - NEW: Specific tRPC catch-all route
- ✅ `app/api/health+api.ts` - NEW: Health check endpoint
- ✅ `lib/trpc.ts` - UPDATED: Simplified URL resolution
- ✅ `services/question.service.ts` - UPDATED: Better error messages

## Backend Flow
```
Client Request
    ↓
/api/trpc/questions.generate
    ↓
app/api/trpc/[...trpc]+api.ts (Expo Router API route)
    ↓
backend/hono.ts (Hono server with /trpc/* mounted)
    ↓
backend/trpc/app-router.ts (tRPC router)
    ↓
backend/trpc/routes/questions/generate/route.ts (Question generation)
    ↓
lib/gemini.ts (Gemini API call)
    ↓
Response with JSON question data
```

## Environment Variables Required
Make sure your `.env` file has:
```bash
GEMINI_API_KEY=AIzaSy...your-key-here
```

The `EXPO_PUBLIC_TRPC_SERVER_URL` is no longer required as the app now auto-detects the correct URL from `window.location.origin`.

## Troubleshooting

### If you still see "Failed to fetch" errors:

1. **Check if health endpoint works:**
   - Open: `https://your-domain.com/api/health`
   - Should return JSON, not HTML

2. **Check GEMINI_API_KEY:**
   - Make sure it's in your `.env` file
   - Restart the Expo server after changing `.env`
   - Verify in console: "geminiConfigured: true"

3. **Check console for route loading:**
   - Look for: `🚀 [tRPC Catch-All API Route] Loaded`
   - If missing, the route file isn't being loaded

4. **Try clearing cache:**
   ```bash
   npx expo start -c
   ```

## Success Indicators
✅ Console shows tRPC routes loading successfully
✅ `/api/health` returns JSON
✅ Questions generate without falling back to mocks
✅ Console shows "application/json" content-type
✅ No "Expected JSON but got: text/html" errors
