import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from "react-native";
import { Stack, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AlertCircle } from "lucide-react-native";
import Colors from "@/constants/colors";
import GradientButton from "@/components/GradientButton";

export default function BackendErrorScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView 
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 40 }]}
        style={{ flex: 1 }}
      >
        <View style={styles.iconContainer}>
          <AlertCircle size={64} color={Colors.error} />
        </View>

        <Text style={styles.title}>Backend Not Available</Text>
        <Text style={styles.subtitle}>
          The backend server is not reachable. This is needed for AI-powered features.
        </Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What&apos;s Happening?</Text>
          <Text style={styles.text}>
            The app is trying to connect to the backend API, but it&apos;s not responding. 
            This usually happens because API routes don&apos;t work in Expo web development mode.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Fixes:</Text>
          
          <View style={styles.step}>
            <Text style={styles.stepNumber}>1</Text>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Set Backend URL</Text>
              <Text style={styles.stepText}>
                Update your env file:
              </Text>
              <Text style={styles.code}>EXPO_PUBLIC_RORK_API_BASE_URL=https://3000-xxxxx.e2b.app</Text>
              <Text style={styles.stepText}>
                Replace with your actual backend URL (usually port 3000)
              </Text>
            </View>
          </View>

          <View style={styles.step}>
            <Text style={styles.stepNumber}>2</Text>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Run Backend Server</Text>
              <Text style={styles.stepText}>
                Open a terminal and run:
              </Text>
              <Text style={styles.code}>bun server.ts</Text>
              <Text style={styles.stepText}>
                This starts the backend on port 3000
              </Text>
            </View>
          </View>

          <View style={styles.step}>
            <Text style={styles.stepNumber}>3</Text>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Check Diagnostics</Text>
              <Text style={styles.stepText}>
                Use the diagnostic tool to test backend connectivity
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.actions}>
          <GradientButton 
            title="Run Diagnostics"
            onPress={() => router.push("/debug-backend" as any)}
          />
          
          <TouchableOpacity 
            style={styles.secondaryButton}
            onPress={() => router.back()}
          >
            <Text style={styles.secondaryButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            For more information, check the console logs or refer to FIX_BACKEND_ERROR.md
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  iconContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "700" as const,
    color: Colors.text,
    textAlign: "center",
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 24,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: Colors.text,
    marginBottom: 12,
  },
  text: {
    fontSize: 15,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  step: {
    flexDirection: "row",
    marginBottom: 20,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  stepNumber: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: Colors.primary,
    marginRight: 16,
    width: 32,
    height: 32,
    textAlign: "center",
    lineHeight: 32,
    backgroundColor: "rgba(0, 230, 168, 0.1)",
    borderRadius: 16,
  },
  stepContent: {
    flex: 1,
    gap: 8,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.text,
  },
  stepText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  code: {
    fontFamily: Platform.select({ ios: "Menlo", android: "monospace", default: "monospace" }),
    fontSize: 13,
    color: Colors.primary,
    backgroundColor: Colors.surfaceLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  actions: {
    gap: 12,
    marginBottom: 24,
  },
  secondaryButton: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.text,
  },
  footer: {
    padding: 16,
    backgroundColor: Colors.surfaceLight,
    borderRadius: 12,
  },
  footerText: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 18,
  },
});
