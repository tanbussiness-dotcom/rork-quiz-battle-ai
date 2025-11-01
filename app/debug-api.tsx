import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { Stack } from "expo-router";

import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function DebugAPIScreen() {
  const insets = useSafeAreaInsets();
  const [testResult, setTestResult] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const testDirectFetch = async () => {
    setLoading(true);
    setTestResult("Testing direct fetch...\n");
    
    try {
      const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
      const testUrl = `${baseUrl}/api`;
      
      setTestResult(prev => prev + `\nFetching: ${testUrl}\n`);
      
      const response = await fetch(testUrl);
      const status = response.status;
      const contentType = response.headers.get("content-type");
      
      setTestResult(prev => prev + `\nStatus: ${status}\n`);
      setTestResult(prev => prev + `Content-Type: ${contentType}\n`);
      
      const text = await response.text();
      setTestResult(prev => prev + `\nResponse:\n${text.substring(0, 500)}\n`);
      
      if (contentType?.includes("application/json")) {
        const json = JSON.parse(text);
        setTestResult(prev => prev + `\nParsed JSON:\n${JSON.stringify(json, null, 2)}\n`);
      }
    } catch (error: any) {
      setTestResult(prev => prev + `\n❌ Error: ${error.message}\n${error.stack}\n`);
    } finally {
      setLoading(false);
    }
  };

  const testTRPC = async () => {
    setLoading(true);
    setTestResult("Testing tRPC...\n");
    
    try {
      const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
      const trpcUrl = `${baseUrl}/api/trpc/example.hi`;
      
      setTestResult(prev => prev + `\nFetching: ${trpcUrl}\n`);
      
      const response = await fetch(trpcUrl, {
        method: "GET",
      });
      
      const status = response.status;
      const contentType = response.headers.get("content-type");
      
      setTestResult(prev => prev + `\nStatus: ${status}\n`);
      setTestResult(prev => prev + `Content-Type: ${contentType}\n`);
      
      const text = await response.text();
      setTestResult(prev => prev + `\nResponse:\n${text}\n`);
    } catch (error: any) {
      setTestResult(prev => prev + `\n❌ Error: ${error.message}\n`);
    } finally {
      setLoading(false);
    }
  };

  const testTRPCClient = async () => {
    setLoading(true);
    setTestResult("Testing tRPC questions.generate endpoint...\n");
    
    try {
      const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
      const trpcUrl = `${baseUrl}/api/trpc/questions.generate`;
      
      setTestResult(prev => prev + `\nPOST to: ${trpcUrl}\n`);
      
      const body = JSON.stringify({
        topic: "Test",
        difficulty: "easy",
        language: "en"
      });
      
      setTestResult(prev => prev + `Body: ${body}\n`);
      
      const response = await fetch(trpcUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body,
      });
      
      const status = response.status;
      const contentType = response.headers.get("content-type");
      
      setTestResult(prev => prev + `\nStatus: ${status}\n`);
      setTestResult(prev => prev + `Content-Type: ${contentType}\n`);
      
      const text = await response.text();
      setTestResult(prev => prev + `\nResponse:\n${text.substring(0, 1000)}\n`);
      
      if (contentType?.includes("application/json")) {
        const json = JSON.parse(text);
        setTestResult(prev => prev + `\nParsed JSON:\n${JSON.stringify(json, null, 2)}\n`);
      }
    } catch (error: any) {
      setTestResult(prev => prev + `\n❌ Error: ${error.message}\n${error.stack}\n`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <Stack.Screen options={{ title: "API Debug" }} />
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.button, loading && styles.buttonDisabled]} 
          onPress={testDirectFetch}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Test Direct Fetch</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, loading && styles.buttonDisabled]} 
          onPress={testTRPC}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Test tRPC Endpoint</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, loading && styles.buttonDisabled]} 
          onPress={testTRPCClient}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Test Generate Question</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.resultContainer}>
        <Text style={styles.resultText}>{testResult || "Click a button to test the API"}</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    padding: 16,
  },
  buttonContainer: {
    gap: 12,
    marginBottom: 16,
  },
  button: {
    backgroundColor: "#007AFF",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
  resultContainer: {
    flex: 1,
    backgroundColor: "#1C1C1E",
    borderRadius: 8,
    padding: 12,
  },
  resultText: {
    color: "#FFF",
    fontFamily: "monospace",
    fontSize: 12,
  },
});
