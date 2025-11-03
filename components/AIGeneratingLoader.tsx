import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated, Easing } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Brain, Sparkles, Zap } from "lucide-react-native";
import Colors from "@/constants/colors";

interface AIGeneratingLoaderProps {
  message?: string;
  subMessage?: string;
}

export default function AIGeneratingLoader({ 
  message = "Generating AI Questions...",
  subMessage = "Creating personalized quiz content"
}: AIGeneratingLoaderProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const sparkleAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const particleAnims = useRef(
    Array.from({ length: 6 }, () => new Animated.Value(0))
  ).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.15,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 3000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(sparkleAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(sparkleAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(progressAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
        Animated.timing(progressAnim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: false,
        }),
      ])
    ).start();

    particleAnims.forEach((anim, i) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 200),
          Animated.timing(anim, {
            toValue: 1,
            duration: 2000,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      ).start();
    });
  }, [pulseAnim, rotateAnim, sparkleAnim, progressAnim, particleAnims]);

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.background, Colors.surface]}
        style={styles.gradient}
      >
        <View style={styles.particlesContainer}>
          {particleAnims.map((anim, i) => {
            const translateY = anim.interpolate({
              inputRange: [0, 1],
              outputRange: [0, -120],
            });
            const opacity = anim.interpolate({
              inputRange: [0, 0.5, 1],
              outputRange: [0, 1, 0],
            });
            const left = (i * 15 + 10) % 80;

            return (
              <Animated.View
                key={`particle-${i}`}
                style={[
                  styles.particle,
                  {
                    left: `${left}%`,
                    opacity,
                    transform: [{ translateY }],
                  },
                ]}
              />
            );
          })}
        </View>

        <View style={styles.content}>
          <Animated.View
            style={[
              styles.iconContainer,
              {
                transform: [{ scale: pulseAnim }, { rotate }],
              },
            ]}
          >
            <LinearGradient
              colors={[Colors.primary, Colors.secondary]}
              style={styles.iconGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Brain size={48} color="#000" />
            </LinearGradient>
          </Animated.View>

          <View style={styles.sparkleContainer}>
            <Animated.View
              style={[
                styles.sparkle,
                { opacity: sparkleAnim, left: 20, top: 10 },
              ]}
            >
              <Sparkles size={16} color={Colors.primary} />
            </Animated.View>
            <Animated.View
              style={[
                styles.sparkle,
                { 
                  opacity: sparkleAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 0],
                  }), 
                  right: 20, 
                  top: 30 
                },
              ]}
            >
              <Zap size={14} color={Colors.secondary} />
            </Animated.View>
            <Animated.View
              style={[
                styles.sparkle,
                { opacity: sparkleAnim, right: 40, bottom: 20 },
              ]}
            >
              <Sparkles size={12} color={Colors.accent} />
            </Animated.View>
          </View>

          <Text style={styles.loadingText}>{message}</Text>
          <Text style={styles.subText}>{subMessage}</Text>

          <View style={styles.progressBarContainer}>
            <View style={styles.progressBarTrack}>
              <Animated.View
                style={[
                  styles.progressBarFill,
                  {
                    width: progressWidth,
                  },
                ]}
              >
                <LinearGradient
                  colors={[Colors.primary, Colors.secondary]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.progressBarGradient}
                />
              </Animated.View>
            </View>
            <View style={styles.dotsContainer}>
              {[0, 1, 2].map((i) => (
                <Animated.View
                  key={`dot-${i}`}
                  style={[
                    styles.dot,
                    {
                      opacity: sparkleAnim.interpolate({
                        inputRange: [0, 0.5, 1],
                        outputRange: i === 0 ? [1, 0.3, 1] : i === 1 ? [0.3, 1, 0.3] : [1, 0.3, 1],
                      }),
                    },
                  ]}
                />
              ))}
            </View>
          </View>

          <View style={styles.tipsContainer}>
            <Text style={styles.tipText}>
              💡 Questions are tailored to your skill level
            </Text>
          </View>
        </View>
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
  particlesContainer: {
    position: "absolute",
    inset: 0 as unknown as number,
  },
  particle: {
    position: "absolute",
    bottom: 0,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.primary,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  iconContainer: {
    marginBottom: 32,
  },
  iconGradient: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 30,
    elevation: 10,
  },
  sparkleContainer: {
    position: "absolute",
    width: 200,
    height: 200,
    alignItems: "center",
    justifyContent: "center",
  },
  sparkle: {
    position: "absolute",
  },
  loadingText: {
    fontSize: 24,
    fontWeight: "800" as const,
    color: Colors.text,
    textAlign: "center",
    marginBottom: 8,
  },
  subText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: "center",
    marginBottom: 32,
  },
  progressBarContainer: {
    width: "100%",
    maxWidth: 300,
    alignItems: "center",
    gap: 16,
  },
  progressBarTrack: {
    width: "100%",
    height: 8,
    backgroundColor: Colors.surfaceLight,
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
  },
  progressBarGradient: {
    flex: 1,
  },
  dotsContainer: {
    flexDirection: "row",
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  tipsContainer: {
    marginTop: 40,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: Colors.surfaceLight,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tipText: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: "center",
  },
});
