import app from "@/backend/hono";

console.log("🚀 [API Route] Loaded: app/api/[...slug]+api.ts");

async function handleApiRequest(request: Request): Promise<Response> {
  console.log("📥 [API] Request:", request.method, request.url);
  
  try {
    const url = new URL(request.url);
    console.log("📥 [API] Original path:", url.pathname);
    
    const apiPath = url.pathname.replace(/^\/api/, "") || "/";
    console.log("📥 [API] Forwarding to Hono with path:", apiPath);
    
    const honoUrl = new URL(apiPath + url.search, url.origin);
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
    console.error("❌ [API] Error:", error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
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
