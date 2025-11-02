import app from "@/backend/hono";

console.log("🚀 [API] Route handler initializing...");

async function handleRequest(request: Request, method: string) {
  try {
    console.log(`📥 [API] ${method} request:`, request.url);
    
    const url = new URL(request.url);
    const pathWithoutApi = url.pathname.replace(/^\/api/, "") || "/";
    
    console.log("🔄 [API] Original path:", url.pathname);
    console.log("🔄 [API] Path for Hono:", pathWithoutApi);
    
    const honoUrl = new URL(pathWithoutApi + url.search, url.origin);
    
    const honoRequest = new Request(honoUrl, {
      method: request.method,
      headers: request.headers,
      body: request.method !== "GET" && request.method !== "HEAD" ? request.body : undefined,
      duplex: request.method !== "GET" && request.method !== "HEAD" ? "half" : undefined,
    } as RequestInit);
    
    const response = await app.fetch(honoRequest);
    console.log("✅ [API] Response status:", response.status);
    
    return response;
  } catch (error: any) {
    console.error("❌ [API] Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export async function GET(request: Request) {
  return handleRequest(request, "GET");
}

export async function POST(request: Request) {
  return handleRequest(request, "POST");
}

export async function PUT(request: Request) {
  return handleRequest(request, "PUT");
}

export async function DELETE(request: Request) {
  return handleRequest(request, "DELETE");
}

export async function PATCH(request: Request) {
  return handleRequest(request, "PATCH");
}

export async function OPTIONS(request: Request) {
  return handleRequest(request, "OPTIONS");
}
