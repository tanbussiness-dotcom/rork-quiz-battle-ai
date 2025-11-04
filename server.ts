import app from "./backend/hono";
import { readFileSync } from "fs";
import { resolve } from "path";

if (!process.env.GEMINI_API_KEY) {
  try {
    const envPath = resolve(process.cwd(), "env");
    const envContent = readFileSync(envPath, "utf-8");
    const lines = envContent.split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith("#")) {
        const [key, ...valueParts] = trimmed.split("=");
        if (key && valueParts.length > 0) {
          const value = valueParts.join("=").trim();
          process.env[key.trim()] = value;
        }
      }
    }
    console.log("✅ Manually loaded environment variables from 'env' file");
  } catch (e) {
    console.error("⚠️  Could not load env file:", e);
  }
}

const port = parseInt(process.env.PORT || "3000");

console.log("🚀 Starting Quiz Battle AI Backend Server...");
console.log("📦 Environment:", process.env.NODE_ENV || "development");
console.log("🔑 Gemini API Key:", process.env.GEMINI_API_KEY ? `✅ Configured (${process.env.GEMINI_API_KEY.substring(0, 10)}...)` : "❌ Missing");

const maybeBun: any = (globalThis as any).Bun;
if (typeof maybeBun !== "undefined" && maybeBun && typeof maybeBun.serve === "function") {
  maybeBun.serve({
    port,
    fetch: app.fetch,
  });
  
  console.log(`✅ Backend server running at: http://localhost:${port}`);
  console.log(`📡 tRPC endpoint: http://localhost:${port}/trpc`);
  console.log(`🏥 Health check: http://localhost:${port}/`);
  console.log("");
  console.log("Press Ctrl+C to stop the server");
} else {
  console.warn("��️ Bun runtime not detected. This file is optional when using Expo Router API routes.");
  console.warn("ℹ️ Your backend is served from app/api under the Expo dev server. No action needed.");
}
