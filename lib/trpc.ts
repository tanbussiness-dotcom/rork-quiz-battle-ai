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
    console.log("✅ [tRPC] Web platform detected. Using relative API path to avoid CORS issues.");
    return "";
  }

  if (envUrl) {
    console.log("✅ [tRPC] Using EXPO_PUBLIC_RORK_API_BASE_URL:", envUrl);
    return envUrl;
  }

  console.warn(
    "⚠️ [tRPC] No base URL configured for native. Please set EXPO_PUBLIC_RORK_API_BASE_URL in environment variables. Falling back to relative."
  );
  return "";
}

const baseUrl = getBaseUrl();
const trpcUrl = baseUrl ? `${baseUrl}/api/trpc` : "/api/trpc";

console.log("🔗 [tRPC] Final tRPC endpoint:", trpcUrl);

export const trpcClient = trpc.createClient({
  links: [
    httpLink({
      url: trpcUrl,
      transformer: superjson,
    }),
  ],
});
