import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Gamepad2, Swords, User, Trophy } from "lucide-react-native";
import Colors from "@/constants/colors";
import GlowingCard from "@/components/GlowingCard";
import { useUserProfile } from "@/contexts/UserProfileContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function HomeScreen() {
  const router = useRouter();
  const { profile } = useUserProfile();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <LinearGradient
        colors={[Colors.background, Colors.surface]}
        style={styles.gradient}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: insets.top + 20 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <View>
              <Text style={styles.greeting}>Welcome back,</Text>
              <Text style={styles.name}>{profile?.displayName || "Player"}</Text>
            </View>
            <TouchableOpacity
              style={styles.profileButton}
              onPress={() => router.push("/profile" as any)}
            >
              <User size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>

          <GlowingCard style={styles.statsCard}>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{profile?.level || 1}</Text>
                <Text style={styles.statLabel}>Level</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{profile?.totalScore || 0}</Text>
                <Text style={styles.statLabel}>Score</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{profile?.rank || "Bronze"}</Text>
                <Text style={styles.statLabel}>Rank</Text>
              </View>
            </View>
          </GlowingCard>

          <Text style={styles.sectionTitle}>Choose Your Mode</Text>

          <TouchableOpacity
            onPress={() => router.push("/solo" as any)}
            activeOpacity={0.8}
          >
            <GlowingCard style={styles.modeCard}>
              <LinearGradient
                colors={Colors.gradient.primary as [string, string]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.modeGradient}
              >
                <View style={styles.modeIcon}>
                  <Gamepad2 size={48} color={Colors.text} strokeWidth={2} />
                </View>
                <View style={styles.modeContent}>
                  <Text style={styles.modeTitle}>Solo Mode</Text>
                  <Text style={styles.modeDescription}>
                    Test your knowledge with AI-generated questions
                  </Text>
                </View>
              </LinearGradient>
            </GlowingCard>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {}}
            activeOpacity={0.8}
            disabled
          >
            <GlowingCard style={[styles.modeCard, styles.disabledCard]} glow={false}>
              <LinearGradient
                colors={Colors.gradient.secondary as [string, string]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.modeGradient}
              >
                <View style={styles.modeIcon}>
                  <Swords size={48} color={Colors.text} strokeWidth={2} />
                </View>
                <View style={styles.modeContent}>
                  <Text style={styles.modeTitle}>Battle Mode</Text>
                  <Text style={styles.modeDescription}>
                    Challenge friends in real-time battles
                  </Text>
                  <Text style={styles.comingSoon}>Coming Soon</Text>
                </View>
              </LinearGradient>
            </GlowingCard>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push("/leaderboard" as any)}
            activeOpacity={0.8}
          >
            <GlowingCard style={styles.quickAccessCard}>
              <Trophy size={32} color={Colors.primary} />
              <View style={styles.quickAccessContent}>
                <Text style={styles.quickAccessTitle}>Leaderboard</Text>
                <Text style={styles.quickAccessDescription}>
                  See where you rank
                </Text>
              </View>
            </GlowingCard>
          </TouchableOpacity>
        </ScrollView>
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
  scrollContent: {
    padding: 20,
    paddingBottom: 20,
    gap: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  greeting: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  name: {
    fontSize: 28,
    fontWeight: "800" as const,
    color: Colors.text,
  },
  profileButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.surfaceLight,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  statsCard: {
    padding: 24,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "800" as const,
    color: Colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    textTransform: "uppercase" as const,
    letterSpacing: 1,
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: Colors.border,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: Colors.text,
    marginTop: 8,
  },
  modeCard: {
    padding: 0,
    overflow: "hidden",
  },
  modeGradient: {
    padding: 24,
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
  },
  modeIcon: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  modeContent: {
    flex: 1,
  },
  modeTitle: {
    fontSize: 22,
    fontWeight: "800" as const,
    color: Colors.text,
    marginBottom: 4,
  },
  modeDescription: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
    lineHeight: 20,
  },
  disabledCard: {
    opacity: 0.6,
  },
  comingSoon: {
    fontSize: 12,
    color: Colors.warning,
    fontWeight: "600" as const,
    marginTop: 8,
  },
  quickAccessCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  quickAccessContent: {
    flex: 1,
  },
  quickAccessTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: Colors.text,
    marginBottom: 2,
  },
  quickAccessDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
});
