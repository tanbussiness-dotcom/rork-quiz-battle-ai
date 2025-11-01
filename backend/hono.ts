import { Hono } from "hono";
import { trpcServer } from "@hono/trpc-server";
import { cors } from "hono/cors";
import { appRouter } from "./trpc/app-router";
import { createContext } from "./trpc/create-context";

const app = new Hono();

console.log("🔍 [Quiz Battle AI] OPENAI_API_KEY exists:", !!process.env.OPENAI_API_KEY);
if (process.env.OPENAI_API_KEY) {
  console.log("✅ OpenAI setup verified. Ready to generate quiz questions.");
}

app.use("*", cors());

app.use(
  "/api/trpc/*",
  trpcServer({
    endpoint: "/api/trpc",
    router: appRouter,
    createContext,
  })
);

app.get("/", (c) => {
  return c.json({ status: "ok", message: "API is running" });
});

app.get("/test-openai", async (c) => {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      return c.json({ 
        ok: false, 
        error: "OPENAI_API_KEY not found in environment",
        hasKey: false,
        keyLength: 0
      }, 500);
    }

    console.log("🔍 [Test OpenAI] Testing key with length:", apiKey.length);
    
    const response = await fetch("https://api.openai.com/v1/models", {
      headers: { 
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ [Test OpenAI] API error:", response.status, errorText);
      return c.json({ 
        ok: false, 
        error: `OpenAI API error: ${response.status}`,
        details: errorText,
        hasKey: true,
        keyLength: apiKey.length
      }, 500);
    }
    
    const data = await response.json();
    const modelCount = data.data?.length || 0;
    
    console.log("✅ [Test OpenAI] Successfully connected. Models:", modelCount);
    
    return c.json({ 
      ok: true, 
      models: modelCount,
      hasKey: true,
      keyLength: apiKey.length,
      message: "OpenAI connection successful"
    });
  } catch (error: any) {
    console.error("❌ [Test OpenAI] Exception:", error);
    return c.json({ 
      ok: false, 
      error: error.message,
      hasKey: !!process.env.OPENAI_API_KEY,
      keyLength: process.env.OPENAI_API_KEY?.length || 0
    }, 500);
  }
});

export default app;
