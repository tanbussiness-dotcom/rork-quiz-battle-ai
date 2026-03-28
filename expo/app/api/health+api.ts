export async function GET(request: Request) {
  console.log("🏥 [Health Check] GET /api/health");
  return Response.json({
    status: "ok",
    message: "API routes are working",
    timestamp: new Date().toISOString(),
    geminiConfigured: !!process.env.GEMINI_API_KEY,
    geminiKeyLength: process.env.GEMINI_API_KEY?.length || 0,
  }, { 
    status: 200,
    headers: {
      "Content-Type": "application/json"
    }
  });
}
