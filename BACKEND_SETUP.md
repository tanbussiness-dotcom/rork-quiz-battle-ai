# Backend Setup Issue - tRPC API Routes Not Working

## Problem
The app is getting `Expected JSON but got text/html` errors when trying to call tRPC endpoints. This happens because the API routes aren't being reached.

## Root Cause
**Expo Router API routes (`+api.ts` files) don't work reliably in web development mode.** They work in production builds but fail in dev server.

When the tRPC client tries to call `/api/trpc/*`, instead of hitting the API route handler, it's getting the HTML page of the app.

## Solution

The backend code needs to run on a **separate Node server**, not inline with the Expo dev server.

### Option 1: Set Backend URL (Recommended for Rork Platform)

The `EXPO_PUBLIC_RORK_API_BASE_URL` environment variable needs to point to where the backend server is running.

1. Check what ports are exposed:
   - Frontend (Expo): Usually port 8081
   - Backend (Hono/Node): Should be on a different port (e.g., 3000, 8080)

2. Set the environment variable in `env` file:
   ```
   EXPO_PUBLIC_RORK_API_BASE_URL=https://3000-YOUR_WORKSPACE_ID.e2b.app
   ```
   
   Replace `YOUR_WORKSPACE_ID` with your actual E2B workspace ID from the URL.

3. Restart the dev server

### Option 2: Run Separate Backend Server

If the platform isn't automatically running the backend:

1. Create a backend server entry point (`server.ts` or similar)
2. Add a script to package.json:
   ```json
   "backend": "bun run backend/server.ts"
   ```
3. Run both servers simultaneously
4. Configure `EXPO_PUBLIC_RORK_API_BASE_URL` to point to the backend

### Option 3: Mock Backend (Temporary Workaround)

For development/testing, you can mock the backend responses in the frontend:

```typescript
// In services/question.service.ts or similar
if (Platform.OS === 'web' && !process.env.EXPO_PUBLIC_RORK_API_BASE_URL) {
  // Return mock data instead of making API calls
  return mockQuestions;
}
```

## Debugging

Use the diagnostic screen at `/debug-backend` to test connectivity:

1. Navigate to the debug screen
2. Click "Run Tests"
3. Check which endpoints are reachable
4. Configure the backend URL based on results

## Technical Details

### Why This Happens

1. **Expo Router API Routes**: The `app/api/[...slug]+api.ts` file is the correct syntax for API routes
2. **Web Dev Limitation**: These routes don't work in Expo's web dev server
3. **Server Environment**: Backend code needs Node.js runtime features (env variables, OpenAI API, etc.)
4. **Browser Limitations**: Can't run server code in browser

### What Should Work

- ✅ Native apps with `EXPO_PUBLIC_RORK_API_BASE_URL` set
- ✅ Production web builds
- ✅ Separate backend server
- ❌ Web dev server with inline API routes

## Next Steps

1. Contact Rork platform support to ensure backend is running and URL is configured
2. Or manually configure the backend URL as described above
3. Verify backend is reachable using `/debug-backend` screen
4. Check console logs for API connectivity
