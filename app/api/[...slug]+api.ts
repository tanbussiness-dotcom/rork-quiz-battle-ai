console.log("🚀🚀🚀 [API Route] =================== LOADING app/api/[...slug]+api.ts ===================");
console.log("🚀 [API Route] Timestamp:", new Date().toISOString());
console.log("🚀 [API Route] Environment:", {
  NODE_ENV: process.env.NODE_ENV,
  hasGemini: !!process.env.GEMINI_API_KEY,
});

import app from "@/backend/hono";

console.log("✅ [API Route] Hono app imported successfully");

async function handleApiRequest(request: Request): Promise<Response> {
  console.log("📥 [API Route] " + request.method + " " + request.url);
  
  try {
    if (!request.url) {
      throw new Error("Missing request URL");
    }
    
    const url = new URL(request.url);
    console.log("📥 [API Route] Pathname:", url.pathname);
    console.log("📥 [API Route] Search:", url.search);
    
    let apiPath = url.pathname.replace(/^\/api/, "") || "/";
    console.log("👉 [API Route] Forwarding to Hono:", apiPath + url.search);
    
    const honoUrl = new URL(apiPath + url.search, "http://localhost");
    
    const honoRequest = new Request(honoUrl.toString(), {
      method: request.method,
      headers: request.headers,
      body: request.method !== "GET" && request.method !== "HEAD" ? request.body : undefined,
      duplex: request.method !== "GET" && request.method !== "HEAD" ? "half" : undefined,
    } as RequestInit);
    
    console.log("🔗 [API Route] Hono Request URL:", honoRequest.url);
    const response = await app.fetch(honoRequest);
    const contentType = response.headers.get("content-type");
    console.log("✅ [API Route] Response:", response.status, "Content-Type:", contentType);
    
    if (!contentType || !contentType.includes("application/json")) {
      const text = await response.text();
      console.error("⚠️ [API Route] Response is not JSON. Body preview:", text.slice(0, 200));
      return new Response(text, {
        status: response.status,
        headers: response.headers,
      });
    }
    
    return response;
  } catch (error: any) {
    console.error("❌ [API Route] Error:", error.message);
    console.error("❌ [API Route] Stack:", error.stack);
    
    return new Response(
      JSON.stringify({ 
        error: "API Route Error: " + error.message,
        path: new URL(request.url).pathname,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500, 
        headers: { "Content-Type": "application/json" } 
      }
    );
  }
}

export async function GET(request: Request) {
  return handleApiRequest(request);
}

export async function POST(request: Request) {
  return handleApiRequest(request);
}
