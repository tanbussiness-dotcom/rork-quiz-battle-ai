import app from "@/backend/hono";

console.log("🚀 [tRPC Catch-All API Route] Loaded: app/api/trpc/[...trpc]+api.ts");

async function handleTrpcRequest(request: Request): Promise<Response> {
  console.log("📥 [tRPC Catch-All] " + request.method + " " + request.url);
  
  try {
    if (!request.url) {
      throw new Error("Missing request URL");
    }
    
    const url = new URL(request.url);
    const originalPath = url.pathname;
    console.log("📥 [tRPC Catch-All] Full pathname:", originalPath);
    console.log("📥 [tRPC Catch-All] Search:", url.search);
    
    let trpcPath = originalPath.replace(/^\/api/, "") || "/";
    console.log("👉 [tRPC Catch-All] Forwarding to Hono backend:", trpcPath + url.search);
    
    const honoUrl = new URL(trpcPath + url.search, "http://localhost");
    
    const honoRequest = new Request(honoUrl.toString(), {
      method: request.method,
      headers: request.headers,
      body: request.method !== "GET" && request.method !== "HEAD" ? request.body : undefined,
      duplex: request.method !== "GET" && request.method !== "HEAD" ? "half" : undefined,
    } as RequestInit);
    
    console.log("🔗 [tRPC Catch-All] Hono Request URL:", honoRequest.url);
    const response = await app.fetch(honoRequest);
    const contentType = response.headers.get("content-type");
    console.log("✅ [tRPC Catch-All] Response:", response.status, "Content-Type:", contentType);
    
    return response;
  } catch (error: any) {
    console.error("❌ [tRPC Catch-All] Error:", error.message);
    console.error("❌ [tRPC Catch-All] Stack:", error.stack);
    
    return new Response(
      JSON.stringify({ 
        error: "tRPC API Route Error: " + error.message,
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
  return handleTrpcRequest(request);
}

export async function POST(request: Request) {
  return handleTrpcRequest(request);
}
