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
    console.log("✅ [tRPC] Web platform detected. Using Rork backend proxy.");
    if (typeof window !== "undefined") {
      const backendUrl = "/__api__";
      console.log("✅ [tRPC] Backend proxy URL:", backendUrl);
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
  fetch(`${baseUrl}/`)
    .then(res => res.json())
    .then(data => console.log("✅ [tRPC] Backend health check:", data))
    .catch(err => console.error("❌ [tRPC] Backend not reachable:", err.message));
}



export const trpcClient = trpc.createClient({
  links: [
    httpLink({
      url: trpcUrl,
      transformer: superjson,
      fetch: async (url, options) => {
        console.log("🔍 [tRPC] Fetching:", url);
        console.log("🔍 [tRPC] Options:", JSON.stringify(options, null, 2));
        try {
          const response = await fetch(url, options);
          console.log("🔍 [tRPC] Response status:", response.status);
          console.log("🔍 [tRPC] Response headers:", JSON.stringify([...response.headers.entries()]));
          
          if (!response.ok) {
            const text = await response.text();
            console.error("❌ [tRPC] Error response:", text.substring(0, 500));
            
            if (text.includes("<!DOCTYPE") || text.includes("<html")) {
              console.error("❌ [tRPC] Received HTML instead of JSON. This means the API route is not found.");
              console.error("❌ [tRPC] Make sure the development server is running and API routes are properly configured.");
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
        } catch (error) {
          console.error("❌ [tRPC] Fetch error:", error);
          throw error;
        }
      },
    }),
  ],
});
