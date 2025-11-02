import app from "./backend/hono";

const port = parseInt(process.env.PORT || "3000");

console.log("🚀 Starting Quiz Battle AI Backend Server...");
console.log("📦 Environment:", process.env.NODE_ENV || "development");
console.log("🔑 OpenAI API Key:", process.env.OPENAI_API_KEY ? "✅ Configured" : "❌ Missing");

if (typeof Bun !== "undefined") {
  Bun.serve({
    port,
    fetch: app.fetch,
  });
  
  console.log(`✅ Backend server running at: http://localhost:${port}`);
  console.log(`📡 tRPC endpoint: http://localhost:${port}/trpc`);
  console.log(`🏥 Health check: http://localhost:${port}/`);
  console.log("");
  console.log("Press Ctrl+C to stop the server");
} else {
  console.error("❌ This server requires Bun runtime. Please run with: bun server.ts");
  process.exit(1);
}
