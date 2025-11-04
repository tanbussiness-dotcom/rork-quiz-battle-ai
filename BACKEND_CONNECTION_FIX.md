# Backend Connection Fix

## Problem
Your app was showing these errors:
- ❌ [tRPC] Fetch error: Failed to fetch
- ❌ [Question Service] Failed to generate questions
- ❌ [Quiz] Backend generation completely failed

This means the **frontend cannot connect to the backend API**.

## Root Cause
The backend API routes at `/api/trpc` are not accessible. This happens because:
1. Expo Router API routes don't always work reliably in development mode on web
2. The API route handler needs the backend code to run in a Node.js environment
3. The tRPC client is trying to connect but the endpoint is not responding

## What I've Fixed

### 1. **Improved tRPC Client URL Resolution** (`lib/trpc.ts`)
- ✅ Now uses `window.location.origin` on web to construct API URLs
- ✅ Better logging to show exactly which endpoint is being used
- ✅ Clearer error messages when connection fails

### 2. **Enhanced API Route Handler** (`app/api/[...slug]+api.ts`)
- ✅ Improved error handling and logging
- ✅ Better error messages with timestamps
- ✅ More detailed console logs for debugging

### 3. **Created Health Check Component** (`components/BackendHealthCheck.tsx`)
- ✅ Tests backend connectivity on app load
- ✅ Shows clear error message if backend is unreachable
- ✅ Provides retry button

## How to Verify the Fix

### Step 1: Check the Console
Open the browser console and look for these logs when the app loads:

```
✅ [tRPC] Using web origin: https://...
🔗 [tRPC] Using base: https://.../api
🔗 [tRPC] tRPC endpoint: https://.../api/trpc
```

If you see:
```
⚠️ [tRPC] Fallback to relative path '/api'
```
This is normal for web apps.

### Step 2: Test the Backend Health
Navigate to your app in the browser and open the console. You should see:

```
🔍 [Health Check] Testing endpoint: https://.../api/
```

If the backend is working, you'll see:
```
✅ Backend connected successfully
```

If it's not working, you'll see an error message.

### Step 3: Try Starting a Quiz
1. Go to Solo mode
2. Select a topic and difficulty
3. Press Start

If it works:
- ✅ You'll see "Generating AI Questions..." with a loader
- ✅ Questions will appear and you can play

If it fails:
- ❌ You'll see an alert saying "Could not connect to AI service"
- ℹ️ The app will fall back to sample questions so you can still play

## Troubleshooting

### Issue: "Failed to fetch" errors persist

**On Rork Platform:**
The Rork platform should automatically handle the backend. If you're still seeing errors:
1. Check if there's a separate backend URL exposed
2. Contact Rork support to ensure backend is running

**Local Development:**
The API routes work through Expo's built-in API route handling. If they're not working:

**Option A: Check if API route loads**
Open this URL in your browser: `http://localhost:8081/api/`

You should see JSON like:
```json
{
  "status": "ok",
  "message": "Quiz Battle AI Backend",
  ...
}
```

If you get HTML instead, the API routes aren't working.

**Option B: Run backend separately (advanced)**
If API routes don't work, you can run the backend as a separate server:

1. Open a new terminal
2. Run: `bun server.ts`
3. This starts the backend on port 3000
4. Update `env` file:
   ```
   EXPO_PUBLIC_RORK_API_BASE_URL=http://localhost:3000
   ```
5. Restart the Expo app

### Issue: "Missing GEMINI_API_KEY"

Even if the backend connects, you might see this error. This means:
- The backend is running
- But the `GEMINI_API_KEY` environment variable is not loaded

**Fix:**
1. Check the `env` file has:
   ```
   GEMINI_API_KEY=AIzaSyC3k1kr3YZdVmJVcgma0Y05P4TrZ2jCIi0
   ```

2. If running backend separately, make sure it loads the `env` file

3. Check console for:
   ```
   ✅ [Backend] Gemini API setup verified
   ```

### Issue: App falls back to sample questions

If you see the alert "Using Sample Questions", this means:
- ✅ The app is working (you can play)
- ❌ The backend couldn't generate AI questions
- ℹ️ You're playing with pre-made sample questions

This is intentional fallback behavior to keep the app usable.

To use AI questions:
1. Fix the backend connection (see above)
2. Ensure Gemini API key is configured
3. Retry starting a quiz

## Testing Checklist

- [ ] Console shows tRPC endpoint URL
- [ ] Can open `/api/` in browser and get JSON
- [ ] Health check passes (if you add the component)
- [ ] Can start a quiz without "Failed to fetch" errors
- [ ] Questions generate successfully (or see "Using Sample Questions" alert)
- [ ] Console shows `✅ [Quiz] All questions generated successfully`

## Next Steps

### If Everything Works:
Great! The quiz should now generate AI questions properly.

### If Backend Still Fails:
The app will automatically use sample questions as fallback. To enable AI generation:
1. Verify backend is running and accessible
2. Check Gemini API key is configured
3. Review console logs for specific error messages
4. Contact support if on Rork platform

### To Add Health Check to UI:
Add this to your home or settings screen:

```tsx
import BackendHealthCheck from "@/components/BackendHealthCheck";

// In your render:
<BackendHealthCheck />
```

This will show a warning banner if the backend is unreachable.

## Summary

**What Changed:**
- ✅ Better URL resolution for API endpoints
- ✅ Improved error messages and logging
- ✅ Health check component for diagnostics
- ✅ API route handler enhancements

**What Works Now:**
- ✅ App will try to connect to backend at the correct URL
- ✅ Clear console logs show what's happening
- ✅ Automatic fallback to sample questions if backend fails
- ✅ User-friendly error messages

**What You Might Need To Do:**
- Verify backend is running (on Rork platform, this should be automatic)
- Check console logs to diagnose connection issues
- Ensure Gemini API key is properly configured
- Contact support if issues persist

## Still Having Issues?

If you're still seeing "Failed to fetch" errors:

1. **Share these logs from console:**
   - The tRPC endpoint URL
   - Any error messages from [API Route] or [tRPC]
   - Result of opening `/api/` in browser

2. **Check your environment:**
   - Are you on Rork platform or local dev?
   - What does the URL bar show?
   - Can you access any other endpoints?

3. **Try the diagnostic page:**
   - Navigate to `/debug-backend` if it exists
   - Run the connection tests
   - Share the results

This information will help diagnose the specific connectivity issue.
