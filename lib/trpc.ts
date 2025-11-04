import { createTRPCReact } from "@trpc/react-query";
import { httpLink } from "@trpc/client";
import type { AppRouter } from "@/backend/trpc/app-router";
import superjson from "superjson";
import { Platform } from "react-native";
import Constants from "expo-constants";

export const trpc = createTRPCReact<AppRouter>();

function getBaseUrl(): string {
  const envPreferred = process.env.EXPO_PUBLIC_TRPC_SERVER_URL ?? "";
  const envFallback = process.env.EXPO_PUBLIC_RORK_API_BASE_URL ?? "";
  const envUrl = envPreferred || envFallback;
  if (envUrl) {
    console.log("✅ [tRPC] Using configured API base URL:", envUrl);
    return envUrl.replace(/\/$/, "");
  }

  if (Platform.OS === "web") {
    if (typeof window !== "undefined" && window.location) {
      const origin = window.location.origin;
      console.log("📍 [tRPC] Using web origin:", origin);
      return origin;
    }
    console.warn("⚠️ [tRPC] Web without window.location, using relative '/api'");
    return "";
  }

  const hostUri = (Constants as any)?.expoConfig?.hostUri || (Constants as any)?.manifest2?.extra?.expoClient?.hostUri || (Constants as any)?.manifest?.debuggerHost;
  if (typeof hostUri === "string" && hostUri.length > 0) {
    const host = hostUri.split("/")[0];
    const hostname = host.split(":")[0];
    const url = `http://${hostname}`;
    console.warn("ℹ️ [tRPC] Derived base from Expo hostUri:", url);
    return url;
  }

  console.warn("⚠️ [tRPC] Native app without configured URL - defaulting to http://localhost:8081");
  return "http://localhost:8081";
}

const baseUrl = getBaseUrl();
const apiBase = baseUrl ? `${baseUrl}/api` : "/api";
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
          console.error("🔗 [tRPC] Endpoint was:", url);
          console.error("🔗 [tRPC] Base URL was:", trpcUrl);
          console.error("💡 [tRPC] Tip: set EXPO_PUBLIC_TRPC_SERVER_URL to your backend base (e.g. https://your-tunnel.ngrok.io)");
          throw err;
        }
      },
    }),
  ],
});
