import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { Stack } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Trophy, Medal, Award } from "lucide-react-native";
import Colors from "@/constants/colors";
import GlowingCard from "@/components/GlowingCard";
import { useQuery } from "@tanstack/react-query";
import { getLeaderboard } from "@/services/leaderboard.service";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useState } from "react";

export default function LeaderboardScreen() {
  const insets = useSafeAreaInsets();
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'all_time'>('all_time');
  const [mode, setMode] = useState<'solo' | 'battle'>('solo');

  const { data: topPlayers, isLoading, error } = useQuery({
    queryKey: ["leaderboard", period, mode],
    queryFn: async () => {
      try {
        console.log('📊 Fetching leaderboard:', { period, mode });
        const entries = await getLeaderboard({ type: mode, period, limit: 100 });
        console.log('✅ Leaderboard fetched:', entries.length, 'entries');
        return entries;
      } catch (err) {
        console.error('❌ Error fetching leaderboard:', err);
        throw err;
      }
    },
    staleTime: 30000,
    refetchInterval: 60000,
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

          <View style={styles.filters}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
              {(['daily', 'weekly', 'monthly', 'all_time'] as const).map(p => (
                <TouchableOpacity
                  key={p}
                  style={[styles.filterChip, period === p && styles.filterChipActive]}
                  onPress={() => setPeriod(p)}
                >
                  <Text style={[styles.filterText, period === p && styles.filterTextActive]}>
                    {p === 'all_time' ? 'All Time' : p.charAt(0).toUpperCase() + p.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <View style={styles.modeToggle}>
              <TouchableOpacity
                style={[styles.modeButton, mode === 'solo' && styles.modeButtonActive]}
                onPress={() => setMode('solo')}
              >
                <Text style={[styles.modeText, mode === 'solo' && styles.modeTextActive]}>Solo</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modeButton, mode === 'battle' && styles.modeButtonActive]}
                onPress={() => setMode('battle')}
              >
                <Text style={[styles.modeText, mode === 'battle' && styles.modeTextActive]}>Battle</Text>
              </TouchableOpacity>
            </View>
          </View>

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text style={styles.loadingText}>Loading rankings...</Text>
            </View>
          ) : error ? (
            <View style={styles.emptyContainer}>
              <Trophy size={64} color={Colors.textTertiary} />
              <Text style={styles.emptyText}>Failed to load leaderboard</Text>
              <Text style={styles.emptySubtext}>Please try again later</Text>
            </View>
          ) : (
            <View style={styles.listContainer}>
              {topPlayers?.map((player, index) => (
                <GlowingCard
                  key={player.id}
                  style={styles.playerCard}
                  glow={index < 3}
                >
                  <View style={styles.rankBadge}>
                    {getRankIcon(index) || (
                      <Text style={styles.rankNumber}>{player.rank}</Text>
                    )}
                  </View>
                  <View style={styles.playerInfo}>
                    <Text style={styles.playerName}>{player.username || 'Anonymous'}</Text>
                    <View style={styles.playerStats}>
                      <Text style={styles.playerLevel}>{player.gamesPlayed} games</Text>
                    </View>
                  </View>
                  <View style={styles.scoreContainer}>
                    <Text style={styles.score}>{player.points}</Text>
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
  filters: {
    marginBottom: 20,
    gap: 12,
  },
  filterRow: {
    gap: 8,
    paddingHorizontal: 4,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.textSecondary,
  },
  filterTextActive: {
    color: "#000",
  },
  modeToggle: {
    flexDirection: "row",
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },
  modeButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  modeButtonActive: {
    backgroundColor: Colors.primary,
  },
  modeText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.textSecondary,
  },
  modeTextActive: {
    color: "#000",
  },
});
