import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import {
  Trophy,
  Target,
  Flame,
  Award,
  TrendingUp,
} from "lucide-react-native";
import Colors from "@/constants/colors";
import GlowingCard from "@/components/GlowingCard";
import GradientButton from "@/components/GradientButton";
import { useUserProfile } from "@/contexts/UserProfileContext";
import { useAuth } from "@/contexts/AuthContext";
import { useI18n } from "@/contexts/I18nContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function ProfileScreen() {
  const router = useRouter();
  const { profile, updateProfile } = useUserProfile();
  const { logout } = useAuth();
  const insets = useSafeAreaInsets();
  const { language, setLanguage, t } = useI18n();

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          await logout();
          router.replace("/welcome");
        },
      },
    ]);
  };

  const accuracy = profile?.totalQuestions
    ? Math.round((profile.correctAnswers / profile.totalQuestions) * 100)
    : 0;

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
            <View style={styles.profileIcon}>
              <Text style={styles.profileInitial}>
                {profile?.displayName?.charAt(0).toUpperCase() || "P"}
              </Text>
            </View>
            <Text style={styles.name}>{profile?.displayName || "Player"}</Text>
            <Text style={styles.email}>{profile?.email}</Text>
          </View>

          <View style={styles.rankCard}>
            <LinearGradient
              colors={Colors.gradient.primary as [string, string]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.rankGradient}
            >
              <Trophy size={32} color={Colors.text} strokeWidth={2.5} />
              <View style={styles.rankInfo}>
                <Text style={styles.rankTitle}>{profile?.rank || "Bronze"}</Text>
                <Text style={styles.rankSubtitle}>
                  {profile?.rankPoints || 0} Points
                </Text>
              </View>
              <Text style={styles.levelBadge}>Level {profile?.level || 1}</Text>
            </LinearGradient>
          </View>

          <Text style={styles.sectionTitle}>Statistics</Text>

          <View style={styles.statsGrid}>
            <GlowingCard style={styles.statCard} glow={false}>
              <Target size={28} color={Colors.primary} />
              <Text style={styles.statValue}>{profile?.totalScore || 0}</Text>
              <Text style={styles.statLabel}>Total Score</Text>
            </GlowingCard>

            <GlowingCard style={styles.statCard} glow={false}>
              <Flame size={28} color={Colors.secondary} />
              <Text style={styles.statValue}>{profile?.currentStreak || 0}</Text>
              <Text style={styles.statLabel}>Streak</Text>
            </GlowingCard>

            <GlowingCard style={styles.statCard} glow={false}>
              <TrendingUp size={28} color={Colors.accent} />
              <Text style={styles.statValue}>{accuracy}%</Text>
              <Text style={styles.statLabel}>Accuracy</Text>
            </GlowingCard>

            <GlowingCard style={styles.statCard} glow={false}>
              <Award size={28} color={Colors.warning} />
              <Text style={styles.statValue}>{profile?.badges?.length || 0}</Text>
              <Text style={styles.statLabel}>Badges</Text>
            </GlowingCard>
          </View>

          <Text style={styles.sectionTitle}>Preferences</Text>

          <GlowingCard style={styles.gameStatsCard} glow={false}>
            <View style={styles.gameStatRow}>
              <Text style={styles.gameStatLabel}>Language</Text>
              <Text style={styles.gameStatValue}>{language.toUpperCase()}</Text>
            </View>
            <View style={styles.divider} />
            <View style={[styles.languageRow]}>
              {(["en","vi"] as const).map((lang) => (
                <GradientButton
                  key={lang}
                  title={lang === "en" ? "English" : "Tiếng Việt"}
                  onPress={async () => {
                    await setLanguage(lang);
                    try {
                      await updateProfile({} as any);
                    } catch (e) {
                      // no-op
                    }
                    Alert.alert("Language", `Switched to ${lang.toUpperCase()}`);
                  }}
                  variant={language === lang ? "primary" : "secondary"}
                  style={{ flex: 1 }}
                />
              ))}
            </View>
          </GlowingCard>

          <Text style={styles.sectionTitle}>Game Stats</Text>

          <GlowingCard style={styles.gameStatsCard} glow={false}>
            <View style={styles.gameStatRow}>
              <Text style={styles.gameStatLabel}>Solo Games</Text>
              <Text style={styles.gameStatValue}>
                {profile?.soloGamesPlayed || 0}
              </Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.gameStatRow}>
              <Text style={styles.gameStatLabel}>Total Questions</Text>
              <Text style={styles.gameStatValue}>
                {profile?.totalQuestions || 0}
              </Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.gameStatRow}>
              <Text style={styles.gameStatLabel}>Correct Answers</Text>
              <Text style={styles.gameStatValue}>
                {profile?.correctAnswers || 0}
              </Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.gameStatRow}>
              <Text style={styles.gameStatLabel}>Longest Streak</Text>
              <Text style={styles.gameStatValue}>
                {profile?.longestStreak || 0}
              </Text>
            </View>
          </GlowingCard>

          <GradientButton
            title="Logout"
            onPress={handleLogout}
            variant="secondary"
            style={styles.logoutButton}
          />
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
    paddingBottom: 40,
    gap: 20,
  },
  header: {
    alignItems: "center",
    marginBottom: 8,
  },
  profileIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.surfaceLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    borderWidth: 3,
    borderColor: Colors.primary,
  },
  profileInitial: {
    fontSize: 40,
    fontWeight: "800" as const,
    color: Colors.primary,
  },
  name: {
    fontSize: 28,
    fontWeight: "800" as const,
    color: Colors.text,
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  rankCard: {
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  rankGradient: {
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  rankInfo: {
    flex: 1,
  },
  rankTitle: {
    fontSize: 24,
    fontWeight: "800" as const,
    color: Colors.text,
    marginBottom: 4,
  },
  rankSubtitle: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
  },
  levelBadge: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: Colors.text,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: Colors.text,
    marginTop: 8,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: "47%",
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
  gameStatsCard: {
    gap: 0,
    padding: 0,
  },
  gameStatRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
  },
  gameStatLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  gameStatValue: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: Colors.primary,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
  },
  logoutButton: {
    marginTop: 12,
  },
  languageRow: {
    flexDirection: "row",
    gap: 12,
    padding: 16,
  },
});
