import React from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Animated,
  Dimensions,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Zap, Sword, Trophy } from "lucide-react-native";
import Colors from "@/constants/colors";
import GradientButton from "@/components/GradientButton";
import { useEffect, useRef } from "react";

const { height } = Dimensions.get("window");

export default function WelcomeScreen() {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <LinearGradient
        colors={[Colors.background, Colors.surface, Colors.background]}
        style={styles.gradient}
      >
        <SafeAreaView style={styles.safeArea}>
          <Animated.View
            style={[
              styles.content,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <View style={styles.header}>
              <View style={styles.iconContainer}>
                <Zap size={60} color={Colors.primary} strokeWidth={2.5} />
              </View>
              <Text style={styles.title}>Quiz Battle AI</Text>
              <Text style={styles.subtitle}>
                Challenge Your Mind{"\n"}Battle with Friends{"\n"}Powered by AI
              </Text>
            </View>

            <View style={styles.features}>
              <View style={styles.feature}>
                <Sword size={32} color={Colors.primary} />
                <Text style={styles.featureText}>Epic Battles</Text>
              </View>
              <View style={styles.feature}>
                <Zap size={32} color={Colors.secondary} />
                <Text style={styles.featureText}>AI Questions</Text>
              </View>
              <View style={styles.feature}>
                <Trophy size={32} color={Colors.accent} />
                <Text style={styles.featureText}>Climb Ranks</Text>
              </View>
            </View>

            <View style={styles.buttons}>
              <GradientButton
                title="Get Started"
                onPress={() => router.push("/register" as any)}
                style={styles.button}
              />
              <GradientButton
                title="Sign In"
                onPress={() => router.push("/login" as any)}
                variant="secondary"
                style={styles.button}
              />
            </View>
          </Animated.View>
        </SafeAreaView>
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
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: "space-between",
    paddingTop: height * 0.1,
    paddingBottom: 40,
  },
  header: {
    alignItems: "center",
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.surfaceLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
    borderWidth: 2,
    borderColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 10,
  },
  title: {
    fontSize: 42,
    fontWeight: "800" as const,
    color: Colors.text,
    textAlign: "center",
    marginBottom: 16,
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 24,
  },
  features: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 40,
  },
  feature: {
    alignItems: "center",
    gap: 8,
  },
  featureText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: "600" as const,
  },
  buttons: {
    gap: 16,
  },
  button: {
    width: "100%",
  },
});
