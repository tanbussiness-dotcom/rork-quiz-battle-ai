import React, { useRef, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Animated, Platform } from "react-native";
import { Stack } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Swords, Users, Shield } from "lucide-react-native";
import Colors from "@/constants/colors";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function BattleShellScreen() {
  const pulse = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const loop = () => {
      pulse.setValue(0);
      Animated.timing(pulse, { toValue: 1, duration: 1400, useNativeDriver: true }).start(({ finished }) => {
        if (finished) loop();
      });
    };
    loop();
  }, [pulse]);

  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.06] });
  const glow = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.7] });

  return (
    <View style={styles.container} testID="battle-screen">
      <Stack.Screen options={{ headerShown: false }} />
      <LinearGradient colors={[Colors.background, Colors.surface]} style={styles.gradient}>
        <View style={{ height: insets.top }} />
        <View style={styles.header}>
          <View style={styles.iconBadge}>
            <Swords size={28} color="#000" />
          </View>
          <Text style={styles.title}>Battle</Text>
          <Text style={styles.subtitle}>Real-time PvP coming soon</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.cardRow}>
            <Users size={22} color={Colors.primary} />
            <Text style={styles.cardText}>Auto-match with players</Text>
          </View>
          <View style={styles.cardRow}>
            <Shield size={22} color={Colors.secondary} />
            <Text style={styles.cardText}>Fair ELO ranking</Text>
          </View>
        </View>

        <Animated.View style={[styles.ctaWrap, { transform: [{ scale }], shadowOpacity: Platform.OS === 'web' ? 0 : (glow as unknown as number) }]}> 
          <TouchableOpacity activeOpacity={0.9} style={styles.ctaButton} onPress={() => console.log("Find match pressed") } testID="find-match-btn">
            <LinearGradient colors={["#22d3ee", "#34d399"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.ctaGradient}>
              <Text style={styles.ctaText}>Find Match</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  gradient: { flex: 1, padding: 20 },
  header: { alignItems: "center", marginTop: 12 },
  iconBadge: { width: 56, height: 56, borderRadius: 14, backgroundColor: "#22d3ee", alignItems: "center", justifyContent: "center", marginBottom: 12 },
  title: { fontSize: 28, fontWeight: "800" as const, color: Colors.text },
  subtitle: { fontSize: 14, color: Colors.textSecondary, marginTop: 4 },
  card: { backgroundColor: "#0b0f14", borderRadius: 16, padding: 16, borderWidth: 1, borderColor: "#1f2937", marginTop: 24, gap: 12 },
  cardRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  cardText: { color: Colors.text, fontSize: 14, fontWeight: "600" as const },
  ctaWrap: { marginTop: 32, shadowColor: "#22d3ee", shadowOffset: { width: 0, height: 0 }, shadowRadius: 16 },
  ctaButton: { borderRadius: 16, overflow: "hidden" },
  ctaGradient: { paddingVertical: 16, alignItems: "center" },
  ctaText: { color: "#000", fontSize: 16, fontWeight: "800" as const },
});
