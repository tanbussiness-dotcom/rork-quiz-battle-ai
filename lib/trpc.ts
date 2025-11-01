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
    console.log("✅ [tRPC] Web platform detected. Using window.location.origin for API path.");
    if (typeof window !== "undefined") {
      const origin = window.location.origin;
      console.log("✅ [tRPC] Window origin:", origin);
      return origin;
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
const trpcUrl = `${baseUrl}/api/trpc`;
console.log("🔗 [tRPC] Base URL:", baseUrl);
console.log("🔗 [tRPC] Full tRPC endpoint:", trpcUrl);



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
          
          if (!response.ok) {
            const text = await response.text();
            console.error("❌ [tRPC] Error response:", text.substring(0, 200));
            throw new Error(`HTTP ${response.status}: ${text.substring(0, 100)}`);
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
