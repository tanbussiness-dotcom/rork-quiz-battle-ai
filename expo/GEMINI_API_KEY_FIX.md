# GEMINI_API_KEY Environment Variable Fix

## Problem
The application was showing errors:
- `❌ Missing GEMINI_API_KEY — please add it to your .env file before running tests.`
- `[Gemini] generation failed Missing GEMINI_API_KEY — set GEMINI_API_KEY in your .env`

## Root Cause
The environment variable `GEMINI_API_KEY` was correctly set in the `env` file, but:
1. **Bun runtime** doesn't automatically load env files in some contexts
2. **Client-side code** cannot access server-side environment variables (for security reasons)
3. The Gemini API functions were being called from both client and server contexts without proper separation

## Solution Applied

### 1. Manual Environment Loading (`server.ts`)
Added explicit environment variable loading from the `env` file when starting the backend server:
```typescript
// Reads the env file and loads variables into process.env
if (!process.env.GEMINI_API_KEY) {
  const envPath = resolve(process.cwd(), "env");
  const envContent = readFileSync(envPath, "utf-8");
  // Parse and load environment variables
}
```

### 2. Environment Utility Module (`lib/env.ts`)
Created a new utility to safely access environment variables:
- `getGeminiApiKey()` - Returns the API key only when running server-side
- `validateServerEnv()` - Validates required environment variables on startup
- Provides clear warnings when environment variables are accessed incorrectly

### 3. Enhanced Error Messages (`lib/gemini.ts`)
Updated the `callGemini` function to:
- Detect whether it's running on client or server
- Provide context-specific error messages
- Guide developers to use tRPC procedures for client-side calls
- Log available environment keys for debugging

### 4. Test File Updates (`tests/gemini.test.ts`)
Added automatic environment loading to the test file:
- Loads `env` file before running tests
- Shows the API key status (masked for security)
- Allows tests to run successfully with proper environment setup

## Current API Key
The API key is set to: `AIzaSyC3k1kr3YZdVmJVcgma0Y05P4TrZ2jCIi0`
(Located in the `env` file)

## Best Practices Going Forward

### ✅ DO:
- Call Gemini functions through **tRPC procedures** from client code
- Use backend routes in `backend/trpc/routes/` for all AI operations
- Keep the API key in the `env` file (never commit to git)
- Use the existing `generateQuestionProcedure` for question generation

### ❌ DON'T:
- Call `generateSingleQuestion()` or `generateQuestions()` directly from React components
- Expose `GEMINI_API_KEY` to the client by prefixing with `EXPO_PUBLIC_`
- Hardcode API keys in source files

## Testing
Run the test suite to verify the fix:
```bash
bun run tests/gemini.test.ts
```

Expected output:
```
✅ Loaded environment variables from 'env' file
🔑 GEMINI_API_KEY: Found (AIzaSyC3k1...)
[Gemini Test] Starting tests at [timestamp]
[Test: math/easy] ✅ SUCCESS (1 question valid)
...
Summary: 6/6 tests passed
```

## Related Files Modified
- `server.ts` - Added manual environment loading
- `lib/env.ts` - NEW: Environment utility module
- `lib/gemini.ts` - Enhanced error handling and validation
- `tests/gemini.test.ts` - Added environment loading for tests
- `env` - Contains the GEMINI_API_KEY (already existed)

## Verification
The backend logs should now show:
```
✅ [Backend] Gemini API setup verified. Ready to generate quiz questions.
✅ [Backend] API Key length: 39
```

## Next Steps
If you still see the error:
1. Verify the `env` file exists in the project root
2. Check that `GEMINI_API_KEY=AIzaSyC3k1kr3YZdVmJVcgma0Y05P4TrZ2jCIi0` is on a single line
3. Restart the backend server completely
4. Run the test file to confirm: `bun tests/gemini.test.ts`
