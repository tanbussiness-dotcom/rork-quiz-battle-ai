import app from "@/backend/hono";

console.log("🚀 [API Route] Initializing API route handler...");
console.log("🔑 [API Route] OPENAI_API_KEY exists:", !!process.env.OPENAI_API_KEY);
console.log("🔑 [API Route] OPENAI_API_KEY length:", process.env.OPENAI_API_KEY?.length || 0);

async function handleRequest(request: Request, method: string) {
  try {
    console.log(`🔍 [API Route] ${method} request:`, request.url);
    const url = new URL(request.url);
    console.log(`🔍 [API Route] Path:`, url.pathname);
    console.log(`🔍 [API Route] Search:`, url.search);
    console.log(`🔍 [API Route] Method:`, request.method);
    console.log(`🔍 [API Route] Headers:`, JSON.stringify([...request.headers.entries()]));
    
    const pathWithoutApi = url.pathname.replace(/^\/api/, "");
    console.log(`🔍 [API Route] Path without /api prefix:`, pathWithoutApi);
    
    const honoUrl = new URL(pathWithoutApi + url.search, url.origin);
    console.log(`🔍 [API Route] Hono URL:`, honoUrl.toString());
    
    const honoRequest = new Request(honoUrl, {
      method: request.method,
      headers: request.headers,
      body: request.body,
    });
    
    const response = await app.fetch(honoRequest);
    console.log(`✅ [API Route] Response status:`, response.status);
    console.log(`✅ [API Route] Response headers:`, JSON.stringify([...response.headers.entries()]));
    
    const contentType = response.headers.get("content-type");
    console.log(`✅ [API Route] Response content-type:`, contentType);
    
    return response;
  } catch (error: any) {
    console.error(`❌ [API Route] Error handling ${method} request:`, error);
    console.error(`❌ [API Route] Error stack:`, error.stack);
    return new Response(
      JSON.stringify({ 
        error: "Internal server error", 
        message: error.message,
        stack: error.stack 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
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
