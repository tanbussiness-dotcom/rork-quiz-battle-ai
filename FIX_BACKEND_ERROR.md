# 🔧 Fix for tRPC "Expected JSON but got text/html" Error

## What's Happening

Your app is trying to call the backend API at `/api/trpc/*`, but instead of getting JSON responses, it's getting the HTML of your app page. This means the API routes aren't working.

## Quick Fix (Choose One Option)

### Option 1: Set Backend URL Environment Variable (EASIEST)

Since you're on the Rork platform, the backend server should already be running. You just need to tell the frontend where it is.

1. **Find your backend URL**:
   - Look at your current URL: `https://8081-xxxxx.e2b.app`
   - The backend is likely on port 3000: `https://3000-xxxxx.e2b.app`
   - Or check the Rork dashboard for the backend URL

2. **Update the `env` file**:
   ```bash
   # Change this line:
   EXPO_PUBLIC_RORK_API_BASE_URL=
   
   # To this (replace with your actual backend URL):
   EXPO_PUBLIC_RORK_API_BASE_URL=https://3000-xxxxx.e2b.app
   ```

3. **Restart the app** (may need to refresh the browser)

### Option 2: Run Backend Server Manually

If the backend isn't automatically running:

1. **Open a new terminal**

2. **Run the backend**:
   ```bash
   bun server.ts
   ```
   
   This will start the backend on port 3000

3. **In another terminal, run the frontend**:
   ```bash
   bun start-web
   ```

4. **Update the `env` file** with `http://localhost:3000` (if local) or the tunnel URL

### Option 3: Use Mock Data (Temporary)

If you just want to test the UI without backend:

- I can modify the code to use mock/cached questions instead of calling the API
- This is only for testing - won't have AI-generated questions

## How to Verify It's Fixed

1. **Check the console logs**:
   - Look for: `✅ [tRPC] Backend health check: { status: "ok", ... }`
   - If you see this, the backend is connected!

2. **Test the quiz**:
   - Try starting a quiz
   - If questions load, it's working!

3. **Use the diagnostic tool**:
   - Navigate to `/debug-backend` in your app
   - Click "Run Tests"
   - All tests should show green (success)

## Why This Happens

**Technical explanation**: Expo Router's API routes (`+api.ts` files) don't work in web development mode. They work great in native apps and production web builds, but fail in the dev server. The solution is to run the backend as a separate server and configure the frontend to connect to it.

## What I've Already Done

✅ Added more detailed error logging
✅ Created a diagnostic screen (`/debug-backend`)
✅ Created a standalone backend server file (`server.ts`)
✅ Updated tRPC client to use environment variable
✅ Documented the issue

## Next Steps

**Please let me know which option you'd like to use**, and I can help you:
1. Find the correct backend URL for your environment
2. Run the backend server manually
3. Set up mock data for testing

Or if you're on the Rork platform, the platform team may need to ensure the backend URL is automatically configured.
