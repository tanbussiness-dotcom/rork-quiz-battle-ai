import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from "react-native";
import { Stack } from "expo-router";
import { trpc } from "@/lib/trpc";

export default function DebugAPIScreen() {
  const [testResult, setTestResult] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const testFetch = async () => {
    setLoading(true);
    setTestResult("Testing fetch...");
    try {
      const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
      const apiUrl = `${baseUrl}/api`;
      const trpcUrl = `${baseUrl}/api/trpc`;

      setTestResult(`Base URL: ${baseUrl}\nAPI URL: ${apiUrl}\nTRPC URL: ${trpcUrl}\n\nTesting /api...`);

      const apiResponse = await fetch(apiUrl);
      const apiText = await apiResponse.text();
      const apiJson = JSON.parse(apiText);

      setTestResult(prev => prev + `\n✅ /api works: ${JSON.stringify(apiJson, null, 2)}`);

      setTestResult(prev => prev + `\n\nTesting /api/trpc/questions.generate...`);

      const trpcResponse = await fetch(`${trpcUrl}/questions.generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          topic: "Science",
          difficulty: "easy",
          language: "en",
        }),
      });

      const trpcText = await trpcResponse.text();
      setTestResult(prev => prev + `\n\nTRPC Response Status: ${trpcResponse.status}`);
      setTestResult(prev => prev + `\nTRPC Response: ${trpcText.substring(0, 500)}`);

    } catch (error: any) {
      setTestResult(prev => prev + `\n\n❌ Error: ${error.message}\n${error.stack}`);
    } finally {
      setLoading(false);
    }
  };

  const generateQuestionMutation = trpc.questions.generate.useMutation();

  const testTRPC = async () => {
    setLoading(true);
    setTestResult("Testing tRPC mutation...");
    try {
      const result = await generateQuestionMutation.mutateAsync({
        topic: "Science",
        difficulty: "easy",
        language: "en",
      });
      setTestResult(`✅ tRPC Success:\n${JSON.stringify(result, null, 2)}`);
    } catch (error: any) {
      setTestResult(`❌ tRPC Error:\n${error.message}\n\n${error.stack}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: "Debug API" }} />
      <View style={styles.content}>
        <Text style={styles.title}>API Debug Tool</Text>
        
        <TouchableOpacity style={styles.button} onPress={testFetch} disabled={loading}>
          <Text style={styles.buttonText}>Test Direct Fetch</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={testTRPC} disabled={loading}>
          <Text style={styles.buttonText}>Test tRPC Mutation</Text>
        </TouchableOpacity>

        {loading && <ActivityIndicator size="large" color="#00E6A8" style={{ marginTop: 20 }} />}

        <ScrollView style={styles.resultContainer}>
          <Text style={styles.resultText}>{testResult}</Text>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0A0E27",
  },
  content: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 20,
  },
  button: {
    backgroundColor: "#00E6A8",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: "center",
  },
  buttonText: {
    color: "#0A0E27",
    fontSize: 16,
    fontWeight: "bold",
  },
  resultContainer: {
    flex: 1,
    marginTop: 20,
    backgroundColor: "#1A1F3A",
    borderRadius: 12,
    padding: 16,
  },
  resultText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontFamily: "monospace",
  },
});