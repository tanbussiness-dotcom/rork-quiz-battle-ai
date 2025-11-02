import app from "@/backend/hono";

console.log("🚀 ===============================================");
console.log("🚀 [API Route Handler] MODULE LOADED");
console.log("🚀 [API Route Handler] File: app/api/[...path]+api.ts");
console.log("🚀 [API Route Handler] Time:", new Date().toISOString());
console.log("🚀 [API Route Handler] This file handles /api/* routes");
console.log("🚀 ===============================================");

async function handleRequest(request: Request): Promise<Response> {
  console.log("📥 [API] Request received:", request.method, request.url);
  
  try {
    const url = new URL(request.url);
    const path = url.pathname.replace(/^\/api/, "") || "/";
    
    console.log("🔄 [API] Forwarding to Hono:", path);
    
    const honoUrl = new URL(path + url.search, url.origin);
    const honoRequest = new Request(honoUrl, {
      method: request.method,
      headers: request.headers,
      body: request.method !== "GET" && request.method !== "HEAD" ? request.body : undefined,
      duplex: request.method !== "GET" && request.method !== "HEAD" ? "half" : undefined,
    } as RequestInit);

    const response = await app.fetch(honoRequest);
    console.log("✅ [API] Response:", response.status);
    return response;
  } catch (error: any) {
    console.error("❌ [API] Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
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
