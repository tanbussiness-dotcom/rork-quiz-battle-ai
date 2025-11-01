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
    
    const response = await app.fetch(request);
    console.log(`✅ [API Route] Response status:`, response.status);
    return response;
  } catch (error: any) {
    console.error(`❌ [API Route] Error handling ${method} request:`, error);
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
