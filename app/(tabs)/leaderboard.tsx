import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Stack } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Trophy, Medal, Award } from "lucide-react-native";
import Colors from "@/constants/colors";
import GlowingCard from "@/components/GlowingCard";
import { useQuery } from "@tanstack/react-query";
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { UserProfile } from "@/contexts/UserProfileContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function LeaderboardScreen() {
  const insets = useSafeAreaInsets();

  const { data: topPlayers, isLoading } = useQuery({
    queryKey: ["leaderboard"],
    queryFn: async () => {
      const q = query(
        collection(db, "users"),
        orderBy("totalScore", "desc"),
        limit(100)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({
        ...doc.data(),
        uid: doc.id,
      })) as UserProfile[];
    },
  });

  const getRankIcon = (index: number) => {
    if (index === 0) return <Trophy size={24} color="#FFD700" />;
    if (index === 1) return <Medal size={24} color="#C0C0C0" />;
    if (index === 2) return <Award size={24} color="#CD7F32" />;
    return null;
  };

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
            <Trophy size={40} color={Colors.primary} strokeWidth={2.5} />
            <Text style={styles.title}>Leaderboard</Text>
            <Text style={styles.subtitle}>Top 100 Players</Text>
          </View>

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text style={styles.loadingText}>Loading rankings...</Text>
            </View>
          ) : (
            <View style={styles.listContainer}>
              {topPlayers?.map((player, index) => (
                <GlowingCard
                  key={player.uid}
                  style={styles.playerCard}
                  glow={index < 3}
                >
                  <View style={styles.rankBadge}>
                    {getRankIcon(index) || (
                      <Text style={styles.rankNumber}>{index + 1}</Text>
                    )}
                  </View>
                  <View style={styles.playerInfo}>
                    <Text style={styles.playerName}>{player.displayName}</Text>
                    <View style={styles.playerStats}>
                      <Text style={styles.playerRank}>{player.rank}</Text>
                      <Text style={styles.playerLevel}>• Level {player.level}</Text>
                    </View>
                  </View>
                  <View style={styles.scoreContainer}>
                    <Text style={styles.score}>{player.totalScore}</Text>
                    <Text style={styles.scoreLabel}>points</Text>
                  </View>
                </GlowingCard>
              ))}

              {(!topPlayers || topPlayers.length === 0) && (
                <View style={styles.emptyContainer}>
                  <Trophy size={64} color={Colors.textTertiary} />
                  <Text style={styles.emptyText}>No rankings yet</Text>
                  <Text style={styles.emptySubtext}>
                    Be the first to play and claim the top spot!
                  </Text>
                </View>
              )}
            </View>
          )}
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
  },
  header: {
    alignItems: "center",
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: "800" as const,
    color: Colors.text,
    marginTop: 12,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  listContainer: {
    gap: 12,
  },
  playerCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 16,
  },
  rankBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  rankNumber: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: Colors.textSecondary,
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: Colors.text,
    marginBottom: 4,
  },
  playerStats: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  playerRank: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: "600" as const,
  },
  playerLevel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  scoreContainer: {
    alignItems: "flex-end",
  },
  score: {
    fontSize: 20,
    fontWeight: "800" as const,
    color: Colors.primary,
  },
  scoreLabel: {
    fontSize: 11,
    color: Colors.textTertiary,
    textTransform: "uppercase" as const,
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 60,
    gap: 12,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: Colors.textSecondary,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.textTertiary,
    textAlign: "center",
    paddingHorizontal: 40,
  },
});
