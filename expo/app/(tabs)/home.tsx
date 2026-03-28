import React, { useEffect, useMemo, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Animated,
  Easing,
  Platform,
  useWindowDimensions,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import {
  Bell,
  Brain,
  Gamepad2,
  Sword,
  Trophy,
  CalendarCheck,
  Star,
  Check,
} from "lucide-react-native";
import Colors from "@/constants/colors";
import { useUserProfile } from "@/contexts/UserProfileContext";
import { useAuth } from "@/contexts/AuthContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const PARTICLE_COUNT = 10;

export default function HomeScreen() {
  const router = useRouter();
  const { profile } = useUserProfile();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const isSmallScreen = windowWidth < 375;
  const isMediumScreen = windowWidth >= 375 && windowWidth < 768;

  const xpAnim = useRef(new Animated.Value(0)).current;
  const particleAnims = useMemo(
    () => Array.from({ length: PARTICLE_COUNT }, () => new Animated.Value(0)),
    []
  );

  useEffect(() => {
    Animated.timing(xpAnim, {
      toValue: 1,
      duration: 1800,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [xpAnim]);

  useEffect(() => {
    particleAnims.forEach((v, i) => {
      const loop = () => {
        v.setValue(0);
        Animated.timing(v, {
          toValue: 1,
          duration: 14000 + i * 500,
          easing: Easing.linear,
          useNativeDriver: true,
        }).start(({ finished }) => {
          if (finished) loop();
        });
      };
      const delay = 300 * i;
      const id = setTimeout(loop, delay);
      return () => clearTimeout(id);
    });
  }, [particleAnims]);

  const xpTarget = Math.min(1, (profile?.rankPoints ?? 7500) / 10000);
  const xpWidth = xpAnim.interpolate({ inputRange: [0, 1], outputRange: ["0%", `${Math.round(xpTarget * 100)}%`] });

  return (
    <View style={styles.container} testID="home-screen">
      <Stack.Screen options={{ headerShown: false }} />
      <LinearGradient colors={[Colors.background, Colors.surface]} style={styles.gradient}>
        <View style={styles.particlesLayer} pointerEvents="none">
          {particleAnims.map((anim, idx) => {
            const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [Platform.OS === "web" ? 600 : 800, -100] });
            const rotate = anim.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });
            const sizes = [2, 3, 4];
            const size = sizes[idx % sizes.length];
            const left = (idx * 9 + 10) % 90;
            const opacity = 0.3 + (idx % 4) * 0.1;
            return (
              <Animated.View
                key={`p-${idx}`}
                style={{
                  position: "absolute",
                  left: `${left}%`,
                  bottom: -50,
                  width: size,
                  height: size,
                  borderRadius: size / 2,
                  backgroundColor: idx % 2 === 0 ? "#22d3ee" : "#34d399",
                  opacity,
                  transform: [{ translateY }, { rotate }],
                }}
              />
            );
          })}
        </View>

        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 8 }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <View style={styles.brandLeft}>
              <View style={styles.brandIcon}>
                <Brain size={18} color="#000" />
              </View>
              <Text style={styles.brandText}>Quiz Battle AI</Text>
            </View>
            <View style={styles.headerRight}>
              <TouchableOpacity accessibilityRole="button" testID="bell-button" style={styles.iconBtn} onPress={() => console.log("Bell pressed")}
              >
                <Bell size={18} color="#9CA3AF" />
              </TouchableOpacity>
              <Image
                source={{ uri: user?.photoURL ?? "https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-3.jpg" }}
                style={styles.avatar}
                resizeMode="cover"
              />
            </View>
          </View>

          <View style={styles.centerGreeting}>
            <View style={styles.waveRow}>
              <Text style={styles.wave} accessibilityLabel="wave">👋</Text>
              <Text style={styles.welcome}>Welcome back, {profile?.displayName ?? "Player"}!</Text>
            </View>
            <Text style={styles.subtitle}>Ready for your next challenge?</Text>
          </View>

          <View style={styles.levelCard}>
            <View style={styles.levelHeaderRow}>
              <View>
                <Text style={styles.levelTitle}>Level {profile?.level ?? 12}</Text>
                <Text style={styles.levelSub}>Quiz Master</Text>
              </View>
              <View style={styles.xpRight}>
                <Text style={styles.xpValue}>{profile?.rankPoints ?? 7500}</Text>
                <Text style={styles.xpLabel}>XP</Text>
              </View>
            </View>
            <View style={styles.progressTrack}>
              <Animated.View style={[styles.progressFill, { width: xpWidth }]} />
            </View>
            <View style={styles.progressLabels}>
              <Text style={styles.progressText}>{profile?.rankPoints ?? 7500} XP</Text>
              <Text style={styles.progressText}>10,000 XP</Text>
            </View>
          </View>

          <View style={styles.grid}>
            <TouchableOpacity
              style={styles.tile}
              activeOpacity={0.9}
              onPress={() => router.push("/solo" as any)}
              testID="solo-tile"
            >
              <View style={[styles.tileIcon, { backgroundColor: "#3b82f6" }]}> 
                <Gamepad2 size={22} color="#fff" />
              </View>
              <Text style={styles.tileTitle}>Solo Play</Text>
              <Text style={styles.tileSub}>Practice alone</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.tile}
              activeOpacity={0.9}
              onPress={() => router.push("/quiz" as any)}
              testID="battle-tile"
            >
              <View style={[styles.tileIcon, { backgroundColor: "#10b981" }]}> 
                <Sword size={22} color="#fff" />
              </View>
              <Text style={styles.tileTitle}>Battle Mode</Text>
              <Text style={styles.tileSub}>Challenge others</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.tile}
              activeOpacity={0.9}
              onPress={() => router.push("/leaderboard" as any)}
              testID="leaderboard-tile"
            >
              <View style={[styles.tileIcon, { backgroundColor: "#f59e0b" }]}> 
                <Trophy size={22} color="#fff" />
              </View>
              <Text style={styles.tileTitle}>Leaderboard</Text>
              <Text style={styles.tileSub}>Top players</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.tile}
              activeOpacity={0.9}
              onPress={() => console.log("Daily mission")}
              testID="mission-tile"
            >
              <View style={[styles.tileIcon, { backgroundColor: "#8b5cf6" }]}> 
                <CalendarCheck size={22} color="#fff" />
              </View>
              <Text style={styles.tileTitle}>Daily Mission</Text>
              <Text style={styles.tileSub}>Earn rewards</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Todays Stats</Text>
            <View style={styles.statsRow3}>
              <View style={styles.statBox}>
                <Text style={[styles.statNumber, { color: "#10b981" }]}>5</Text>
                <Text style={styles.statCaption}>Games Won</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={[styles.statNumber, { color: "#60a5fa" }]}>12</Text>
                <Text style={styles.statCaption}>Questions</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={[styles.statNumber, { color: "#a78bfa" }]}>85%</Text>
                <Text style={styles.statCaption}>Accuracy</Text>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            <View style={styles.activityRow}>
              <View style={styles.activityLeft}>
                <View style={[styles.activityIcon, { backgroundColor: "#10b981" }]}>
                  <Check size={14} color="#fff" />
                </View>
                <View>
                  <Text style={styles.activityTitle}>Science Quiz</Text>
                  <Text style={styles.activitySub}>Won • +250 XP</Text>
                </View>
              </View>
              <Text style={styles.activityTime}>2h ago</Text>
            </View>

            <View style={styles.activityRow}>
              <View style={styles.activityLeft}>
                <View style={[styles.activityIcon, { backgroundColor: "#3b82f6" }]}>
                  <Star size={14} color="#fff" />
                </View>
                <View>
                  <Text style={styles.activityTitle}>Daily Mission</Text>
                  <Text style={styles.activitySub}>Completed • +100 XP</Text>
                </View>
              </View>
              <Text style={styles.activityTime}>4h ago</Text>
            </View>
          </View>
        </ScrollView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  gradient: { flex: 1 },
  particlesLayer: { position: "absolute", inset: 0 as unknown as number },
  scrollContent: { padding: 20, paddingBottom: 32, gap: 16 },

  header: {
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  brandLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  brandIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: Colors.secondary,
    alignItems: "center",
    justifyContent: "center",
  },
  brandText: {
    fontSize: 18,
    fontWeight: "700" as const,
    backgroundColor: "transparent",
    color: Colors.text,
  },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 12 },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: Colors.surfaceLight,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: Colors.secondary,
  },

  centerGreeting: { alignItems: "center", marginTop: 8 },
  waveRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 },
  wave: { fontSize: 24 },
  welcome: { fontSize: 20, fontWeight: "600" as const, color: Colors.text },
  subtitle: { color: Colors.textSecondary, fontSize: 14 },

  levelCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  levelHeaderRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 12 },
  levelTitle: { color: Colors.primary, fontSize: 16, fontWeight: "700" as const },
  levelSub: { color: "#9CA3AF", fontSize: 12 },
  xpRight: { alignItems: "flex-end" },
  xpValue: { color: Colors.primary, fontSize: 22, fontWeight: "800" as const },
  xpLabel: { color: "#9CA3AF", fontSize: 12 },
  progressTrack: { height: 12, backgroundColor: Colors.surfaceLight, borderRadius: 999, overflow: "hidden" },
  progressFill: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: Colors.primary,
    borderRadius: 999,
  },
  progressLabels: { flexDirection: "row", justifyContent: "space-between", marginTop: 6 },
  progressText: { color: "#9CA3AF", fontSize: 12 },

  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  tile: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    width: "48%",
  },
  tileIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  tileTitle: { color: Colors.text, fontWeight: "600" as const },
  tileSub: { color: Colors.textSecondary, fontSize: 12, marginTop: 2 },

  section: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sectionTitle: { color: Colors.primary, fontSize: 16, fontWeight: "700" as const, marginBottom: 12 },
  statsRow3: { flexDirection: "row", justifyContent: "space-between" },
  statBox: { alignItems: "center", flex: 1 },
  statNumber: { fontSize: 22, fontWeight: "800" as const },
  statCaption: { color: "#9CA3AF", fontSize: 12 },

  activityRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  activityLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  activityIcon: { width: 32, height: 32, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  activityTitle: { color: Colors.text, fontSize: 14, fontWeight: "600" as const },
  activitySub: { color: Colors.textSecondary, fontSize: 12 },
  activityTime: { color: "#6B7280", fontSize: 12 },
});
