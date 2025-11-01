import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ScrollView,
  Dimensions,
} from "react-native";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ArrowLeft,
  Settings,
  Trophy,
  Star,
  Crosshair,
  Shield,
  Clock,
  Target,
  RotateCcw,
  Home,
  Share2,
} from "lucide-react-native";
import Colors from "@/constants/colors";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface ParticleProps {
  delay: number;
  index: number;
}

function RankParticle({ delay, index }: ParticleProps) {
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const angle = (index / 12) * Math.PI * 2;
    const distance = 80;
    const targetX = Math.cos(angle) * distance;
    const targetY = Math.sin(angle) * distance;

    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.timing(translateX, {
          toValue: targetX,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: targetY,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, [delay, index, translateX, translateY, opacity, scale]);

  const colors = ["#22d3ee", "#10b981", "#eab308", "#f59e0b"];
  const particleColor = colors[index % colors.length];

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          backgroundColor: particleColor,
          transform: [{ translateX }, { translateY }, { scale }],
          opacity,
        },
      ]}
    />
  );
}

function BackgroundParticle({ index }: { index: number }) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 2000 + Math.random() * 1000,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 2000 + Math.random() * 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        styles.backgroundParticle,
        {
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
          opacity,
        },
      ]}
    />
  );
}

function RankBadge({ showParticles }: { showParticles: boolean }) {
  const rotation = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(rotation, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(scale, {
            toValue: 1.2,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(scale, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ]),
      ]),
    ]).start();
  }, [rotation, scale]);

  const rotate = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <View style={styles.rankBadgeContainer}>
      <Animated.View style={[styles.rankBadge, { transform: [{ rotate }, { scale }] }]}>
        <LinearGradient
          colors={["#fbbf24", "#f59e0b", "#d97706"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.rankBadgeGradient}
        >
          <Star size={36} color="#78350f" fill="#78350f" />
        </LinearGradient>
      </Animated.View>
      {showParticles &&
        Array.from({ length: 12 }).map((_, i) => <RankParticle key={i} delay={1000} index={i} />)}
    </View>
  );
}

function ProgressBar({ progress }: { progress: number }) {
  const animatedWidth = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(animatedWidth, {
      toValue: progress,
      duration: 2000,
      useNativeDriver: false,
    }).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1000,
          useNativeDriver: false,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: false,
        }),
      ])
    ).start();
  }, [progress, animatedWidth, pulseAnim]);

  const width = animatedWidth.interpolate({
    inputRange: [0, 100],
    outputRange: ["0%", "100%"],
  });

  return (
    <View style={styles.progressBarContainer}>
      <View style={styles.progressBarTrack}>
        <Animated.View style={[styles.progressBarFill, { width }]}>
          <LinearGradient
            colors={[Colors.secondary, Colors.primary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.progressBarGradient}
          >
            <Animated.View
              style={[
                styles.progressBarShine,
                {
                  transform: [{ scaleX: pulseAnim }],
                },
              ]}
            />
          </LinearGradient>
        </Animated.View>
      </View>
    </View>
  );
}

function GlowButton({
  children,
  style,
  onPress,
  gradient = [Colors.primary, "#14b8a6"] as const,
}: {
  children: React.ReactNode;
  style?: any;
  onPress: () => void;
  gradient?: readonly [string, string];
}) {
  const glowAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: false,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: false,
        }),
      ])
    ).start();
  }, [glowAnim]);

  return (
    <Animated.View style={[{ transform: [{ scale: scaleAnim }] }]}>
      <TouchableOpacity
        style={[styles.glowButton, style]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.9}
      >
        <LinearGradient
          colors={gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.glowButtonGradient}
        >
          {children}
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function BattleResultsScreen() {
  const insets = useSafeAreaInsets();
  const { isWinner = "true" } = useLocalSearchParams<{ isWinner?: string }>();
  const [showRankUp, setShowRankUp] = useState(false);

  const isVictory = isWinner === "true";
  const rankProgress = 75;
  const pointsGained = 285;
  const totalPoints = 1847;
  const pointsToNextRank = 153;

  useEffect(() => {
    setTimeout(() => {
      setShowRankUp(true);
    }, 500);
  }, []);

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={{ height: insets.top, backgroundColor: Colors.background }} />

      <View style={styles.backgroundParticles}>
        {Array.from({ length: 20 }).map((_, i) => (
          <BackgroundParticle key={i} index={i} />
        ))}
      </View>

      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={() => router.back()}>
          <ArrowLeft size={20} color={Colors.secondary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Battle Results</Text>
        <TouchableOpacity style={styles.headerButton}>
          <Settings size={20} color={Colors.secondary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.victoryBanner}>
          <LinearGradient
            colors={
              isVictory
                ? ["rgba(16, 185, 129, 0.2)" as const, "rgba(34, 197, 94, 0.1)" as const]
                : ["rgba(239, 68, 68, 0.2)" as const, "rgba(220, 38, 38, 0.1)" as const]
            }
            style={styles.victoryBannerGradient}
          >
            <View style={styles.victoryIcon}>
              <Trophy size={48} color={isVictory ? "#fbbf24" : "#9ca3af"} />
            </View>
            <Text style={[styles.victoryTitle, !isVictory && styles.defeatTitle]}>
              {isVictory ? "VICTORY!" : "DEFEAT"}
            </Text>
            <Text style={styles.victorySubtitle}>
              {isVictory ? "You dominated the battlefield" : "Better luck next time"}
            </Text>
          </LinearGradient>
        </View>

        <View style={styles.rankProgressSection}>
          <View style={styles.rankProgressCard}>
            <RankBadge showParticles={showRankUp} />

            <View style={styles.rankInfo}>
              <Text style={styles.rankTitle}>Silver III</Text>
              <Text style={styles.rankSubtitle}>Rank Up!</Text>
            </View>

            <View style={styles.progressSection}>
              <View style={styles.progressLabels}>
                <Text style={styles.progressLabel}>Bronze I</Text>
                <Text style={styles.progressLabel}>Silver III</Text>
              </View>
              <ProgressBar progress={rankProgress} />
            </View>

            <View style={styles.pointsGrid}>
              <View style={styles.pointsItem}>
                <Text style={styles.pointsValue}>+{pointsGained}</Text>
                <Text style={styles.pointsLabel}>Points Gained</Text>
              </View>
              <View style={styles.pointsItem}>
                <Text style={[styles.pointsValue, { color: "#eab308" }]}>{totalPoints}</Text>
                <Text style={styles.pointsLabel}>Total Points</Text>
              </View>
              <View style={styles.pointsItem}>
                <Text style={[styles.pointsValue, { color: Colors.secondary }]}>{pointsToNextRank}</Text>
                <Text style={styles.pointsLabel}>To Next Rank</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.statsSection}>
          <View style={styles.statsSectionHeader}>
            <Text style={styles.statsSectionTitle}>Battle Statistics</Text>
          </View>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <View style={[styles.statIconContainer, { backgroundColor: "rgba(239, 68, 68, 0.2)" }]}>
                <Crosshair size={24} color="#ef4444" />
              </View>
              <Text style={styles.statValue}>24</Text>
              <Text style={styles.statLabel}>Eliminations</Text>
            </View>
            <View style={styles.statCard}>
              <View style={[styles.statIconContainer, { backgroundColor: "rgba(59, 130, 246, 0.2)" }]}>
                <Shield size={24} color="#3b82f6" />
              </View>
              <Text style={styles.statValue}>7</Text>
              <Text style={styles.statLabel}>Deaths</Text>
            </View>
            <View style={styles.statCard}>
              <View style={[styles.statIconContainer, { backgroundColor: "rgba(234, 179, 8, 0.2)" }]}>
                <Clock size={24} color="#eab308" />
              </View>
              <Text style={styles.statValue}>12:34</Text>
              <Text style={styles.statLabel}>Duration</Text>
            </View>
            <View style={styles.statCard}>
              <View
                style={[styles.statIconContainer, { backgroundColor: `rgba(34, 197, 94, 0.2)` }]}
              >
                <Target size={24} color={Colors.primary} />
              </View>
              <Text style={styles.statValue}>78%</Text>
              <Text style={styles.statLabel}>Accuracy</Text>
            </View>
          </View>
        </View>

        <View style={styles.actionButtons}>
          <GlowButton
            gradient={[Colors.primary, "#14b8a6"] as const}
            onPress={() => router.replace("/(tabs)/battle")}
          >
            <RotateCcw size={20} color="#000" />
            <Text style={styles.glowButtonText}>New Battle</Text>
          </GlowButton>

          <GlowButton
            gradient={[Colors.secondary, "#0ea5e9"] as const}
            onPress={() => router.push("/(tabs)/battle")}
          >
            <Home size={20} color="#000" />
            <Text style={styles.glowButtonText}>Back to Lobby</Text>
          </GlowButton>

          <TouchableOpacity style={styles.shareButton}>
            <Share2 size={20} color={Colors.textSecondary} />
            <Text style={styles.shareButtonText}>Share Results</Text>
          </TouchableOpacity>
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
  backgroundParticles: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: "none",
  },
  backgroundParticle: {
    position: "absolute",
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.secondary,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.surfaceLight,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: Colors.text,
    textShadowColor: Colors.secondary,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  victoryBanner: {
    marginBottom: 24,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 8,
  },
  victoryBannerGradient: {
    padding: 24,
    alignItems: "center",
  },
  victoryIcon: {
    marginBottom: 16,
  },
  victoryTitle: {
    fontSize: 32,
    fontWeight: "700" as const,
    color: Colors.primary,
    textShadowColor: Colors.primary,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
    marginBottom: 8,
  },
  defeatTitle: {
    color: "#ef4444",
    textShadowColor: "#ef4444",
  },
  victorySubtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  rankProgressSection: {
    marginBottom: 24,
  },
  rankProgressCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  rankBadgeContainer: {
    alignItems: "center",
    marginBottom: 24,
    position: "relative",
    height: 120,
    justifyContent: "center",
  },
  rankBadge: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 4,
    borderColor: "#fbbf24",
    overflow: "hidden",
    shadowColor: "#fbbf24",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 10,
  },
  rankBadgeGradient: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  particle: {
    position: "absolute",
    width: 4,
    height: 4,
    borderRadius: 2,
    top: "50%",
    left: "50%",
    marginLeft: -2,
    marginTop: -2,
  },
  rankInfo: {
    alignItems: "center",
    marginBottom: 24,
  },
  rankTitle: {
    fontSize: 28,
    fontWeight: "700" as const,
    color: "#eab308",
    textShadowColor: "#eab308",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
    marginBottom: 4,
  },
  rankSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  progressSection: {
    marginBottom: 24,
  },
  progressLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  progressBarContainer: {
    height: 12,
  },
  progressBarTrack: {
    height: 12,
    backgroundColor: Colors.surfaceLight,
    borderRadius: 6,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  progressBarFill: {
    height: "100%",
    overflow: "hidden",
  },
  progressBarGradient: {
    flex: 1,
    position: "relative",
  },
  progressBarShine: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  pointsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  pointsItem: {
    alignItems: "center",
  },
  pointsValue: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: Colors.primary,
    marginBottom: 4,
  },
  pointsLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: "center",
  },
  statsSection: {
    marginBottom: 24,
  },
  statsSectionHeader: {
    marginBottom: 16,
    alignItems: "center",
  },
  statsSectionTitle: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: Colors.secondary,
    textShadowColor: Colors.secondary,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  statCard: {
    width: (SCREEN_WIDTH - 44) / 2,
    backgroundColor: Colors.surfaceLight,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: Colors.text,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  actionButtons: {
    gap: 16,
  },
  glowButton: {
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 8,
  },
  glowButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    gap: 12,
  },
  glowButtonText: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: "#000",
  },
  shareButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.surfaceLight,
    paddingVertical: 12,
    borderRadius: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  shareButtonText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.textSecondary,
  },
});
