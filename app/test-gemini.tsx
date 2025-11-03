import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from "react-native";
import { Stack } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { trpcClient } from "@/lib/trpc";

export default function TestGeminiScreen() {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const testQuestionGeneration = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      console.log("🧪 Testing Gemini API - Generating question...");
      const question = await trpcClient.questions.generate.mutate({
        topic: "JavaScript",
        difficulty: "medium",
        language: "en",
      });

      console.log("✅ Question generated successfully:", question);
      setResult(question);
    } catch (err: any) {
      console.error("❌ Question generation failed:", err);
      setError(err.message || "Unknown error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: "Test Gemini Integration",
          headerStyle: { backgroundColor: "#1a1a2e" },
          headerTintColor: "#fff",
        }}
      />
      <ScrollView style={styles.container}>
        <View style={[styles.content, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }]}>
          <Text style={styles.title}>Gemini API Test</Text>
          <Text style={styles.subtitle}>
            This screen tests if the Gemini API is properly configured and working.
          </Text>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={testQuestionGeneration}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Generate Test Question</Text>
            )}
          </TouchableOpacity>

          {error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorTitle}>❌ Error</Text>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {result && (
            <View style={styles.resultBox}>
              <Text style={styles.resultTitle}>✅ Success!</Text>
              
              <View style={styles.resultSection}>
                <Text style={styles.resultLabel}>Question ID:</Text>
                <Text style={styles.resultValue}>{result.id}</Text>
              </View>

              <View style={styles.resultSection}>
                <Text style={styles.resultLabel}>Type:</Text>
                <Text style={styles.resultValue}>{result.type}</Text>
              </View>

              <View style={styles.resultSection}>
                <Text style={styles.resultLabel}>Content:</Text>
                <Text style={styles.resultValue}>{result.content}</Text>
              </View>

              {result.options && (
                <View style={styles.resultSection}>
                  <Text style={styles.resultLabel}>Options:</Text>
                  {result.options.map((opt: string, idx: number) => (
                    <Text key={idx} style={styles.resultValue}>
                      {idx + 1}. {opt}
                    </Text>
                  ))}
                </View>
              )}

              <View style={styles.resultSection}>
                <Text style={styles.resultLabel}>Correct Answer:</Text>
                <Text style={[styles.resultValue, styles.correctAnswer]}>
                  {result.correctAnswer}
                </Text>
              </View>

              <View style={styles.resultSection}>
                <Text style={styles.resultLabel}>Explanation:</Text>
                <Text style={styles.resultValue}>{result.explanation}</Text>
              </View>

              <View style={styles.resultSection}>
                <Text style={styles.resultLabel}>Difficulty:</Text>
                <Text style={styles.resultValue}>{result.difficulty}</Text>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f0f1e",
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#a0a0a0",
    marginBottom: 24,
    textAlign: "center",
    lineHeight: 22,
  },
  button: {
    backgroundColor: "#6366f1",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 24,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  errorBox: {
    backgroundColor: "#2d1515",
    borderColor: "#ef4444",
    borderWidth: 2,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#ef4444",
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: "#fca5a5",
    lineHeight: 20,
  },
  resultBox: {
    backgroundColor: "#1a2e1a",
    borderColor: "#10b981",
    borderWidth: 2,
    borderRadius: 12,
    padding: 16,
  },
  resultTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#10b981",
    marginBottom: 16,
  },
  resultSection: {
    marginBottom: 16,
  },
  resultLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6ee7b7",
    marginBottom: 4,
  },
  resultValue: {
    fontSize: 14,
    color: "#d1fae5",
    lineHeight: 20,
  },
  correctAnswer: {
    fontWeight: "bold",
    color: "#10b981",
  },
});
