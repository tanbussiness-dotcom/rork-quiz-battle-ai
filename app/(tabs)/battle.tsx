import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  Animated,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Stack, router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Gamepad2,
  Zap,
  Plus,
  DoorOpen,
  Crown,
  File,
  Star,
  Globe,
  Lock,
  Sword,
} from "lucide-react-native";
import Colors from "@/constants/colors";
import { useAuth } from "@/contexts/AuthContext";
import {
  createBattleRoom,
  joinBattleRoom,
} from "@/services/battle.service";
import { ref, onValue, off } from "firebase/database";
import { realtimeDb } from "@/lib/firebase";
import type { BattleRoom } from "@/models";

interface RoomCardProps {
  room: BattleRoom;
  isNew: boolean;
  onJoin: (room: BattleRoom) => void;
}

function RoomCard({ room, isNew, onJoin }: RoomCardProps) {
  const slideAnim = useRef(new Animated.Value(100)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 500,
      useNativeDriver: true,
    }).start();

    if (isNew) {
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: false,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: false,
        }),
      ]).start();
    }
  }, [slideAnim, glowAnim, isNew]);

  const borderColor = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [Colors.border, Colors.primary],
  });

  const iconColors: Record<string, [string, string]> = {
    crown: ["#a855f7", "#ec4899"],
    fire: ["#ef4444", "#f97316"],
    star: ["#3b82f6", "#06b6d4"],
    sword: ["#10b981", "#14b8a6"],
  };

  const iconType = room.hostName.toLowerCase().includes("pro")
    ? "crown"
    : room.hostName.toLowerCase().includes("fire")
    ? "fire"
    : room.currentPlayers > 2
    ? "star"
    : "sword";

  const Icon =
    iconType === "crown"
      ? Crown
      : iconType === "fire"
      ? File
      : iconType === "star"
      ? Star
      : Sword;

  return (
    <Animated.View
      style={[
        styles.roomCard,
        { transform: [{ translateX: slideAnim }], borderColor },
      ]}
    >
      <View style={styles.roomHeader}>
        <View style={styles.roomInfo}>
          <LinearGradient
            colors={iconColors[iconType]}
            style={styles.roomIcon}
          >
            <Icon size={20} color="#fff" />
          </LinearGradient>
          <View style={{ flex: 1 }}>
            <Text style={styles.roomName} numberOfLines={1}>
              {room.name}
            </Text>
            <Text style={styles.roomCreator} numberOfLines={1}>
              Created by {room.hostName}
            </Text>
          </View>
        </View>
        <View style={styles.roomPlayers}>
          <Text style={styles.roomPlayersCount}>
            {room.currentPlayers}/{room.maxPlayers}
          </Text>
          <Text style={styles.roomPlayersLabel}>players</Text>
        </View>
      </View>
      <View style={styles.roomFooter}>
        <View style={styles.roomStatus}>
          {room.isPublic ? (
            <>
              <Globe size={12} color={Colors.primary} />
              <Text style={styles.roomStatusText}>Public</Text>
            </>
          ) : (
            <>
              <Lock size={12} color="#f59e0b" />
              <Text style={styles.roomStatusText}>Private</Text>
            </>
          )}
          {isNew && <View style={styles.newBadge}><Text style={styles.newBadgeText}>NEW</Text></View>}
        </View>
        <TouchableOpacity
          style={styles.joinButton}
          onPress={() => onJoin(room)}
          disabled={room.currentPlayers >= room.maxPlayers}
        >
          <Text style={styles.joinButtonText}>
            {room.currentPlayers >= room.maxPlayers ? "Full" : "Join"}
          </Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

export default function BattleLobbyScreen() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [rooms, setRooms] = useState<BattleRoom[]>([]);
  const [newRoomIds, setNewRoomIds] = useState<Set<string>>(new Set());
  const [isAutoMatching, setIsAutoMatching] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [createForm, setCreateForm] = useState({ name: "", password: "" });
  const [joinForm, setJoinForm] = useState({ roomId: "", password: "" });
  const [loading, setLoading] = useState(false);
  const spinAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const roomsRef = ref(realtimeDb, "battle_rooms");
    const listener = onValue(roomsRef, (snapshot) => {
      if (snapshot.exists()) {
        const roomsData = snapshot.val() as Record<string, BattleRoom>;
        const roomsList = Object.values(roomsData)
          .filter((room) => room.status === "waiting")
          .sort((a, b) => b.createdAt - a.createdAt);

        setRooms((prevRooms) => {
          const existingIds = new Set(prevRooms.map((r) => r.id));
          const newIds = new Set<string>();
          roomsList.forEach((room) => {
            if (!existingIds.has(room.id)) {
              newIds.add(room.id);
            }
          });

          if (newIds.size > 0) {
            setNewRoomIds(newIds);
            setTimeout(() => {
              setNewRoomIds(new Set());
            }, 3000);
          }

          return roomsList;
        });
      } else {
        setRooms([]);
      }
    });

    return () => off(roomsRef, "value", listener);
  }, []);

  useEffect(() => {
    if (isAutoMatching) {
      Animated.loop(
        Animated.timing(spinAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        })
      ).start();
    } else {
      spinAnim.setValue(0);
    }
  }, [isAutoMatching, spinAnim]);

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const handleAutoMatch = async () => {
    if (!user) return;
    setIsAutoMatching(true);
    
    try {
      const publicRooms = rooms.filter(
        (r) => r.isPublic && r.currentPlayers < r.maxPlayers
      );

      if (publicRooms.length > 0) {
        const randomRoom =
          publicRooms[Math.floor(Math.random() * publicRooms.length)];
        await joinBattleRoom(
          randomRoom.id,
          user.uid,
          user.displayName || "Player"
        );
        router.push(`/battle-room?roomId=${randomRoom.id}`);
      } else {
        Alert.alert(
          "No rooms available",
          "Would you like to create a new room?",
          [
            { text: "Cancel", style: "cancel" },
            { text: "Create", onPress: () => setShowCreateModal(true) },
          ]
        );
      }
    } catch (error) {
      console.error("Auto match error:", error);
      Alert.alert("Error", "Failed to join a room");
    } finally {
      setIsAutoMatching(false);
    }
  };

  const handleCreateRoom = async () => {
    if (!user || !createForm.name.trim()) {
      Alert.alert("Error", "Please enter a room name");
      return;
    }

    setLoading(true);
    try {
      const roomId = await createBattleRoom(
        user.uid,
        user.displayName || "Player",
        {
          name: createForm.name.trim(),
          password: createForm.password.trim() || undefined,
          topic: "general",
          difficulty: "medium",
          maxPlayers: 4,
        }
      );
      setShowCreateModal(false);
      setCreateForm({ name: "", password: "" });
      router.push(`/battle-room?roomId=${roomId}`);
    } catch (error) {
      console.error("Create room error:", error);
      Alert.alert("Error", "Failed to create room");
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRoom = async (room: BattleRoom) => {
    if (!user) return;

    if (!room.isPublic) {
      setJoinForm({ roomId: room.id, password: "" });
      setShowJoinModal(true);
      return;
    }

    try {
      await joinBattleRoom(room.id, user.uid, user.displayName || "Player");
      router.push(`/battle-room?roomId=${room.id}`);
    } catch (error: any) {
      console.error("Join room error:", error);
      Alert.alert("Error", error.message || "Failed to join room");
    }
  };

  const handleJoinWithPassword = async () => {
    if (!user || !joinForm.password.trim()) {
      Alert.alert("Error", "Please enter the password");
      return;
    }

    setLoading(true);
    try {
      await joinBattleRoom(
        joinForm.roomId,
        user.uid,
        user.displayName || "Player",
        joinForm.password.trim()
      );
      setShowJoinModal(false);
      setJoinForm({ roomId: "", password: "" });
      router.push(`/battle-room?roomId=${joinForm.roomId}`);
    } catch (error: any) {
      console.error("Join room error:", error);
      Alert.alert("Error", error.message || "Failed to join room");
    } finally {
      setLoading(false);
    }
  };

  const totalPlayers = rooms.reduce(
    (sum, room) => sum + room.currentPlayers,
    0
  );

  return (
    <View style={styles.container} testID="battle-lobby-screen">
      <Stack.Screen options={{ headerShown: false }} />
      <View style={{ height: insets.top, backgroundColor: Colors.background }} />

      <View style={styles.header}>
        <View style={styles.headerContent}>
          <LinearGradient
            colors={[Colors.primary, Colors.secondary]}
            style={styles.headerIcon}
          >
            <Gamepad2 size={20} color="#000" />
          </LinearGradient>
          <Text style={styles.headerTitle}>Battle Lobby</Text>
        </View>
        <View style={styles.onlineStatus}>
          <View style={styles.onlineDot} />
          <Text style={styles.onlineText}>Online</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.autoMatchButton}
            onPress={handleAutoMatch}
            disabled={isAutoMatching}
          >
            <LinearGradient
              colors={[Colors.primary, Colors.secondary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.autoMatchGradient}
            >
              {isAutoMatching ? (
                <Animated.View style={{ transform: [{ rotate: spin }] }}>
                  <ActivityIndicator color="#000" size="small" />
                </Animated.View>
              ) : (
                <Zap size={24} color="#000" />
              )}
              <Text style={styles.autoMatchText}>
                {isAutoMatching ? "Searching..." : "Auto Match"}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.actionButton, styles.createButton]}
              onPress={() => setShowCreateModal(true)}
            >
              <Plus size={24} color={Colors.primary} />
              <Text style={styles.actionButtonText}>Create Room</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.joinButton2]}
              onPress={() => setShowJoinModal(true)}
            >
              <DoorOpen size={24} color={Colors.secondary} />
              <Text style={styles.actionButtonText}>Join Room</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.roomsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Active Rooms</Text>
            <View style={styles.liveIndicator}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>Live</Text>
            </View>
          </View>

          <View style={styles.roomsList}>
            {rooms.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>
                  No active rooms. Create one to start!
                </Text>
              </View>
            ) : (
              rooms.map((room) => (
                <RoomCard
                  key={room.id}
                  room={room}
                  isNew={newRoomIds.has(room.id)}
                  onJoin={handleJoinRoom}
                />
              ))
            )}
          </View>
        </View>

        <View style={styles.statsSection}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{rooms.length}</Text>
            <Text style={styles.statLabel}>Active Rooms</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: Colors.secondary }]}>
              {totalPlayers}
            </Text>
            <Text style={styles.statLabel}>Players Online</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: "#a855f7" }]}>156</Text>
            <Text style={styles.statLabel}>Battles Today</Text>
          </View>
        </View>
      </ScrollView>

      <Modal
        visible={showCreateModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Create Room</Text>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Room Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter room name"
                placeholderTextColor={Colors.textTertiary}
                value={createForm.name}
                onChangeText={(text) =>
                  setCreateForm({ ...createForm, name: text })
                }
              />
            </View>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Password (Optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter password"
                placeholderTextColor={Colors.textTertiary}
                secureTextEntry
                value={createForm.password}
                onChangeText={(text) =>
                  setCreateForm({ ...createForm, password: text })
                }
              />
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowCreateModal(false);
                  setCreateForm({ name: "", password: "" });
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleCreateRoom}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#000" size="small" />
                ) : (
                  <Text style={styles.confirmButtonText}>Create</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showJoinModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowJoinModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Join Room</Text>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Password</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter password"
                placeholderTextColor={Colors.textTertiary}
                secureTextEntry
                value={joinForm.password}
                onChangeText={(text) =>
                  setJoinForm({ ...joinForm, password: text })
                }
              />
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowJoinModal(false);
                  setJoinForm({ roomId: "", password: "" });
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleJoinWithPassword}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#000" size="small" />
                ) : (
                  <Text style={styles.confirmButtonText}>Join</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: Colors.text,
    textShadowColor: Colors.primary,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  onlineStatus: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  onlineText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  quickActions: {
    gap: 12,
    marginBottom: 24,
  },
  autoMatchButton: {
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8,
  },
  autoMatchGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    gap: 12,
  },
  autoMatchText: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: "#000",
  },
  actionRow: {
    flexDirection: "row",
    gap: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    gap: 8,
  },
  createButton: {
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  joinButton2: {
    borderWidth: 1,
    borderColor: Colors.secondary,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.text,
  },
  roomsSection: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: Colors.textSecondary,
  },
  liveIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  liveText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  roomsList: {
    gap: 12,
  },
  emptyState: {
    padding: 40,
    alignItems: "center",
  },
  emptyStateText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: "center",
  },
  roomCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  roomHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  roomInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  roomIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  roomName: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.text,
  },
  roomCreator: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  roomPlayers: {
    alignItems: "flex-end",
  },
  roomPlayersCount: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.primary,
  },
  roomPlayersLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  roomFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  roomStatus: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  roomStatusText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  newBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  newBadgeText: {
    fontSize: 10,
    fontWeight: "700" as const,
    color: "#000",
  },
  joinButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 8,
  },
  joinButtonText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: "#000",
  },
  statsSection: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-around",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statItem: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: Colors.primary,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 24,
    width: "100%",
    maxWidth: 400,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: Colors.text,
    marginBottom: 20,
    textShadowColor: Colors.primary,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: Colors.text,
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: Colors.surfaceLight,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.textSecondary,
  },
  confirmButton: {
    backgroundColor: Colors.primary,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#000",
  },
});
