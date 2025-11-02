import { createTRPCReact } from "@trpc/react-query";
import { httpLink } from "@trpc/client";
import type { AppRouter } from "@/backend/trpc/app-router";
import superjson from "superjson";
import { Platform } from "react-native";

export const trpc = createTRPCReact<AppRouter>();

function getBaseUrl(): string {
  const envUrl = process.env.EXPO_PUBLIC_RORK_API_BASE_URL ?? "";

  console.log("🔍 [tRPC] Initializing client...");
  console.log("🔍 [tRPC] Platform:", Platform.OS);
  console.log("🔍 [tRPC] EXPO_PUBLIC_RORK_API_BASE_URL:", envUrl || "(not set)");

  if (Platform.OS === "web") {
    console.log("✅ [tRPC] Web platform detected.");
    if (typeof window !== "undefined") {
      if (envUrl) {
        console.log("✅ [tRPC] Using EXPO_PUBLIC_RORK_API_BASE_URL for web:", envUrl);
        return envUrl;
      }
      
      const origin = window.location.origin;
      const backendUrl = `${origin}/api`;
      console.log("✅ [tRPC] Using window.location.origin for API:", backendUrl);
      return backendUrl;
    }
    return "";
  }

  if (envUrl) {
    console.log("✅ [tRPC] Using EXPO_PUBLIC_RORK_API_BASE_URL:", envUrl);
    return envUrl;
  }

  console.warn(
    "⚠️ [tRPC] No base URL configured for native. Please set EXPO_PUBLIC_RORK_API_BASE_URL in environment variables."
  );
  return "";
}

const baseUrl = getBaseUrl();
const trpcUrl = `${baseUrl}/trpc`;
console.log("🔗 [tRPC] Base URL:", baseUrl);
console.log("🔗 [tRPC] Full tRPC endpoint:", trpcUrl);

if (typeof window !== "undefined" && Platform.OS === "web") {
  console.log("🔗 [tRPC] Testing backend availability...");
  console.log("🔗 [tRPC] Test URL:", `${baseUrl}/`);
  
  fetch(`${baseUrl}/`)
    .then(async res => {
      if (!res.ok) {
        console.error("❌ [tRPC] Backend returned error status:", res.status);
        const text = await res.text();
        console.error("❌ [tRPC] Response:", text.substring(0, 200));
        return;
      }
      const data = await res.json();
      console.log("✅ [tRPC] Backend health check SUCCESS:", data);
    })
    .catch(err => {
      console.error("❌ [tRPC] Backend not reachable:", err.message);
      console.error("🚨 [tRPC] This means API routes are not working in web dev mode.");
      console.error("🚨 [tRPC] Solutions:");
      console.error("   1. Run backend server with: bun server.ts");
      console.error("   2. Set EXPO_PUBLIC_RORK_API_BASE_URL in your env file");
      console.error("   3. Or navigate to /debug-backend to run diagnostics");
    });
}



export const trpcClient = trpc.createClient({
  links: [
    httpLink({
      url: trpcUrl,
      transformer: superjson,
      fetch: async (url, options) => {
        console.log("🔍 [tRPC] Fetching:", url);
        try {
          const response = await fetch(url, options);
          console.log("🔍 [tRPC] Response status:", response.status);
          console.log("🔍 [tRPC] Response content-type:", response.headers.get("content-type"));
          
          if (!response.ok) {
            const text = await response.text();
            console.error("❌ [tRPC] Error response:", text.substring(0, 500));
            
            if (text.includes("<!DOCTYPE") || text.includes("<html")) {
              console.error("❌ [tRPC] Received HTML instead of JSON.");
              console.error("❌ [tRPC] This usually means:");
              console.error("   1. API routes are not working in Expo web dev mode");
              console.error("   2. OR the backend server is not running");
              console.error("❌ [tRPC] Solution: Set EXPO_PUBLIC_RORK_API_BASE_URL in your env file");
              console.error("❌ [tRPC] Expected URL:", trpcUrl);
            }
            
            throw new Error(`HTTP ${response.status}: ${text.substring(0, 100)}`);
          }
          
          const contentType = response.headers.get("content-type");
          if (contentType && !contentType.includes("application/json")) {
            const text = await response.text();
            console.error("❌ [tRPC] Expected JSON but got:", contentType);
            console.error("❌ [tRPC] Response body:", text.substring(0, 500));
            throw new Error(`Expected JSON but got ${contentType}`);
          }
          
          return response;
        } catch (error: any) {
          if (error.message === "Failed to fetch") {
            console.error("❌ [tRPC] Network error - Failed to fetch");
            console.error("❌ [tRPC] This usually means:");
            console.error("   1. API routes don't work in Expo web dev mode");
            console.error("   2. The backend server is not accessible");
            console.error("   3. CORS issues");
            console.error("❌ [tRPC] Try checking:");
            console.error("   - Is your backend server running?");
            console.error("   - Is EXPO_PUBLIC_RORK_API_BASE_URL set correctly?");
            console.error("   - Check browser console for more details");
          }
          console.error("❌ [tRPC] Fetch error:", error);
          throw error;
        }
      },
    }),
  ],
});
