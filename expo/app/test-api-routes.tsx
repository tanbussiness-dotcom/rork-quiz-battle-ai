import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { Stack } from "expo-router";

export default function TestAPIRoutes() {
  const [results, setResults] = useState<string[]>([]);

  const addResult = (msg: string) => {
    setResults((prev) => [...prev, `${new Date().toLocaleTimeString()}: ${msg}`]);
  };

  const testBasicAPI = async () => {
    addResult("Testing /api/test...");
    try {
      const response = await fetch("/api/test", { method: "GET" });
      const text = await response.text();
      addResult(`✅ /api/test status: ${response.status}`);
      addResult(`Content-Type: ${response.headers.get("content-type")}`);
      addResult(`Body: ${text.slice(0, 200)}`);
    } catch (err: any) {
      addResult(`❌ /api/test error: ${err.message}`);
    }
  };

  const testBackendRoot = async () => {
    addResult("Testing /api/ (backend root)...");
    try {
      const response = await fetch("/api/", { method: "GET" });
      const text = await response.text();
      addResult(`✅ /api/ status: ${response.status}`);
      addResult(`Content-Type: ${response.headers.get("content-type")}`);
      addResult(`Body: ${text.slice(0, 200)}`);
    } catch (err: any) {
      addResult(`❌ /api/ error: ${err.message}`);
    }
  };

  const testTrpcEndpoint = async () => {
    addResult("Testing /api/trpc/example.hi...");
    try {
      const response = await fetch("/api/trpc/example.hi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const text = await response.text();
      addResult(`✅ /api/trpc/example.hi status: ${response.status}`);
      addResult(`Content-Type: ${response.headers.get("content-type")}`);
      addResult(`Body: ${text.slice(0, 300)}`);
    } catch (err: any) {
      addResult(`❌ /api/trpc/example.hi error: ${err.message}`);
    }
  };

  const testQuestionGenerate = async () => {
    addResult("Testing /api/trpc/questions.generate...");
    try {
      const response = await fetch("/api/trpc/questions.generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: "Science",
          difficulty: "easy",
          language: "en",
        }),
      });
      const text = await response.text();
      addResult(`✅ /api/trpc/questions.generate status: ${response.status}`);
      addResult(`Content-Type: ${response.headers.get("content-type")}`);
      addResult(`Body: ${text.slice(0, 300)}`);
    } catch (err: any) {
      addResult(`❌ /api/trpc/questions.generate error: ${err.message}`);
    }
  };

  const clearResults = () => setResults([]);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: "Test API Routes", headerShown: true }} />
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={testBasicAPI}>
          <Text style={styles.buttonText}>Test /api/test</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.button} onPress={testBackendRoot}>
          <Text style={styles.buttonText}>Test /api/ (root)</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.button} onPress={testTrpcEndpoint}>
          <Text style={styles.buttonText}>Test tRPC example</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.button} onPress={testQuestionGenerate}>
          <Text style={styles.buttonText}>Test questions.generate</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.button, styles.clearButton]} onPress={clearResults}>
          <Text style={styles.buttonText}>Clear Results</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.resultsContainer}>
        {results.map((result, i) => (
          <Text key={i} style={styles.resultText}>{result}</Text>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  buttonContainer: {
    padding: 16,
    gap: 12,
  },
  button: {
    backgroundColor: "#007AFF",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  clearButton: {
    backgroundColor: "#FF3B30",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  resultsContainer: {
    flex: 1,
    padding: 16,
    backgroundColor: "#fff",
  },
  resultText: {
    fontFamily: "monospace",
    fontSize: 12,
    marginBottom: 4,
    color: "#333",
  },
});
