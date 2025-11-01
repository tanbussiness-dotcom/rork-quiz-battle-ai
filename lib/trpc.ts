import { createTRPCReact } from "@trpc/react-query";
import { httpLink } from "@trpc/client";
import type { AppRouter } from "@/backend/trpc/app-router";
import superjson from "superjson";
import { Platform } from "react-native";

export const trpc = createTRPCReact<AppRouter>();

function getBaseUrl(): string {
  const envUrl = process.env.EXPO_PUBLIC_RORK_API_BASE_URL ?? "";
  if (envUrl) {
    console.log("[tRPC] Using EXPO_PUBLIC_RORK_API_BASE_URL:", envUrl);
    return envUrl;
  }

  if (Platform.OS === "web") {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    if (origin) {
      console.log("[tRPC] Using window.origin fallback:", origin);
      return origin;
    }
  }

  console.log(
    "[tRPC] No base URL env found. Please set EXPO_PUBLIC_RORK_API_BASE_URL for native."
  );
  return "";
}

const baseUrl = getBaseUrl();

export const trpcClient = trpc.createClient({
  links: [
    httpLink({
      url: baseUrl ? `${baseUrl}/api/trpc` : "/api/trpc",
      transformer: superjson,
    }),
  ],
});
