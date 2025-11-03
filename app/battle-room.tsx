import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Image,
  Alert,
} from "react-native";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ArrowLeft,
  Users,
  Trophy,
  Check,
  Clock,
  Zap,
} from "lucide-react-native";
import Colors from "@/constants/colors";
import { useAuth } from "@/contexts/AuthContext";
import {
  subscribeToBattleRoom,
  leaveBattleRoom,
  setPlayerReady,
  startBattle,
  addBotOpponent,
} from "@/services/battle.service";
import { initMatchNode } from "@/services/match.service";
import type { BattleRoom } from "@/models";
import { trpcClient } from "@/lib/trpc";

function PlayerCard({
  player,
  isHost,
  isCurrentUser,
}: {
  player: { uid: string; displayName: string; isReady: boolean; photoURL?: string };
  isHost: boolean;
  isCurrentUser: boolean;
}) {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (player.isReady) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [player.isReady, pulseAnim]);

  const avatarUrl =
    player.photoURL ??
    `https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-${(parseInt(player.uid.slice(-1), 16) % 6) + 1}.jpg`;

  return (
    <View style={styles.playerCard}>
      <Animated.View
        style={[
          styles.playerAvatarWrapper,
          player.isReady && { transform: [{ scale: pulseAnim }] },
        ]}
      >
        <Image source={{ uri: avatarUrl }} style={styles.playerAvatar} />
        {player.isReady && (
          <View style={styles.readyBadge}>
            <Check size={16} color="#000" />
          </View>
        )}
        {isHost && (
          <View style={styles.hostBadge}>
            <Trophy size={12} color="#000" />
          </View>
        )}
      </Animated.View>
      <Text style={styles.playerName} numberOfLines={1}>
        {player.displayName}
        {isCurrentUser && " (You)"}
      </Text>
      <View
        style={[
          styles.statusBadge,
          player.isReady ? styles.statusReady : styles.statusWaiting,
        ]}
      >
        <Text style={styles.statusText}>
          {player.isReady ? "Ready" : "Waiting"}
        </Text>
      </View>
    </View>
  );
}

function EmptyPlayerSlot() {
  const opacityAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacityAnim, {
          toValue: 0.7,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0.3,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [opacityAnim]);

  return (
    <Animated.View style={[styles.playerCard, styles.emptySlot, { opacity: opacityAnim }]}>
      <View style={styles.emptyAvatar}>
        <Users size={32} color={Colors.border} />
      </View>
      <Text style={styles.emptyText}>Waiting for player...</Text>
    </Animated.View>
  );
}

export default function BattleRoomScreen() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const { roomId } = useLocalSearchParams<{ roomId: string }>();
  const [room, setRoom] = useState<BattleRoom | null>(null);
  const [loading, setLoading] = useState(true);
  const [isReady, setIsReady] = useState(false);
  const [generatingQuestions, setGeneratingQuestions] = useState(false);

  useEffect(() => {
    if (!roomId) {
      router.back();
      return;
    }

    const unsubscribe = subscribeToBattleRoom(roomId as string, (roomData) => {
      setRoom(roomData);
      setLoading(false);

      if (roomData?.status === "in_progress") {
        router.replace(`/battle-quiz?roomId=${roomId}`);
      }
    });

    return unsubscribe;
  }, [roomId]);

  useEffect(() => {
    if (!room || !user) return;
    const isHost = room.hostId === user.uid;
    if (!isHost) return;
    if (room.status !== "waiting") return;
    if (room.currentPlayers !== 1) return;
    const t = setTimeout(async () => {
      try {
        const latest = room; // basic guard; subscribe will refresh
        if (latest.currentPlayers === 1 && latest.status === "waiting") {
          console.log("No opponent joined in 5s, adding AI bot...");
          await addBotOpponent(latest.id);
        }
      } catch (e) {
        console.error("Failed to add AI bot:", e);
      }
    }, 5000);
    return () => clearTimeout(t);
  }, [room?.id, room?.currentPlayers, room?.status, user?.uid]);

  const handleLeave = async () => {
    if (!user || !roomId) return;

    Alert.alert("Leave Room", "Are you sure you want to leave?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Leave",
        style: "destructive",
        onPress: async () => {
          try {
            await leaveBattleRoom(roomId as string, user.uid);
            router.back();
          } catch (error) {
            console.error("Error leaving room:", error);
          }
        },
      },
    ]);
  };

  const handleToggleReady = async () => {
    if (!user || !roomId) return;

    try {
      await setPlayerReady(roomId as string, user.uid, !isReady);
      setIsReady(!isReady);
    } catch (error) {
      console.error("Error toggling ready:", error);
      Alert.alert("Error", "Failed to update ready status");
    }
  };

  const handleStart = async () => {
    if (!user || !roomId || !room) return;

    const allReady = room.players.every((p) => p.isReady);
    if (!allReady) {
      Alert.alert("Not Ready", "All players must be ready to start");
      return;
    }

    if (room.players.length < 2) {
      Alert.alert("Not Enough Players", "Wait for more players to join");
      return;
    }

    try {
      setGeneratingQuestions(true);

      const questionPromises = Array.from({ length: 10 }).map(() =>
        trpcClient.questions.generate.mutate({
          topic: room.topic,
          difficulty: room.difficulty as "easy" | "medium" | "hard" | "challenge",
          language: "English",
        })
      );

      const questionData = await Promise.all(questionPromises);
      const questionIds = questionData.map((q) => q.id);

      await startBattle(roomId as string, questionIds);

      await initMatchNode({
        roomId: roomId as string,
        players: room.players.map((p) => p.uid),
        topic: room.topic,
        difficulty: room.difficulty,
      });

      router.replace(`/battle-quiz?roomId=${roomId}`);
    } catch (error) {
      console.error("Error starting battle:", error);
      Alert.alert("Error", "Failed to start battle. Please try again.");
      setGeneratingQuestions(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={{ height: insets.top, backgroundColor: Colors.background }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading room...</Text>
        </View>
      </View>
    );
  }

  if (!room) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={{ height: insets.top, backgroundColor: Colors.background }} />
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>Room not found</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Back to Lobby</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const isHost = room.hostId === user?.uid;
  const allReady = room.players.every((p) => p.isReady);
  const canStart = isHost && allReady && room.players.length >= 2;

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={{ height: insets.top, backgroundColor: Colors.background }} />

      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={handleLeave}>
          <ArrowLeft size={20} color={Colors.primary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Battle Room</Text>
          <Text style={styles.headerSubtitle}>{room.name}</Text>
        </View>
        <View style={styles.headerButton} />
      </View>

      <View style={styles.content}>
        <View style={styles.roomInfo}>
          <View style={styles.infoCard}>
            <Trophy size={20} color={Colors.accent} />
            <Text style={styles.infoText}>{room.topic}</Text>
          </View>
          <View style={styles.infoCard}>
            <Zap size={20} color={Colors.secondary} />
            <Text style={styles.infoText}>{room.difficulty}</Text>
          </View>
        </View>

        <View style={styles.playersSection}>
          <View style={styles.playersSectionHeader}>
            <Users size={20} color={Colors.primary} />
            <Text style={styles.playersSectionTitle}>
              Players ({room.currentPlayers}/{room.maxPlayers})
            </Text>
          </View>

          <View style={styles.playersGrid}>
            {room.players.map((player) => (
              <PlayerCard
                key={player.uid}
                player={player}
                isHost={player.uid === room.hostId}
                isCurrentUser={player.uid === user?.uid}
              />
            ))}
            {Array.from({ length: room.maxPlayers - room.players.length }).map((_, index) => (
              <EmptyPlayerSlot key={`empty-${index}`} />
            ))}
          </View>
        </View>

        {generatingQuestions && (
          <View style={styles.generatingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.generatingText}>Generating AI questions...</Text>
          </View>
        )}
      </View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        {!isHost ? (
          <TouchableOpacity
            style={[
              styles.readyButton,
              isReady && styles.readyButtonActive,
            ]}
            onPress={handleToggleReady}
            disabled={generatingQuestions}
          >
            <LinearGradient
              colors={
                isReady
                  ? [Colors.primary, "#14b8a6"]
                  : [Colors.surfaceLight, Colors.surface]
              }
              style={styles.readyButtonGradient}
            >
              {isReady ? (
                <>
                  <Check size={24} color="#000" />
                  <Text style={styles.readyButtonTextActive}>Ready!</Text>
                </>
              ) : (
                <>
                  <Clock size={24} color={Colors.text} />
                  <Text style={styles.readyButtonText}>Ready?</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.startButton, !canStart && styles.startButtonDisabled]}
            onPress={handleStart}
            disabled={!canStart || generatingQuestions}
          >
            <LinearGradient
              colors={
                canStart
                  ? [Colors.primary, "#14b8a6"]
                  : [Colors.surfaceLight, Colors.surface]
              }
              style={styles.startButtonGradient}
            >
              {generatingQuestions ? (
                <ActivityIndicator color={canStart ? "#000" : Colors.textSecondary} />
              ) : (
                <>
                  <Zap size={24} color={canStart ? "#000" : Colors.textSecondary} />
                  <Text
                    style={[
                      styles.startButtonText,
                      !canStart && styles.startButtonTextDisabled,
                    ]}
                  >
                    Start Battle
                  </Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.surfaceLight,
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: {
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: Colors.text,
  },
  headerSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  roomInfo: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  infoCard: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  infoText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.text,
    textTransform: "capitalize" as const,
  },
  playersSection: {
    flex: 1,
  },
  playersSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  playersSectionTitle: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.text,
  },
  playersGrid: {
    gap: 12,
  },
  playerCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  playerAvatarWrapper: {
    position: "relative",
  },
  playerAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  readyBadge: {
    position: "absolute",
    bottom: -4,
    right: -4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  hostBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#fbbf24",
    alignItems: "center",
    justifyContent: "center",
  },
  playerName: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.text,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusReady: {
    backgroundColor: "rgba(34, 197, 94, 0.2)",
  },
  statusWaiting: {
    backgroundColor: Colors.surfaceLight,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: Colors.text,
  },
  emptySlot: {
    justifyContent: "center",
  },
  emptyAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.surfaceLight,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    flex: 1,
    fontSize: 14,
    color: Colors.textSecondary,
  },
  generatingContainer: {
    alignItems: "center",
    gap: 12,
    paddingVertical: 24,
  },
  generatingText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: "600" as const,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  readyButton: {
    borderRadius: 12,
    overflow: "hidden",
  },
  readyButtonActive: {
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 8,
  },
  readyButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    gap: 12,
  },
  readyButtonText: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: Colors.text,
  },
  readyButtonTextActive: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: "#000",
  },
  startButton: {
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 8,
  },
  startButtonDisabled: {
    shadowOpacity: 0,
    elevation: 0,
  },
  startButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    gap: 12,
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: "#000",
  },
  startButtonTextDisabled: {
    color: Colors.textSecondary,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  errorText: {
    fontSize: 16,
    color: Colors.error,
  },
  backButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#000",
  },
});
