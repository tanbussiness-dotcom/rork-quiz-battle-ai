import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { UserProfileProvider } from "@/contexts/UserProfileContext";
import { trpc, trpcClient } from "@/lib/trpc";
import { I18nProvider } from "@/contexts/I18nContext";
import SyncManager from "@/components/SyncManager";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === "(tabs)";

    async function decideRoute() {
      if (!user && inAuthGroup) {
        router.replace("/welcome");
        return;
      }
      if (user && !inAuthGroup) {
        try {
          const { getUserProfile } = await import("@/services/user.service");
          const profile = await getUserProfile(user.uid);
          if (profile?.onboardingComplete) {
            router.replace("/home");
          } else {
            router.replace("/profile-setup");
          }
        } catch (e) {
          router.replace("/home");
        }
      }
    }

    void decideRoute();
  }, [user, loading, segments]);

  return (
    <Stack screenOptions={{ headerShown: false, animation: "slide_from_right" }}>
      <Stack.Screen name="welcome" />
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="profile-setup" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <AuthProvider>
            <I18nProvider>
              <UserProfileProvider>
                <SyncManager />
                <RootLayoutNav />
              </UserProfileProvider>
            </I18nProvider>
          </AuthProvider>
        </GestureHandlerRootView>
      </QueryClientProvider>
    </trpc.Provider>
  );
}
