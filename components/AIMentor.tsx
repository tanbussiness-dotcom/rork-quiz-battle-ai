import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import Colors from "@/constants/colors";
import GlowingCard from "@/components/GlowingCard";
import GradientButton from "@/components/GradientButton";
import { Lightbulb, RefreshCcw } from "lucide-react-native";
import { explainAnswerViaBackend } from "@/services/question.service";

interface AIMentorProps {
  questionId: string;
  playerAnswer: string;
  language?: string;
}

export default function AIMentor({ questionId, playerAnswer, language }: AIMentorProps) {
  const [loading, setLoading] = useState<boolean>(false);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchExplanation = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log("AIMentor: fetching explanation", { questionId, playerAnswer });
      const text = await explainAnswerViaBackend({ questionId, playerAnswer, language });
      setExplanation(text);
    } catch (e: any) {
      console.log("AIMentor error", e);
      setError("Failed to get explanation. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <GlowingCard style={styles.container}>
      <View style={styles.header}>
        <Lightbulb size={20} color={Colors.primary} />
        <Text style={styles.title}>AI Mentor</Text>
      </View>

      {explanation ? (
        <Text style={styles.explanation} testID="ai-mentor-explanation">{explanation}</Text>
      ) : (
        <Text style={styles.subtitle}>Get a quick, encouraging explanation.</Text>
      )}

      {error && <Text style={styles.error}>{error}</Text>}

      <View style={styles.actions}>
        {loading ? (
          <ActivityIndicator color={Colors.primary} />
        ) : (
          <GradientButton
            title={explanation ? "Refresh" : "Explain Answer"}
            onPress={fetchExplanation}
            style={styles.button}
            textStyle={styles.buttonText}
            variant={"secondary"}
          />
        )}
        {explanation && !loading && (
          <TouchableOpacity
            accessibilityRole="button"
            onPress={fetchExplanation}
            style={styles.refresh}
            testID="ai-mentor-refresh"
          >
            <RefreshCcw size={18} color={Colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>
    </GlowingCard>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: Colors.surfaceLight,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: "800" as const,
    color: Colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  explanation: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
  },
  actions: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  button: {
    flex: 1,
  },
  buttonText: {
    fontSize: 15,
  },
  refresh: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  error: {
    marginTop: 6,
    color: Colors.error,
    fontSize: 13,
  },
});
