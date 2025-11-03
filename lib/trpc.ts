import { createTRPCReact } from "@trpc/react-query";
import { httpLink } from "@trpc/client";
import type { AppRouter } from "@/backend/trpc/app-router";
import superjson from "superjson";
import { Platform } from "react-native";

export const trpc = createTRPCReact<AppRouter>();

function getBaseUrl(): string {
  const envUrl = process.env.EXPO_PUBLIC_RORK_API_BASE_URL ?? "";
  if (envUrl) return envUrl;
  if (Platform.OS === "web") {
    console.warn("⚠️ Missing API base URL — fallback to '/api'");
    return "";
  }
  return "http://localhost:3000";
}

const baseUrl = getBaseUrl();
const apiBase = baseUrl || "/api";
const trpcUrl = `${apiBase}/trpc`;

console.log("🔗 [tRPC] Using base:", apiBase);
console.log("🔗 [tRPC] tRPC endpoint:", trpcUrl);

export const trpcClient = trpc.createClient({
  links: [
    httpLink({
      url: trpcUrl,
      transformer: superjson,
      fetch: async (url, options) => {
        console.log("🔍 [tRPC] Fetch:", url);
        try {
          const res = await fetch(url, options);
          const ct = res.headers.get("content-type") ?? "";
          console.log("🔍 [tRPC] Status:", res.status, "CT:", ct);

          if (!res.ok) {
            const bodyText = await res.text();
            console.error("❌ [tRPC] HTTP", res.status, bodyText.slice(0, 500));
            throw new Error(`HTTP ${res.status}: ${bodyText.slice(0, 120)}`);
          }

          if (!ct.includes("application/json")) {
            const bodyText = await res.text();
            console.error("❌ [tRPC] Expected JSON but got:", ct);
            console.error("❌ [tRPC] Body:", bodyText.slice(0, 500));
            throw new Error(`Expected JSON but got ${ct || "unknown"}`);
          }

          return res;
        } catch (err: any) {
          console.error("❌ [tRPC] Fetch error:", err?.message || err);
          throw err;
        }
      },
    }),
  ],
});
