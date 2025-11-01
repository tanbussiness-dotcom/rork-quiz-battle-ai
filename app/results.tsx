import React, { useEffect, useMemo, useRef, useState } from "react";
import { View, Text, StyleSheet, Animated, Easing, Platform, TouchableOpacity, ScrollView } from "react-native";
import { Stack, useRouter, useLocalSearchParams } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Target, TrendingUp, Bolt, Check, X, Home, Play } from "lucide-react-native";
import Colors from "@/constants/colors";
import GlowingCard from "@/components/GlowingCard";

import { useSafeAreaInsets } from "react-native-safe-area-context";

interface ExplanationItem {
  id: string;
  status: "correct" | "incorrect";
  question: string;
  yourAnswer: string;
  correctAnswer?: string;
  note?: string;
}

function useBounce() {
  const scale = useRef(new Animated.Value(1)).current;
  const onPressIn = () =>
    Animated.spring(scale, { toValue: 0.96, useNativeDriver: true }).start();
  const onPressOut = () =>
    Animated.spring(scale, { toValue: 1, friction: 3, tension: 100, useNativeDriver: true }).start();
  return { scale, onPressIn, onPressOut };
}

function Confetti({ visible }: { visible: boolean }) {
  const pieces = 36;
  const anims = useMemo(() => Array.from({ length: pieces }).map(() => new Animated.Value(0)), []);

  useEffect(() => {
    if (!visible) return;
    console.log("Confetti: start");
    const animations = anims.map((v, i) =>
      Animated.timing(v, {
        toValue: 1,
        duration: 2500 + Math.random() * 1500,
        delay: i * 40,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    Animated.stagger(40, animations).start(() => {
      anims.forEach(a => a.setValue(0));
    });
  }, [visible, anims]);

  if (!visible) return null;

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {anims.map((v, i) => {
        const startX = Math.random() * 1; // 0..1 width
        const translateY = v.interpolate({ inputRange: [0, 1], outputRange: [-60, Platform.OS === "web" ? window.innerHeight ?? 800 : 900] });
        const rotate = v.interpolate({ inputRange: [0, 1], outputRange: ["0deg", `${Math.random() > 0.5 ? 720 : -720}deg`] });
        const translateX = v.interpolate({ inputRange: [0, 1], outputRange: [0, (Math.random() - 0.5) * 160] });
        const bg = confettiColors[i % confettiColors.length];
        return (
          <Animated.View
            key={`confetti-${i}`}
            style={[
              styles.confetti,
              {
                left: `${startX * 100}%`,
                backgroundColor: bg,
                transform: [{ translateY }, { translateX }, { rotate }],
              },
            ]}
          />
        );
      })}
    </View>
  );
}

const confettiColors = ["#22c55e", "#06b6d4", "#3b82f6", "#8b5cf6", "#f59e0b"] as const;

export default function ResultsScreen() {
  const router = useRouter();
  const { score, total, correct, explanations, mentor } = useLocalSearchParams();
  const insets = useSafeAreaInsets();

  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.8));

  const totalNum = parseInt((total as string) ?? "0") || 0;
  const correctNum = parseInt((correct as string) ?? "0") || 0;
  const accuracy = totalNum > 0 ? Math.round((correctNum / totalNum) * 100) : 0;

  const explanationItems: ExplanationItem[] = useMemo(() => {
    try {
      if (typeof explanations === "string") {
        const parsed = JSON.parse(explanations) as ExplanationItem[];
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.log("Results: failed to parse explanations", e);
    }
    return [];
  }, [explanations]);

  const mentorText = useMemo(() => {
    if (typeof mentor === "string" && mentor.length > 0) return mentor;
    if (accuracy >= 90) return "Phenomenal accuracy. Your mastery of advanced items stands out—consider tackling challenge mode next.";
    if (accuracy >= 80) return "Excellent performance! Strong core understanding with great consistency. Keep the streak going.";
    if (accuracy >= 60) return "Good job. Review the missed items—target weak spots and you'll hit the next tier fast.";
    return "Nice effort. Focus on fundamentals first; small daily sessions will boost your accuracy quickly.";
  }, [mentor, accuracy]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 8, tension: 40, useNativeDriver: true }),
    ]).start();
  }, [fadeAnim, scaleAnim]);

  const getMessage = () => {
    if (accuracy >= 90) return { emoji: "🏆", text: "Outstanding!" } as const;
    if (accuracy >= 80) return { emoji: "🎉", text: "Excellent Work!" } as const;
    if (accuracy >= 60) return { emoji: "👏", text: "Great Job!" } as const;
    return { emoji: "💪", text: "Keep Going!" } as const;
  };

  const message = getMessage();

  const playBounce = useBounce();
  const homeBounce = useBounce();

  return (
    <View style={styles.container} testID="results-screen">
      <Stack.Screen options={{ headerShown: false }} />
      <LinearGradient colors={[Colors.background, Colors.surface]} style={styles.gradient}>
        <Confetti visible={accuracy >= 80} />
        <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 32, paddingBottom: insets.bottom + 32 }]} showsVerticalScrollIndicator={false}>
          <Animated.View
            style={[
              styles.resultsContainer,
              { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
            ]}
          >
            <View style={styles.header}>
              <Text style={styles.emoji}>{message.emoji}</Text>
              <Text style={styles.title}>{message.text}</Text>
              <Text style={styles.subtitle}>Quiz Results</Text>
            </View>

            <View style={styles.scoreCard} accessibilityLabel="score-summary">
              <View style={styles.scoreCircle}>
                <Text style={styles.scorePercent}>{accuracy}%</Text>
                <Text style={styles.scoreSmall}>Score</Text>
              </View>
              <Text style={styles.scoreDetails}>You answered {correctNum} out of {totalNum} correctly</Text>
            </View>

            <View style={styles.statsGrid}>
              <GlowingCard style={styles.statCard} glow={false}>
                <Target size={24} color={Colors.secondary} />
                <Text style={styles.statValue}>{correctNum}/{totalNum}</Text>
                <Text style={styles.statLabel}>Correct</Text>
              </GlowingCard>
              <GlowingCard style={styles.statCard} glow={false}>
                <TrendingUp size={24} color={Colors.accent} />
                <Text style={styles.statValue}>{accuracy}%</Text>
                <Text style={styles.statLabel}>Accuracy</Text>
              </GlowingCard>
            </View>

            <View style={styles.aiBubble} testID="ai-mentor-bubble">
              <View style={styles.aiAvatar}><Bolt size={18} color="#fff" /></View>
              <View style={{ flex: 1 }}>
                <View style={styles.aiHeader}>
                  <Text style={styles.aiName}>Gemini AI Mentor</Text>
                  <View style={styles.aiOnlineDot} />
                </View>
                <Text style={styles.aiText}>{mentorText}</Text>
              </View>
            </View>

            {explanationItems.length > 0 && (
              <View style={{ gap: 12 }}>
                <Text style={styles.reviewTitle}>Review Your Answers</Text>
                {explanationItems.map((item, idx) => (
                  <SlideFadeCard key={item.id} delay={(idx + 1) * 120} status={item.status}>
                    <View style={styles.exRow}>
                      <View style={[styles.exIcon, { backgroundColor: item.status === "correct" ? Colors.success : Colors.error }]}>
                        {item.status === "correct" ? (
                          <Check size={14} color="#fff" />
                        ) : (
                          <X size={14} color="#fff" />
                        )}
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.exTitle, { color: item.status === "correct" ? Colors.success : Colors.error }]}>
                          {item.status === "correct" ? "Correct" : "Incorrect"}
                        </Text>
                        <Text style={styles.exQuestion}>{item.question}</Text>
                        <Text style={styles.exYour}>Your answer: {item.yourAnswer}{item.status === "correct" ? " ✓" : ""}</Text>
                        {item.status === "incorrect" && item.correctAnswer ? (
                          <Text style={styles.exCorrect}>Correct answer: {item.correctAnswer}</Text>
                        ) : null}
                        {item.note ? <Text style={styles.exNote}>{item.note}</Text> : null}
                      </View>
                    </View>
                  </SlideFadeCard>
                ))}
              </View>
            )}

            <View style={styles.buttons}>
              <Animated.View style={{ transform: [{ scale: playBounce.scale }] }}>
                <TouchableOpacity
                  onPressIn={playBounce.onPressIn}
                  onPressOut={playBounce.onPressOut}
                  onPress={() => router.back()}
                  accessibilityRole="button"
                  style={styles.primaryCta}
                  testID="play-again-btn"
                >
                  <Play size={18} color="#000" />
                  <Text style={styles.primaryCtaText}>Play Again</Text>
                </TouchableOpacity>
              </Animated.View>

              <Animated.View style={{ transform: [{ scale: homeBounce.scale }] }}>
                <TouchableOpacity
                  onPressIn={homeBounce.onPressIn}
                  onPressOut={homeBounce.onPressOut}
                  onPress={() => router.replace("/(tabs)" as any)}
                  accessibilityRole="button"
                  style={styles.secondaryCta}
                  testID="back-home-btn"
                >
                  <Home size={18} color={Colors.primary} />
                  <Text style={styles.secondaryCtaText}>Back to Home</Text>
                </TouchableOpacity>
              </Animated.View>
            </View>
          </Animated.View>
        </ScrollView>
      </LinearGradient>
    </View>
  );
}

function SlideFadeCard({ children, delay, status }: { children: React.ReactNode; delay: number; status: "correct" | "incorrect" }) {
  const fade = useRef(new Animated.Value(0)).current;
  const translate = useRef(new Animated.Value(-40)).current;
  useEffect(() => {
    Animated.timing(fade, { toValue: 1, duration: 500, delay, useNativeDriver: true }).start();
    Animated.timing(translate, { toValue: 0, duration: 500, delay, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, [delay, fade, translate]);
  return (
    <Animated.View
      style={[
        styles.explanationCard,
        status === "correct" ? styles.exCorrectBorder : styles.exIncorrectBorder,
        { opacity: fade, transform: [{ translateX: translate }] },
      ]}
    >
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  gradient: { flex: 1 },
  content: { paddingHorizontal: 20, gap: 20 },
  resultsContainer: { gap: 24 },
  header: { alignItems: "center", marginBottom: 8 },
  emoji: { fontSize: 72, marginBottom: 8 },
  title: { fontSize: 28, fontWeight: "800" as const, color: Colors.text, marginBottom: 4 },
  subtitle: { fontSize: 14, color: Colors.textSecondary },

  scoreCard: { padding: 20, alignItems: "center", gap: 12 },
  scoreCircle: {
    width: 128,
    height: 128,
    borderRadius: 64,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 4,
    borderColor: Colors.primary,
    backgroundColor: "rgba(34,197,94,0.15)",
    shadowColor: Colors.primary,
    shadowOpacity: 0.5,
    shadowRadius: 20,
  },
  scorePercent: { fontSize: 28, fontWeight: "800" as const, color: "#000", backgroundColor: Colors.primary, paddingHorizontal: 16, paddingVertical: 6, borderRadius: 999 },
  scoreSmall: { fontSize: 12, color: "#A7F3D0", marginTop: 6 },
  scoreDetails: { fontSize: 13, color: Colors.textSecondary },

  statsGrid: { flexDirection: "row", gap: 12 },
  statCard: { flex: 1, alignItems: "center", padding: 16, gap: 6 },
  statValue: { fontSize: 20, fontWeight: "800" as const, color: Colors.text },
  statLabel: { fontSize: 12, color: Colors.textSecondary, textTransform: "uppercase" as const },

  aiBubble: {
    flexDirection: "row",
    gap: 10,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(59,130,246,0.5)",
    backgroundColor: "rgba(29,78,216,0.15)",
    shadowColor: "#3b82f6",
    shadowOpacity: 0.6,
    shadowRadius: 16,
  },
  aiAvatar: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", backgroundColor: "#6366f1" },
  aiHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 },
  aiName: { color: "#60a5fa", fontWeight: "700" as const, fontSize: 13 },
  aiOnlineDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.success },
  aiText: { color: "#e5e7eb", fontSize: 14, lineHeight: 20 },

  reviewTitle: { color: "#22d3ee", fontWeight: "700" as const, fontSize: 16 },
  explanationCard: { padding: 14, borderRadius: 12, backgroundColor: Colors.surface, borderWidth: 1 },
  exCorrectBorder: { borderColor: "rgba(34,197,94,0.35)" },
  exIncorrectBorder: { borderColor: "rgba(239,68,68,0.35)" },
  exRow: { flexDirection: "row", gap: 10 },
  exIcon: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  exTitle: { fontSize: 13, fontWeight: "700" as const, marginBottom: 2 },
  exQuestion: { color: Colors.text, fontSize: 14, marginBottom: 2 },
  exYour: { color: Colors.textSecondary, fontSize: 12 },
  exCorrect: { color: Colors.success, fontSize: 12 },
  exNote: { color: "#9CA3AF", fontSize: 12, marginTop: 4 },

  buttons: { gap: 12, marginTop: 8 },
  primaryCta: { flexDirection: "row", gap: 8, alignItems: "center", justifyContent: "center", backgroundColor: Colors.primary, paddingVertical: 14, borderRadius: 12 },
  primaryCtaText: { color: "#000", fontWeight: "800" as const, fontSize: 16 },
  secondaryCta: { flexDirection: "row", gap: 8, alignItems: "center", justifyContent: "center", backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.primary, paddingVertical: 14, borderRadius: 12 },
  secondaryCtaText: { color: Colors.primary, fontWeight: "800" as const, fontSize: 16 },

  confetti: { position: "absolute", width: 10, height: 10, borderRadius: 2, top: -50 },
});
