import React, { useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
} from "react-native";
import { Stack, useRouter, useLocalSearchParams } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Trophy, Target, TrendingUp } from "lucide-react-native";
import Colors from "@/constants/colors";
import GlowingCard from "@/components/GlowingCard";
import GradientButton from "@/components/GradientButton";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function ResultsScreen() {
  const router = useRouter();
  const { score, total, correct } = useLocalSearchParams();
  const insets = useSafeAreaInsets();

  const [fadeAnim] = React.useState(new Animated.Value(0));
  const [scaleAnim] = React.useState(new Animated.Value(0.8));

  const scoreNum = parseInt(score as string) || 0;
  const totalNum = parseInt(total as string) || 0;
  const correctNum = parseInt(correct as string) || 0;
  const accuracy = Math.round((correctNum / totalNum) * 100);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const getMessage = () => {
    if (accuracy >= 90) return { emoji: "🏆", text: "Outstanding!" };
    if (accuracy >= 70) return { emoji: "🎉", text: "Great Job!" };
    if (accuracy >= 50) return { emoji: "👏", text: "Well Done!" };
    return { emoji: "💪", text: "Keep Trying!" };
  };

  const message = getMessage();

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <LinearGradient
        colors={[Colors.background, Colors.surface]}
        style={styles.gradient}
      >
        <View style={[styles.content, { paddingTop: insets.top + 40 }]}>
          <Animated.View
            style={[
              styles.resultsContainer,
              {
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            <View style={styles.header}>
              <Text style={styles.emoji}>{message.emoji}</Text>
              <Text style={styles.title}>{message.text}</Text>
              <Text style={styles.subtitle}>Quiz Complete!</Text>
            </View>

            <GlowingCard style={styles.scoreCard}>
              <View style={styles.mainScore}>
                <Trophy size={48} color={Colors.primary} strokeWidth={2.5} />
                <Text style={styles.scoreValue}>{scoreNum}</Text>
                <Text style={styles.scoreLabel}>Points Earned</Text>
              </View>
            </GlowingCard>

            <View style={styles.statsGrid}>
              <GlowingCard style={styles.statCard} glow={false}>
                <Target size={32} color={Colors.secondary} />
                <Text style={styles.statValue}>
                  {correctNum}/{totalNum}
                </Text>
                <Text style={styles.statLabel}>Correct</Text>
              </GlowingCard>

              <GlowingCard style={styles.statCard} glow={false}>
                <TrendingUp size={32} color={Colors.accent} />
                <Text style={styles.statValue}>{accuracy}%</Text>
                <Text style={styles.statLabel}>Accuracy</Text>
              </GlowingCard>
            </View>

            <View style={styles.buttons}>
              <GradientButton
                title="Play Again"
                onPress={() => router.back()}
                style={styles.button}
              />
              <GradientButton
                title="Go Home"
                onPress={() => router.replace("/(tabs)" as any)}
                variant="secondary"
                style={styles.button}
              />
            </View>
          </Animated.View>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  gradient: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
  },
  resultsContainer: {
    gap: 24,
  },
  header: {
    alignItems: "center",
    marginBottom: 8,
  },
  emoji: {
    fontSize: 80,
    marginBottom: 16,
  },
  title: {
    fontSize: 36,
    fontWeight: "800" as const,
    color: Colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: Colors.textSecondary,
  },
  scoreCard: {
    padding: 32,
    alignItems: "center",
  },
  mainScore: {
    alignItems: "center",
    gap: 12,
  },
  scoreValue: {
    fontSize: 64,
    fontWeight: "800" as const,
    color: Colors.primary,
  },
  scoreLabel: {
    fontSize: 16,
    color: Colors.textSecondary,
    textTransform: "uppercase" as const,
    letterSpacing: 1,
  },
  statsGrid: {
    flexDirection: "row",
    gap: 12,
  },
  statCard: {
    flex: 1,
    alignItems: "center",
    padding: 20,
    gap: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "800" as const,
    color: Colors.text,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    textTransform: "uppercase" as const,
  },
  buttons: {
    gap: 12,
    marginTop: 8,
  },
  button: {
    width: "100%",
  },
});
