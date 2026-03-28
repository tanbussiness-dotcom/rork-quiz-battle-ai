import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from "react-native";
import { Stack, useRouter } from "expo-router";
import { ArrowLeft, CheckCircle, XCircle, Loader } from "lucide-react-native";
import Colors from "@/constants/colors";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type TestResult = {
  name: string;
  status: "pending" | "running" | "success" | "error";
  message?: string;
  details?: string;
};

export default function TestBackendConnection() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [tests, setTests] = useState<TestResult[]>([
    { name: "Backend Health Check", status: "pending" },
    { name: "tRPC Endpoint", status: "pending" },
    { name: "Gemini Configuration", status: "pending" },
    { name: "Question Generation", status: "pending" },
  ]);

  const updateTest = (index: number, update: Partial<TestResult>) => {
    setTests(prev => prev.map((t, i) => i === index ? { ...t, ...update } : t));
  };

  const runTests = async () => {
    const baseUrl = Platform.OS === "web" && typeof window !== "undefined"
      ? window.location.origin
      : process.env.EXPO_PUBLIC_RORK_API_BASE_URL || "http://localhost:3000";

    updateTest(0, { status: "running" });
    try {
      const response = await fetch(`${baseUrl}/api/`, {
        headers: { "Accept": "application/json" }
      });
      const data = await response.json();
      
      if (data.status === "ok") {
        updateTest(0, { 
          status: "success", 
          message: "Backend is reachable",
          details: `Endpoint: ${baseUrl}/api/`
        });
      } else {
        updateTest(0, { 
          status: "error", 
          message: "Backend responded but status not OK",
          details: JSON.stringify(data)
        });
      }
    } catch (error: any) {
      updateTest(0, { 
        status: "error", 
        message: "Cannot connect to backend",
        details: error.message
      });
      return;
    }

    updateTest(1, { status: "running" });
    try {
      const response = await fetch(`${baseUrl}/api/trpc/example.hi`, {
        method: "GET",
        headers: { "Accept": "application/json" }
      });
      
      if (response.ok) {
        updateTest(1, { 
          status: "success", 
          message: "tRPC endpoint is working",
          details: `Endpoint: ${baseUrl}/api/trpc`
        });
      } else {
        const text = await response.text();
        updateTest(1, { 
          status: "error", 
          message: `HTTP ${response.status}`,
          details: text.slice(0, 200)
        });
      }
    } catch (error: any) {
      updateTest(1, { 
        status: "error", 
        message: "tRPC endpoint not reachable",
        details: error.message
      });
    }

    updateTest(2, { status: "running" });
    try {
      const response = await fetch(`${baseUrl}/api/test-gemini`, {
        headers: { "Accept": "application/json" }
      });
      const data = await response.json();
      
      if (data.ok) {
        updateTest(2, { 
          status: "success", 
          message: "Gemini API is configured and working",
          details: data.response || "API key verified"
        });
      } else {
        updateTest(2, { 
          status: "error", 
          message: "Gemini API not configured",
          details: data.error || "Unknown error"
        });
      }
    } catch (error: any) {
      updateTest(2, { 
        status: "error", 
        message: "Cannot test Gemini configuration",
        details: error.message
      });
    }

    updateTest(3, { status: "running" });
    try {
      const { trpcClient } = await import("@/lib/trpc");
      const result = await trpcClient.questions.generate.mutate({
        topic: "Test",
        difficulty: "easy",
        language: "en"
      });
      
      if (result && result.id) {
        updateTest(3, { 
          status: "success", 
          message: "Question generation is working!",
          details: `Generated question ID: ${result.id}`
        });
      } else {
        updateTest(3, { 
          status: "error", 
          message: "Question generation returned invalid data",
          details: JSON.stringify(result)
        });
      }
    } catch (error: any) {
      updateTest(3, { 
        status: "error", 
        message: "Question generation failed",
        details: error.message
      });
    }
  };

  const resetTests = () => {
    setTests([
      { name: "Backend Health Check", status: "pending" },
      { name: "tRPC Endpoint", status: "pending" },
      { name: "Gemini Configuration", status: "pending" },
      { name: "Question Generation", status: "pending" },
    ]);
  };

  const allTestsComplete = tests.every(t => t.status === "success" || t.status === "error");
  const allTestsPass = tests.every(t => t.status === "success");

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.content, { paddingTop: insets.top + 20 }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color={Colors.text} />
        </TouchableOpacity>

        <Text style={styles.title}>Backend Connection Test</Text>
        <Text style={styles.subtitle}>
          Test if your backend is configured correctly
        </Text>

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {tests.map((test, index) => (
            <View key={index} style={styles.testCard}>
              <View style={styles.testHeader}>
                <View style={styles.testIconWrapper}>
                  {test.status === "pending" && (
                    <View style={styles.pendingDot} />
                  )}
                  {test.status === "running" && (
                    <Loader size={20} color={Colors.primary} />
                  )}
                  {test.status === "success" && (
                    <CheckCircle size={20} color={Colors.success} />
                  )}
                  {test.status === "error" && (
                    <XCircle size={20} color={Colors.error} />
                  )}
                </View>
                <Text style={styles.testName}>{test.name}</Text>
              </View>
              
              {test.message && (
                <Text style={[
                  styles.testMessage,
                  test.status === "success" && styles.testMessageSuccess,
                  test.status === "error" && styles.testMessageError,
                ]}>
                  {test.message}
                </Text>
              )}
              
              {test.details && (
                <Text style={styles.testDetails}>{test.details}</Text>
              )}
            </View>
          ))}
        </ScrollView>

        <View style={styles.actions}>
          {allTestsComplete && allTestsPass && (
            <View style={styles.successBanner}>
              <CheckCircle size={24} color={Colors.success} />
              <Text style={styles.successText}>
                ✅ All tests passed! Your backend is working correctly.
              </Text>
            </View>
          )}
          
          {allTestsComplete && !allTestsPass && (
            <View style={styles.errorBanner}>
              <XCircle size={24} color={Colors.error} />
              <Text style={styles.errorText}>
                ❌ Some tests failed. Check the details above.
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={styles.runButton}
            onPress={allTestsComplete ? resetTests : runTests}
          >
            <Text style={styles.runButtonText}>
              {allTestsComplete ? "Run Tests Again" : "Run Tests"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  backButton: {
    marginBottom: 20,
    width: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: "800" as const,
    color: Colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 6,
    marginBottom: 20,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    gap: 12,
  },
  testCard: {
    backgroundColor: Colors.surfaceLight,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  testHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  testIconWrapper: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  pendingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.textSecondary,
  },
  testName: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.text,
    flex: 1,
  },
  testMessage: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 8,
  },
  testMessageSuccess: {
    color: Colors.success,
  },
  testMessageError: {
    color: Colors.error,
  },
  testDetails: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  actions: {
    gap: 16,
    marginTop: 20,
  },
  successBanner: {
    flexDirection: "row",
    gap: 12,
    padding: 16,
    backgroundColor: "rgba(0, 230, 168, 0.1)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.success,
  },
  successText: {
    flex: 1,
    fontSize: 14,
    color: Colors.success,
    fontWeight: "600" as const,
  },
  errorBanner: {
    flexDirection: "row",
    gap: 12,
    padding: 16,
    backgroundColor: "rgba(255, 71, 87, 0.1)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.error,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    color: Colors.error,
    fontWeight: "600" as const,
  },
  runButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  runButtonText: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: Colors.text,
  },
});
