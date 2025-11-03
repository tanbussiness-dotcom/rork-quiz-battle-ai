import { Hono } from "hono";
import { trpcServer } from "@hono/trpc-server";
import { cors } from "hono/cors";
import { appRouter } from "./trpc/app-router";
import { createContext } from "./trpc/create-context";

const app = new Hono();

console.log("🚀 [Backend] Starting Quiz Battle AI backend...");
console.log("🔍 [Backend] GEMINI_API_KEY exists:", !!process.env.GEMINI_API_KEY);
if (process.env.GEMINI_API_KEY) {
  console.log("✅ [Backend] Gemini API setup verified. Ready to generate quiz questions.");
  console.log("✅ [Backend] API Key length:", process.env.GEMINI_API_KEY.length);
} else {
  console.error("❌ [Backend] WARNING: GEMINI_API_KEY not found! Question generation will fail.");
}

app.use("*", cors());

app.use("*", async (c, next) => {
  console.log("🔍 [Backend] Incoming request:", c.req.method, c.req.url);
  console.log("🔍 [Backend] Path:", c.req.path);
  await next();
  console.log("✅ [Backend] Response sent with status:", c.res.status);
});

app.onError((err, c) => {
  console.error("❌ [Backend] Unhandled error:", err);
  return c.json(
    {
      error: "Internal server error",
      message: err.message,
      path: c.req.url,
    },
    500
  );
});

app.use(
  "/trpc/*",
  trpcServer({
    router: appRouter,
    createContext,
  })
);

app.get("/", (c) => {
  return c.json({ 
    status: "ok", 
    message: "Quiz Battle AI Backend",
    note: "This backend is mounted at /api/* by Expo Router",
    endpoints: {
      health: "/ (accessed as /api/)",
      testGemini: "/test-gemini (accessed as /api/test-gemini)",
      trpc: "/trpc (accessed as /api/trpc)"
    },
    geminiConfigured: !!process.env.GEMINI_API_KEY
  });
});

app.get("/test-gemini", async (c) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      return c.json({ 
        ok: false, 
        error: "GEMINI_API_KEY not found in environment",
        hasKey: false,
        keyLength: 0
      }, 500);
    }

    console.log("🔍 [Test Gemini] Testing key with length:", apiKey.length);
    
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${apiKey}`;
    const response = await fetch(url, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: "Say 'Hello from Gemini API test!'"
          }]
        }]
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ [Test Gemini] API error:", response.status, errorText);
      return c.json({ 
        ok: false, 
        error: `Gemini API error: ${response.status}`,
        details: errorText,
        hasKey: true,
        keyLength: apiKey.length
      }, 500);
    }
    
    const data = await response.json();
    const responseText = data?.candidates?.[0]?.content?.parts?.[0]?.text || "No response";
    
    console.log("✅ [Test Gemini] Successfully connected. Response:", responseText);
    
    return c.json({ 
      ok: true, 
      response: responseText,
      hasKey: true,
      keyLength: apiKey.length,
      message: "Gemini connection successful"
    });
  } catch (error: any) {
    console.error("❌ [Test Gemini] Exception:", error);
    return c.json({ 
      ok: false, 
      error: error.message,
      hasKey: !!process.env.GEMINI_API_KEY,
      keyLength: process.env.GEMINI_API_KEY?.length || 0
    }, 500);
  }
});

export default app;
