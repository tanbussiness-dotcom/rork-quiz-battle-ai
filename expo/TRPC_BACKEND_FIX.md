# tRPC Backend Connection Fix

## Issues Fixed

### 1. **Incorrect tRPC Client Type**
**Problem**: The `trpcClient` export in `lib/trpc.ts` was created using `trpc.createClient()` which creates a React Query client, not a vanilla tRPC client for use outside React components.

**Solution**: 
- Created two separate clients:
  - `trpcReactClient`: For use in React components with React Query
  - `trpcClient`: Vanilla tRPC client for use in services
- Updated `app/_layout.tsx` to use `trpcReactClient`

### 2. **Environment Variable Conflict**
**Problem**: `EXPO_PUBLIC_TRPC_SERVER_URL` was set to `https://dev-ykrc1y8nz7vp0ke7gu29w.rorktest.dev/api/trpc`, which was returning HTML (the frontend app) instead of the backend API.

**Solution**: 
- Cleared the `EXPO_PUBLIC_TRPC_SERVER_URL` in the `env` file
- This allows auto-detection to work properly:
  - On web: Uses `window.location.origin/api/trpc`
  - On native: Uses Expo's `hostUri`

### 3. **E2B/Rork Platform Detection**
**Problem**: When running on the Rork platform (E2B containers), the backend might be on a different port (8081) than the frontend.

**Solution**: 
- Added E2B-specific URL detection logic
- Automatically tries to construct the correct backend URL when on E2B or rorktest.dev domains

### 4. **Better Error Logging**
**Problem**: Hard to debug which URLs were being tried and why they failed.

**Solution**: 
- Added comprehensive logging for each URL attempt
- Shows status codes, content-types, and response bodies
- Distinguishes between React client and vanilla client logs

## How It Works Now

### URL Resolution Priority:
1. `EXPO_PUBLIC_TRPC_SERVER_URL` (if set)
2. `EXPO_PUBLIC_RORK_API_BASE_URL` (if set)
3. **Web**: `window.location.origin/api/trpc`
4. **Web on E2B**: `https://8081-<session-id>.e2b.app/api/trpc`
5. **Native**: `http://<expo-host>:8081/api/trpc`
6. Fallback: `http://localhost:3000/api/trpc`

### API Route Flow:
```
Frontend Request → /api/trpc/questions.generate
              ↓
    Expo Router catches /api/*
              ↓
    app/api/[...slug]+api.ts
              ↓
    backend/hono.ts (Hono app)
              ↓
    /trpc/* route → @hono/trpc-server
              ↓
    backend/trpc/app-router.ts
              ↓
    backend/trpc/routes/questions/generate/route.ts
              ↓
    Calls Gemini API → Returns question
```

## Testing

### 1. Test API Routes
Navigate to `/test-api-routes` screen to test:
- `/api/test` - Basic API route
- `/api/` - Backend root (should return JSON health check)
- `/api/trpc/example.hi` - Simple tRPC procedure
- `/api/trpc/questions.generate` - Question generation

### 2. Check Console Logs
Look for these logs:
```
✅ [tRPC] Using configured URL: <url>
📍 [tRPC] Web resolved URL: <url>
🔍 [tRPC Client] Trying: <url>
✅ [tRPC Client] Status: 200 CT: application/json
```

### 3. Expected Behavior
- ✅ Questions generate via backend (Gemini API)
- ✅ No "Failed to fetch" errors
- ✅ No HTML responses from `/api/trpc` endpoints
- ✅ Console shows successful 200 responses with `application/json`

## If It Still Doesn't Work

### Check 1: API Route Handler
Verify `app/api/[...slug]+api.ts` is being loaded:
- Should see `🚀 [API Route] Loaded` in console
- Should see `📥 [API Route] POST /api/trpc/questions.generate` when generating

### Check 2: Environment Variables
Run the `/env-check` screen or check logs:
- `GEMINI_API_KEY` should exist and have correct length
- Should NOT show any tRPC URL env vars (unless intentionally set)

### Check 3: Hono Backend
Check if backend is initializing:
- Should see `🚀 [Backend] Starting Quiz Battle AI backend...`
- Should see `✅ [Backend] Gemini API setup verified`
- Should NOT see `❌ [Backend] WARNING: GEMINI_API_KEY not found!`

### Check 4: Network Tab
Open browser DevTools → Network:
- Find requests to `/api/trpc/questions.generate`
- Check if response is JSON or HTML
- If HTML → API route handler not working
- If JSON with error → Backend is working, check error message
- If 404 → Route not found, check Expo Router setup

## Common Issues

### Issue: "Expected JSON but got text/html"
**Cause**: The API route handler isn't catching the request, so Expo Router serves the frontend app.

**Solutions**:
1. Restart Expo dev server: `npx expo start -c`
2. Check `app/api/[...slug]+api.ts` file exists
3. Verify file has `+api.ts` suffix (not `.ts`)
4. Try accessing `/api/test` directly in browser - should return JSON, not HTML

### Issue: "GEMINI_API_KEY not found"
**Cause**: Environment variable not loaded in backend context.

**Solutions**:
1. Check `env` file has `GEMINI_API_KEY=...`
2. Restart Expo dev server after changing env file
3. Check if `.env` or `env` file is being read (Expo uses both)

### Issue: "Failed to fetch" errors
**Cause**: Backend server not running or CORS issue.

**Solutions**:
1. Check if backend is initializing (see console logs)
2. Try the `/test-api-routes` screen to isolate the issue
3. Check browser console for CORS errors
4. Verify `backend/hono.ts` has `app.use("*", cors())`

## Files Modified

1. `lib/trpc.ts` - Split client types, improved URL detection
2. `app/_layout.tsx` - Use `trpcReactClient` instead of `trpcClient`
3. `env` - Cleared `EXPO_PUBLIC_TRPC_SERVER_URL`
4. `app/test-api-routes.tsx` - New testing screen (created)
5. `TRPC_BACKEND_FIX.md` - This documentation (created)

## Next Steps

1. **Test the app** - Try generating questions in Solo mode
2. **Check logs** - Verify successful tRPC connections
3. **Use test screen** - Navigate to `/test-api-routes` for detailed diagnostics
4. **Report back** - Share console logs if issues persist

The backend should now properly connect through the Expo Router API handler and generate questions using the Gemini API.
