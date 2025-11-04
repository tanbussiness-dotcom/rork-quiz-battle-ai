import { createTRPCReact } from "@trpc/react-query";
import { createTRPCClient, httpLink } from "@trpc/client";
import type { AppRouter } from "@/backend/trpc/app-router";
import superjson from "superjson";
import { Platform } from "react-native";
import Constants from "expo-constants";

export const trpc = createTRPCReact<AppRouter>();

function ensureTrpcPath(u: string): string {
  const base = u.replace(/\/$/, "");
  if (/\/trpc(\b|$)/.test(base)) return base;
  if (/\/api(\b|$)/.test(base)) return `${base}/trpc`;
  return `${base}/api/trpc`;
}

function resolveTrpcUrl(): string {
  const envPreferred = process.env.EXPO_PUBLIC_TRPC_SERVER_URL ?? "";
  const envFallback = process.env.EXPO_PUBLIC_RORK_API_BASE_URL ?? "";
  const rawEnv = (envPreferred || envFallback).trim();

  if (rawEnv) {
    const url = ensureTrpcPath(rawEnv);
    console.log("✅ [tRPC] Using configured URL:", url);
    return url;
  }

  if (Platform.OS === "web") {
    console.log("📍 [tRPC] Web resolved URL: /api/trpc (relative)");
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

let activeTrpcBase = resolveTrpcUrl();
console.log("🔗 [tRPC] Initial tRPC URL:", activeTrpcBase);

function getCandidateBases(): string[] {
  const list: string[] = [];
  const push = (u?: string | null) => {
    if (!u) return;
    const cleaned = ensureTrpcPath(u);
    if (!list.includes(cleaned)) list.push(cleaned);
  };

  push(process.env.EXPO_PUBLIC_TRPC_SERVER_URL ?? "");
  push(process.env.EXPO_PUBLIC_RORK_API_BASE_URL ?? "");

  if (Platform.OS === "web" && typeof window !== "undefined") {
    // Prefer relative same-origin first to avoid hosts returning HTML
    push("/api/trpc");
    push(`${window.location.origin}/api/trpc`);

    const hostname = window.location.hostname;
    if (hostname.includes('e2b.app') || hostname.includes('rorktest.dev')) {
      const port = '8081';
      const protocol = window.location.protocol;
      if (hostname.includes('e2b.app')) {
        const parts = hostname.split('-');
        const sessionId = parts[parts.length - 2];
        if (sessionId) {
          push(`${protocol}//${port}-${sessionId}.e2b.app/api/trpc`);
        }
      }
    }
  }

  const hostUri = (Constants as any)?.expoConfig?.hostUri
    || (Constants as any)?.manifest2?.extra?.expoClient?.hostUri
    || (Constants as any)?.manifest?.debuggerHost;
  if (typeof hostUri === "string" && hostUri.length > 0) {
    const host = hostUri.split("/")[0];
    push(`http://${host}/api/trpc`);
  }

  push("http://127.0.0.1:3000/api/trpc");
  push("http://localhost:3000/api/trpc");
  push("http://localhost:8081/api/trpc");

  const resolved = resolveTrpcUrl();
  const idx = list.indexOf(resolved);
  if (idx > 0) {
    list.splice(idx, 1);
    list.unshift(resolved);
  } else if (idx === -1) {
    list.unshift(resolved);
  }

  return list;
}

function buildUrlForBase(base: string, originalUrl: string): string {
  const normalizedBase = ensureTrpcPath(base);
  const i = originalUrl.indexOf("/trpc");
  const suffix = i >= 0 ? originalUrl.substring(i + "/trpc".length) : "";
  return `${normalizedBase}${suffix}`;
}

// React Query client for use in React components
export const trpcReactClient = trpc.createClient({
  links: [
    httpLink({
      url: activeTrpcBase,
      transformer: superjson,
      fetch: async (url, options) => {
        const urlStr: string = typeof url === "string" ? url : (url as any)?.toString?.() ?? String(url);
        const candidates = getCandidateBases();
        let lastErr: any = null;

        for (const base of candidates) {
          const target = buildUrlForBase(base, urlStr);
          console.log("🔍 [tRPC] Trying:", target);
          try {
            const res = await fetch(target, options);
            const ct = res.headers.get("content-type") ?? "";
            console.log("🔍 [tRPC] Status:", res.status, "CT:", ct, "for", base);

            if (!res.ok) {
              const bodyText = await res.text();
              console.error("❌ [tRPC] HTTP", res.status, bodyText.slice(0, 500));
              lastErr = new Error(`HTTP ${res.status}: ${bodyText.slice(0, 120)}`);
              continue;
            }

            if (!ct.includes("application/json")) {
              const bodyText = await res.text();
              console.error("❌ [tRPC] Expected JSON but got:", ct);
              console.error("❌ [tRPC] Body:", bodyText.slice(0, 500));
              lastErr = new Error(`Expected JSON but got ${ct || "unknown"}`);
              continue;
            }

            if (base !== activeTrpcBase) {
              console.warn("✅ [tRPC] Switched active base to:", base);
              activeTrpcBase = base;
            }

            return res;
          } catch (err: any) {
            lastErr = err;
            console.error("❌ [tRPC] Fetch error on", base, "=>", err?.message || err);
          }
        }

        console.error("🔗 [tRPC] Tried candidates:", getCandidateBases().join(","));
        console.error("💡 [tRPC] Tip: set EXPO_PUBLIC_TRPC_SERVER_URL to your backend base or full /api/trpc URL (prefer same-origin '/api/trpc' on web)");
        throw lastErr ?? new Error("tRPC fetch failed");
      },
    }),
  ],
});

// Vanilla tRPC client for use in services (non-React code)
export const trpcClient = createTRPCClient<AppRouter>({
  links: [
    httpLink({
      url: activeTrpcBase,
      transformer: superjson,
      fetch: async (url, options) => {
        const urlStr: string = typeof url === "string" ? url : (url as any)?.toString?.() ?? String(url);
        const candidates = getCandidateBases();
        let lastErr: any = null;

        for (const base of candidates) {
          const target = buildUrlForBase(base, urlStr);
          console.log("🔍 [tRPC Client] Trying:", target);
          try {
            const res = await fetch(target, options);
            const ct = res.headers.get("content-type") ?? "";
            console.log("🔍 [tRPC Client] Status:", res.status, "CT:", ct);

            if (!res.ok) {
              const bodyText = await res.text();
              console.error("❌ [tRPC Client] HTTP", res.status, bodyText.slice(0, 500));
              lastErr = new Error(`HTTP ${res.status}: ${bodyText.slice(0, 120)}`);
              continue;
            }

            if (!ct.includes("application/json")) {
              const bodyText = await res.text();
              console.error("❌ [tRPC Client] Expected JSON but got:", ct);
              console.error("❌ [tRPC Client] Body:", bodyText.slice(0, 500));
              lastErr = new Error(`Expected JSON but got ${ct || "unknown"}`);
              continue;
            }

            if (base !== activeTrpcBase) {
              console.warn("✅ [tRPC Client] Switched active base to:", base);
              activeTrpcBase = base;
            }

            return res;
          } catch (err: any) {
            lastErr = err;
            console.error("❌ [tRPC Client] Fetch error on", base, "=>", err?.message || err);
          }
        }

        console.error("🔗 [tRPC Client] Tried all candidates without success");
        console.error("💡 [tRPC Client] Tip: set EXPO_PUBLIC_TRPC_SERVER_URL to your backend base or full /api/trpc URL (prefer same-origin '/api/trpc' on web)");
        throw lastErr ?? new Error("tRPC fetch failed");
      },
    }),
  ],
});
