import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { Stack } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";

export default function DebugBackendScreen() {
  const insets = useSafeAreaInsets();
  const [testResults, setTestResults] = useState<any[]>([]);

  const testEndpoint = async (url: string, label: string) => {
    const startTime = Date.now();
    try {
      console.log(`🧪 Testing ${label}: ${url}`);
      const response = await fetch(url);
      const duration = Date.now() - startTime;
      
      const contentType = response.headers.get("content-type");
      let body: any;
      
      if (contentType?.includes("application/json")) {
        body = await response.json();
      } else {
        body = await response.text();
      }

      setTestResults(prev => [...prev, {
        label,
        url,
        status: response.status,
        ok: response.ok,
        contentType,
        body,
        duration,
        error: null
      }]);
    } catch (error: any) {
      const duration = Date.now() - startTime;
      console.error(`❌ Error testing ${label}:`, error);
      setTestResults(prev => [...prev, {
        label,
        url,
        status: null,
        ok: false,
        contentType: null,
        body: null,
        duration,
        error: error.message
      }]);
    }
  };

  const runTests = async () => {
    setTestResults([]);
    
    await testEndpoint("/api", "Local API Root");
    await testEndpoint("/api/test", "Local API Test");
    await testEndpoint("/api/trpc", "Local tRPC Endpoint");
    
    const currentHost = typeof window !== "undefined" ? window.location.origin : "";
    if (currentHost) {
      await testEndpoint(`${currentHost}/api`, "Full URL API Root");
      await testEndpoint(`${currentHost}/api/test`, "Full URL API Test");
    }
    
    const port3000 = currentHost.replace(":8081", ":3000");
    if (port3000 !== currentHost) {
      await testEndpoint(`${port3000}/api`, "Port 3000 API Root");
      await testEndpoint(`${port3000}/trpc`, "Port 3000 tRPC");
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: "Backend Diagnostics" }} />
      <View style={[styles.content, { paddingTop: insets.top || 20 }]}>
        <Text style={styles.title}>Backend Connection Diagnostics</Text>
        
        <TouchableOpacity style={styles.button} onPress={runTests}>
          <Text style={styles.buttonText}>Run Tests</Text>
        </TouchableOpacity>

        <ScrollView style={styles.results}>
          {testResults.map((result, index) => (
            <View key={index} style={[styles.resultCard, result.ok ? styles.success : styles.error]}>
              <Text style={styles.resultLabel}>{result.label}</Text>
              <Text style={styles.resultUrl}>{result.url}</Text>
              <Text style={styles.resultStatus}>
                Status: {result.status || "FAILED"} ({result.duration}ms)
              </Text>
              {result.contentType && (
                <Text style={styles.resultContent}>Type: {result.contentType}</Text>
              )}
              {result.error && (
                <Text style={styles.resultError}>Error: {result.error}</Text>
              )}
              {result.body && typeof result.body === "string" && (
                <Text style={styles.resultBody}>
                  Body: {result.body.substring(0, 200)}...
                </Text>
              )}
              {result.body && typeof result.body === "object" && (
                <Text style={styles.resultBody}>
                  Body: {JSON.stringify(result.body, null, 2)}
                </Text>
              )}
            </View>
          ))}
        </ScrollView>
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
  title: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: Colors.text,
    marginBottom: 20,
  },
  button: {
    backgroundColor: Colors.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 20,
  },
  buttonText: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: "600" as const,
  },
  results: {
    flex: 1,
  },
  resultCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
  },
  success: {
    backgroundColor: "rgba(0, 230, 168, 0.1)",
    borderColor: Colors.success,
  },
  error: {
    backgroundColor: "rgba(255, 71, 87, 0.1)",
    borderColor: Colors.error,
  },
  resultLabel: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: Colors.text,
    marginBottom: 4,
  },
  resultUrl: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  resultStatus: {
    fontSize: 14,
    color: Colors.text,
    marginBottom: 4,
  },
  resultContent: {
    fontSize: 14,
    color: Colors.text,
    marginBottom: 4,
  },
  resultError: {
    fontSize: 14,
    color: Colors.error,
    marginBottom: 4,
  },
  resultBody: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 8,
  },
});
