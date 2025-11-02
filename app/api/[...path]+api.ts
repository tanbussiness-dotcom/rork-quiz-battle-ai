import app from "@/backend/hono";

console.log("🚀 ===============================================");
console.log("🚀 [API Route Handler] MODULE LOADED");
console.log("🚀 [API Route Handler] File: app/api/[...path]+api.ts");
console.log("🚀 [API Route Handler] Time:", new Date().toISOString());
console.log("🚀 [API Route Handler] This file handles /api/* routes");
console.log("🚀 [API Route Handler] Hono app exists:", !!app);
console.log("🚀 [API Route Handler] Hono app.fetch is function:", typeof app.fetch === 'function');
console.log("🚀 ===============================================");

async function handleRequest(request: Request): Promise<Response> {
  console.log("📥 [API] ===========================================");
  console.log("📥 [API] Request received:", request.method, request.url);
  
  try {
    const url = new URL(request.url);
    console.log("🔍 [API] Original pathname:", url.pathname);
    console.log("🔍 [API] Search params:", url.search);
    
    const path = url.pathname.replace(/^\/api/, "") || "/";
    
    console.log("🔄 [API] Path after stripping /api:", path);
    console.log("🔄 [API] Forwarding to Hono:", path);
    
    const honoUrl = new URL(path + url.search, url.origin);
    console.log("🔗 [API] Hono URL:", honoUrl.toString());
    
    const honoRequest = new Request(honoUrl, {
      method: request.method,
      headers: request.headers,
      body: request.method !== "GET" && request.method !== "HEAD" ? request.body : undefined,
      duplex: request.method !== "GET" && request.method !== "HEAD" ? "half" : undefined,
    } as RequestInit);

    console.log("🚀 [API] Calling app.fetch...");
    const response = await app.fetch(honoRequest);
    console.log("✅ [API] Response status:", response.status);
    console.log("✅ [API] Response headers:", JSON.stringify([...response.headers.entries()]));
    console.log("📥 [API] ===========================================");
    return response;
  } catch (error: any) {
    console.error("❌ [API] ===========================================");
    console.error("❌ [API] Error:", error);
    console.error("❌ [API] Error message:", error.message);
    console.error("❌ [API] Error stack:", error.stack);
    console.error("❌ [API] ===========================================");
    return new Response(JSON.stringify({ error: error.message, stack: error.stack }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export function GET(request: Request) {
  return handleRequest(request);
}

export function POST(request: Request) {
  return handleRequest(request);
}

export function PUT(request: Request) {
  return handleRequest(request);
}

export function DELETE(request: Request) {
  return handleRequest(request);
}

export function PATCH(request: Request) {
  return handleRequest(request);
}

export function OPTIONS(request: Request) {
  return handleRequest(request);
}

export default async function handler(request: Request) {
  console.log("👀 [API] Default handler called:", request.method, request.url);
  return handleRequest(request);
}
