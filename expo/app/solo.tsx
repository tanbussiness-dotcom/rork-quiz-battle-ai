import React, { useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Animated,
  Modal,
  Platform,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import {
  ArrowLeft,
  FlaskConical,
  Calculator,
  Landmark,
  Globe,
  BookOpen,
  Palette,
  Trophy,
  Music,
  Film,
  Lightbulb,
} from "lucide-react-native";
import Colors from "@/constants/colors";
import GlowingCard from "@/components/GlowingCard";
import { QUIZ_TOPICS, DIFFICULTY_LEVELS, DifficultyLevel } from "@/constants/topics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";

const ICON_MAP = {
  history: Landmark,
  science: FlaskConical,
  math: Calculator,
  geography: Globe,
  literature: BookOpen,
  art: Palette,
  sports: Trophy,
  music: Music,
  movies: Film,
  general: Lightbulb,
} as const;

type IconKey = keyof typeof ICON_MAP;

export default function SoloTopicSelectionScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);

  const bounceAnim = useRef(new Animated.Value(0)).current;

  const openDifficulty = async (topicId: string) => {
    if (Platform.OS !== "web") {
      await Haptics.selectionAsync();
    } else {
      console.log("Open difficulty for", topicId);
    }
    setSelectedTopicId(topicId);
    setModalVisible(true);
    bounceAnim.setValue(0);
    Animated.timing(bounceAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
      easing: (t) => {
        const c1 = 1.70158;
        const c3 = c1 + 1;
        return t < 0.5
          ? (Math.pow(2 * t, 2) * ((c3) * 2 * t - c1)) / 2
          : (Math.pow(2 * t - 2, 2) * ((c3) * (t * 2 - 2) + c1) + 2) / 2;
      },
    }).start();
  };

  const closeModal = () => {
    setModalVisible(false);
  };

  const startWithDifficulty = async (level: DifficultyLevel) => {
    const topic = selectedTopicId ?? "general";
    if (Platform.OS !== "web") {
      await Haptics.selectionAsync();
    }
    router.push(`/quiz?topic=${topic}&difficulty=${level}` as any);
    setModalVisible(false);
  };

  return (
    <View style={styles.container} testID="choose-topic-screen">
      <Stack.Screen options={{ headerShown: false }} />
      <LinearGradient colors={[Colors.background, Colors.surface]} style={styles.gradient}>
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 20 }]}
          showsVerticalScrollIndicator={false}
        >
          <Pressable style={styles.backButton} onPress={() => router.back()} testID="back-btn">
            <ArrowLeft size={24} color={Colors.text} />
          </Pressable>

          <Text style={styles.title}>Choose Topic</Text>
          <Text style={styles.subtitle}>Select a category to start your solo challenge</Text>

          <View style={styles.grid2}>
            {QUIZ_TOPICS.map((t) => (
              <TopicCard key={t.id} id={t.id} label={t.name} onPress={() => openDifficulty(t.id)} />
            ))}
          </View>
        </ScrollView>
      </LinearGradient>

      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={closeModal}>
        <Pressable style={styles.modalOverlay} onPress={(e) => e.target === e.currentTarget && closeModal()}>
          <Animated.View
            style={[
              styles.modalCard,
              {
                transform: [
                  { scale: bounceAnim.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] }) },
                  { translateY: bounceAnim.interpolate({ inputRange: [0, 1], outputRange: [40, 0] }) },
                ],
              },
            ]}
            testID="difficulty-modal"
          >
            <Text style={styles.modalTitle}>
              {QUIZ_TOPICS.find((t) => t.id === selectedTopicId)?.name ?? "Select Topic"}
            </Text>
            <Text style={styles.modalSubtitle}>Choose your difficulty level</Text>

            <View style={styles.difficultyList}>
              {DIFFICULTY_LEVELS.map((lvl) => (
                <Pressable
                  key={lvl}
                  onPress={() => startWithDifficulty(lvl)}
                  style={({ pressed }) => [styles.diffBtn, pressed && styles.diffPressed]}
                  testID={`difficulty-btn-${lvl.toLowerCase()}`}
                >
                  <Text style={styles.diffText}>{lvl}</Text>
                  <Text style={styles.diffHint}>
                    {lvl === "Easy"
                      ? "Perfect for beginners"
                      : lvl === "Medium"
                      ? "Good challenge level"
                      : lvl === "Hard"
                      ? "For experts only"
                      : "Ultimate test"}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Pressable onPress={closeModal} style={styles.cancelBtn} testID="modal-cancel">
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
          </Animated.View>
        </Pressable>
      </Modal>
    </View>
  );
}

function TopicCard({ id, label, onPress }: { id: string; label: string; onPress: () => void }) {
  const hover = useRef(new Animated.Value(0)).current;
  const tilt = hover.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "5deg"] });
  const scale = hover.interpolate({ inputRange: [0, 1], outputRange: [1, 1.03] });
  const glowOpacity = hover.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });
  const IconComp = (ICON_MAP[id as IconKey] ?? Lightbulb) as React.ComponentType<{ color?: string; size?: number }>;

  const onHoverIn = () => {
    if (Platform.OS === "web") Animated.timing(hover, { toValue: 1, duration: 160, useNativeDriver: true }).start();
  };
  const onHoverOut = () => {
    if (Platform.OS === "web") Animated.timing(hover, { toValue: 0, duration: 160, useNativeDriver: true }).start();
  };

  return (
    <Pressable
      onPress={onPress}
      onHoverIn={onHoverIn}
      onHoverOut={onHoverOut}
      android_ripple={{ color: "rgba(0,0,0,0.2)" }}
      style={styles.topicPressable}
      testID={`topic-card-${id}`}
    >
      <Animated.View style={[styles.topicCard, { transform: [{ scale }] }]}> 
        <Animated.View style={[styles.iconWrap, { transform: [{ rotate: tilt }] }]}> 
          <IconComp size={28} color={Colors.primary} />
        </Animated.View>
        <Text style={styles.topicName}>{label}</Text>
        <Animated.View style={[styles.glowUnder, { opacity: glowOpacity }]} />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  gradient: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 40 },
  backButton: { marginBottom: 20, width: 40 },
  title: { fontSize: 28, fontWeight: "800" as const, color: Colors.text },
  subtitle: { fontSize: 14, color: Colors.textSecondary, marginTop: 6, marginBottom: 20 },
  grid2: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", rowGap: 12, columnGap: 12 },
  topicPressable: { width: "48%" },
  topicCard: {
    backgroundColor: Colors.surfaceLight,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 18,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0b0f14",
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 10,
  },
  glowUnder: {
    position: "absolute",
    inset: 0 as unknown as number,
    borderRadius: 16,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 18,
  },
  topicName: { color: Colors.text, fontWeight: "700" as const, textAlign: "center" },

  modalOverlay: { flex: 1, backgroundColor: Colors.overlay, alignItems: "center", justifyContent: "center", padding: 20 },
  modalCard: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: Colors.surfaceLight,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 20,
  },
  modalTitle: { fontSize: 22, fontWeight: "800" as const, color: Colors.text, textAlign: "center" },
  modalSubtitle: { fontSize: 13, color: Colors.textSecondary, textAlign: "center", marginTop: 6, marginBottom: 12 },
  difficultyList: { gap: 10, marginTop: 4 },
  diffBtn: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  diffPressed: { borderColor: Colors.primary },
  diffText: { color: Colors.text, fontSize: 16, fontWeight: "700" as const },
  diffHint: { color: Colors.textSecondary, fontSize: 12, marginTop: 2 },
  cancelBtn: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: "center",
  },
  cancelText: { color: Colors.textSecondary, fontWeight: "600" as const },
});
