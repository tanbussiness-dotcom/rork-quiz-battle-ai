# Gemini Client-Side API Call Fix

## Issue
The application was attempting to call the Gemini API directly from the client side (browser/mobile app), which:
1. Exposes the GEMINI_API_KEY in the client bundle
2. Violates security best practices
3. Causes errors when the API key is not available on the client

## Error Messages
```
❌ Missing GEMINI_API_KEY — please add it to your .env file.
Context: Client (browser/app)
[Gemini] generation failed Gemini API calls must be made from the backend. Use tRPC procedures instead of calling this directly.
```

## Solution
Routed all Gemini API calls through the backend using tRPC procedures.

### Changes Made

#### 1. Updated `lib/gemini.ts`
- Added client-side detection to prevent direct Gemini API calls from the browser/app
- The `callGemini()` function now throws an error if called from the client
- Removed dependency on `getGeminiApiKey()` from `lib/env.ts` (which was trying to get the key on client)
- Now only uses `process.env.GEMINI_API_KEY` which is only available on the server

```typescript
export async function callGemini(prompt: string, timeoutMs: number = 15000): Promise<string> {
  const isClient = typeof window !== 'undefined';
  
  if (isClient) {
    throw new Error("Gemini API calls must be made from the backend. Use tRPC procedures instead of calling this directly.");
  }
  
  const apiKey = process.env.GEMINI_API_KEY || "";
  
  if (!apiKey) {
    console.error("❌ Missing GEMINI_API_KEY — please add it to your .env file.");
    throw new Error("Missing GEMINI_API_KEY — set GEMINI_API_KEY in your .env file");
  }
  
  // ... rest of implementation
}
```

#### 2. Updated `app/quiz.tsx`
- Removed direct import of `generateQuestionsWithChatGPT` from `@/lib/gemini`
- Now imports only the TypeScript type `QuizQuestion` from `@/lib/gemini`
- Uses `generateAndStoreQuestions` from `@/services/question.service` instead
- This service function calls the backend tRPC procedure `trpcClient.questions.generate.mutate()`

Before:
```typescript
import { QuizQuestion, generateQuestionsWithChatGPT } from "@/lib/gemini";

const generatedQuestions = await generateQuestionsWithChatGPT(
  topicData?.name || "General Knowledge",
  QUESTIONS_PER_QUIZ,
  { difficulty, language, timeoutMs: 12000, retries: 2 }
);
```

After:
```typescript
import type { QuizQuestion } from "@/lib/gemini";
import { generateAndStoreQuestions } from "@/services/question.service";

const generated = await generateAndStoreQuestions({
  topic: topicData?.name || "General Knowledge",
  count: QUESTIONS_PER_QUIZ,
  difficulty: chosenDifficulty as "Easy" | "Medium" | "Hard" | "Challenge",
  language: language === "vi" ? "Vietnamese" : "English",
});
```

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Client App                           │
│  (app/quiz.tsx)                                              │
│                                                              │
│  Uses: generateAndStoreQuestions()                          │
│  from services/question.service.ts                          │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     │ tRPC call
                     │
┌────────────────────▼─────────────────────────────────────────┐
│                      Backend (Hono)                          │
│  (backend/trpc/routes/questions/generate/route.ts)          │
│                                                              │
│  Uses: generateSingleQuestion()                             │
│  from lib/gemini.ts (runs server-side only)                 │
│                                                              │
│  Has access to: process.env.GEMINI_API_KEY                  │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     │ HTTPS request
                     │
┌────────────────────▼─────────────────────────────────────────┐
│                    Gemini API                                │
│  https://generativelanguage.googleapis.com/                 │
└──────────────────────────────────────────────────────────────┘
```

### Backend Environment Variable

The `GEMINI_API_KEY` is properly configured in the `env` file:
```
GEMINI_API_KEY=AIzaSyC3k1kr3YZdVmJVcgma0Y05P4TrZ2jCIi0
```

This variable is:
- **Only accessible on the server** (not exposed to client)
- Loaded by the backend when it starts
- Used by the tRPC procedure to generate questions

### Verification

The backend logs confirm the API key is loaded:
```typescript
console.log("🔍 [Backend] GEMINI_API_KEY exists:", !!process.env.GEMINI_API_KEY);
if (process.env.GEMINI_API_KEY) {
  console.log("✅ [Backend] Gemini API setup verified. Ready to generate quiz questions.");
  console.log("✅ [Backend] API Key length:", process.env.GEMINI_API_KEY.length);
}
```

### Testing

To test the Gemini integration:
1. Visit `/api/test-gemini` endpoint
2. Start a quiz and observe the backend logs
3. Check that questions are generated successfully

## Benefits

1. **Security**: API key is never exposed to the client
2. **Reliability**: Consistent error handling on the backend
3. **Maintainability**: All Gemini logic centralized in the backend
4. **Performance**: Can add caching and rate limiting on the backend

## Files Modified

- `lib/gemini.ts` - Added client-side detection
- `app/quiz.tsx` - Switched to backend API calls
- No changes needed to backend routes (already implemented)
