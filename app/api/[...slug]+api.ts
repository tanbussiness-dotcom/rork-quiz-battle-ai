import app from "@/backend/hono";

console.log("🚀 [API Route] Loaded: app/api/[...slug]+api.ts");
console.log("🚀 [API Route] This file is being executed!");

async function handleApiRequest(request: Request): Promise<Response> {
  console.log("📥 [API] Request:", request.method, request.url);
  
  try {
    const url = new URL(request.url);
    console.log("📥 [API] Original path:", url.pathname);
    console.log("📥 [API] Search params:", url.search);
    console.log("📥 [API] Content-Type:", request.headers.get("content-type"));
    
    const apiPath = url.pathname.replace(/^\/api/, "") || "/";
    console.log("📥 [API] Forwarding to Hono with path:", apiPath);
    
    const honoUrl = new URL(apiPath + url.search, url.origin);
    console.log("📥 [API] Hono URL:", honoUrl.toString());
    
    const honoRequest = new Request(honoUrl, {
      method: request.method,
      headers: request.headers,
      body: request.method !== "GET" && request.method !== "HEAD" ? request.body : undefined,
      duplex: request.method !== "GET" && request.method !== "HEAD" ? "half" : undefined,
    } as RequestInit);
    
    const response = await app.fetch(honoRequest);
    console.log("✅ [API] Response status:", response.status);
    console.log("✅ [API] Response content-type:", response.headers.get("content-type"));
    return response;
  } catch (error: any) {
    console.error("❌ [API] Error:", error.message);
    console.error("❌ [API] Error stack:", error.stack);
    return new Response(
      JSON.stringify({ error: error.message, stack: error.stack }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

export async function GET(request: Request) {
  return handleApiRequest(request);
}

export async function POST(request: Request) {
  return handleApiRequest(request);
}
