import { createTRPCReact } from "@trpc/react-query";
import { httpLink } from "@trpc/client";
import type { AppRouter } from "@/backend/trpc/app-router";
import superjson from "superjson";
import { Platform } from "react-native";
import Constants from "expo-constants";

export const trpc = createTRPCReact<AppRouter>();

function resolveTrpcUrl(): string {
  const envPreferred = process.env.EXPO_PUBLIC_TRPC_SERVER_URL ?? "";
  const envFallback = process.env.EXPO_PUBLIC_RORK_API_BASE_URL ?? "";
  const rawEnv = (envPreferred || envFallback).trim();

  if (rawEnv) {
    const cleaned = rawEnv.replace(/\/$/, "");
    const isFullTrpc = /\/trpc(\b|$)/.test(cleaned);
    const url = isFullTrpc
      ? cleaned
      : /\/api(\b|$)/.test(cleaned)
        ? `${cleaned}/trpc`
        : `${cleaned}/api/trpc`;
    console.log("✅ [tRPC] Using configured URL:", url);
    return url;
  }

  if (Platform.OS === "web") {
    if (typeof window !== "undefined" && window.location) {
      const url = `${window.location.origin}/api/trpc`;
      console.log("📍 [tRPC] Web resolved URL:", url);
      return url;
    }
    console.warn("⚠️ [tRPC] Web without window.location, using relative '/api/trpc'");
    return "/api/trpc";
  }

  const hostUri = (Constants as any)?.expoConfig?.hostUri
    || (Constants as any)?.manifest2?.extra?.expoClient?.hostUri
    || (Constants as any)?.manifest?.debuggerHost;
  if (typeof hostUri === "string" && hostUri.length > 0) {
    const host = hostUri.split("/")[0]; // e.g. 192.168.1.10:8081
    const url = `http://${host}/api/trpc`;
    console.warn("ℹ️ [tRPC] Derived URL from Expo hostUri:", url);
    return url;
  }

  console.warn("⚠️ [tRPC] Native without configured URL - defaulting to http://localhost:8081/api/trpc");
  return "http://localhost:8081/api/trpc";
}

const trpcUrl = resolveTrpcUrl();
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
          console.error("🔗 [tRPC] Endpoint was:", url);
          console.error("🔗 [tRPC] Configured tRPC URL:", trpcUrl);
          console.error("💡 [tRPC] Tip: set EXPO_PUBLIC_TRPC_SERVER_URL to your backend base or full /api/trpc URL");
          throw err;
        }
      },
    }),
  ],
});
