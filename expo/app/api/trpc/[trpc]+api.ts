console.log("🚀🚀🚀 [tRPC API Route] =================== LOADING app/api/trpc/[trpc]+api.ts ===================");
console.log("🚀 [tRPC API Route] Timestamp:", new Date().toISOString());

import app from "@/backend/hono";

console.log("✅ [tRPC API Route] Hono app imported successfully");

async function handleTrpcRequest(request: Request): Promise<Response> {
  console.log("📥 [tRPC API] " + request.method + " " + request.url);
  
  try {
    const url = new URL(request.url);
    console.log("📥 [tRPC API] Full URL:", url.href);
    console.log("📥 [tRPC API] Pathname:", url.pathname);
    
    const honoPath = "/trpc" + url.pathname.replace(/.*\/trpc/, "") + url.search;
    console.log("👉 [tRPC API] Forwarding to Hono:", honoPath);
    
    const honoUrl = new URL(honoPath, "http://localhost");
    const honoRequest = new Request(honoUrl.toString(), {
      method: request.method,
      headers: request.headers,
      body: request.method !== "GET" && request.method !== "HEAD" ? request.body : undefined,
      duplex: request.method !== "GET" && request.method !== "HEAD" ? "half" : undefined,
    } as RequestInit);
    
    console.log("🔗 [tRPC API] Hono Request URL:", honoRequest.url);
    const response = await app.fetch(honoRequest);
    console.log("✅ [tRPC API] Response:", response.status, response.headers.get("content-type"));
    
    return response;
  } catch (error: any) {
    console.error("❌ [tRPC API] Error:", error.message);
    return new Response(
      JSON.stringify({ 
        error: "tRPC API Error: " + error.message,
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
  return handleTrpcRequest(request);
}

export async function POST(request: Request) {
  return handleTrpcRequest(request);
}
