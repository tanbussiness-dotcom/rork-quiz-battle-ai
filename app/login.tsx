import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  Alert,
  Animated,
  Dimensions,
  Modal,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Mail, Lock, ArrowLeft, Brain, KeyRound } from "lucide-react-native";
import Colors from "@/constants/colors";

import { useAuth } from "@/contexts/AuthContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { resetPassword } from "@/services/auth.service";

export default function LoginScreen() {
  const router = useRouter();
  const { signIn, signInWithGoogle, signInWithApple, signInAnonymously, loading } = useAuth();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [forgotOpen, setForgotOpen] = useState<boolean>(false);
  const [guestOpen, setGuestOpen] = useState<boolean>(false);
  const [toastVisible, setToastVisible] = useState<boolean>(false);

  const slideAnim = useRef(new Animated.Value(40)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0, duration: 1500, useNativeDriver: true }),
      ])
    ).start();
  }, [fadeAnim, pulseAnim, slideAnim]);

  const pulseScale = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.02] });

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    try {
      await signIn(email, password);
      router.replace("/home");
    } catch (error: any) {
      Alert.alert("Login Failed", error.message || "Please try again");
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await signInWithGoogle();
      router.replace("/home");
    } catch (error: any) {
      Alert.alert("Login Failed", error.message || "Please try again");
    }
  };

  const handleAppleLogin = async () => {
    try {
      await signInWithApple();
      router.replace("/home");
    } catch (error: any) {
      if (error.code !== 'ERR_REQUEST_CANCELED') {
        Alert.alert("Login Failed", error.message || "Please try again");
      }
    }
  };

  const handleAnonymousSignIn = async () => {
    try {
      await signInAnonymously();
      router.replace("/home");
    } catch (error: any) {
      Alert.alert("Sign In Failed", error.message || "Please try again");
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <LinearGradient colors={["#02070A", "#000000"]} style={styles.gradient}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardView}
        >
          <ScrollView
            contentContainerStyle={[
              styles.scrollContent,
              { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 24 },
            ]}
            showsVerticalScrollIndicator={false}
          >
            <TouchableOpacity
              testID="login-back"
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <ArrowLeft size={24} color={"#9AE6FF"} />
            </TouchableOpacity>

            <Animated.View
              style={{
                transform: [{ translateY: slideAnim }],
                opacity: fadeAnim,
              }}
            >
              <View style={styles.header}>
                <View style={styles.logoWrap}>
                  <Brain color="#00FFFF" size={28} />
                </View>
                <Text style={styles.welcome}>Welcome to</Text>
                <Text style={styles.appName}>Quiz Battle AI</Text>
              </View>

              <View style={styles.glassPanel}>
                <View style={styles.field}>
                  <Mail size={18} color="#7DD3FC" />
                  <TextInput
                    testID="login-email"
                    style={styles.input}
                    placeholder="Email"
                    placeholderTextColor="#94A3B8"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                  />
                </View>

                <View style={styles.field}>
                  <Lock size={18} color="#7DD3FC" />
                  <TextInput
                    testID="login-password"
                    style={styles.input}
                    placeholder="Password"
                    placeholderTextColor="#94A3B8"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    autoCapitalize="none"
                    autoComplete="password"
                  />
                </View>

                <Animated.View style={{ transform: [{ scale: pulseScale }] }}>
                  <TouchableOpacity
                    testID="login-submit"
                    activeOpacity={0.9}
                    onPress={handleLogin}
                    disabled={loading}
                    style={styles.primaryButton}
                  >
                    <LinearGradient
                      colors={["#00FFFF", "#39FF14"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.primaryButtonInner}
                    >
                      <Text style={styles.primaryButtonText}>{loading ? "Loading..." : "Login"}</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </Animated.View>

                <TouchableOpacity
                  testID="login-guest"
                  activeOpacity={0.9}
                  onPress={() => setGuestOpen(true)}
                  style={styles.secondaryButton}
                >
                  <Text style={styles.secondaryButtonText}>Continue as Guest</Text>
                </TouchableOpacity>

                <View style={styles.orRow}>
                  <View style={styles.orLine} />
                  <Text style={styles.orText}>or continue with</Text>
                  <View style={styles.orLine} />
                </View>

                <View style={styles.socialRow}>
                  <TouchableOpacity
                    testID="login-google"
                    onPress={handleGoogleLogin}
                    style={styles.socialBtn}
                    activeOpacity={0.9}
                  >
                    <Text style={styles.socialText}>G</Text>
                  </TouchableOpacity>
                  {Platform.OS === 'ios' && (
                    <TouchableOpacity
                      testID="login-apple"
                      onPress={handleAppleLogin}
                      style={styles.socialBtn}
                      activeOpacity={0.9}
                    >
                      <Text style={styles.socialText}></Text>
                    </TouchableOpacity>
                  )}
                </View>

                <View style={styles.linksWrap}>
                  <TouchableOpacity testID="login-forgot" onPress={() => setForgotOpen(true)}>
                    <View style={styles.inlineRow}>
                      <KeyRound size={16} color="#7DD3FC" />
                      <Text style={styles.linkText}> Forgot Password?</Text>
                    </View>
                  </TouchableOpacity>
                </View>

                <View style={styles.switchWrap}>
                  <Text style={styles.switchText}>Dont have an account? </Text>
                  <TouchableOpacity testID="link-register" onPress={() => router.push("/register" as any)}>
                    <Text style={styles.switchLink}>Sign up</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>

      <Particles />

      <Modal visible={forgotOpen} transparent animationType="fade" onRequestClose={() => setForgotOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalIconWrap}>
              <KeyRound size={20} color="#00FFFF" />
            </View>
            <Text style={styles.modalTitle}>Reset Password</Text>
            <Text style={styles.modalDesc}>Enter your email to receive reset link</Text>
            <View style={[styles.field, { marginTop: 16 }]}>
              <Mail size={18} color="#7DD3FC" />
              <TextInput
                testID="forgot-email"
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="#94A3B8"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
            <TouchableOpacity
              testID="forgot-send"
              onPress={async () => {
                try {
                  await resetPassword(email);
                  setForgotOpen(false);
                  setToastVisible(true);
                  setTimeout(() => setToastVisible(false), 3000);
                } catch (e: any) {
                  Alert.alert("Error", e?.message ?? "Failed to send reset link");
                }
              }}
              style={[styles.primaryButton, { marginTop: 16 }]}
              activeOpacity={0.9}
            >
              <LinearGradient colors={["#00FFFF", "#39FF14"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.primaryButtonInner}>
                <Text style={styles.primaryButtonText}>Send Reset Link</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity testID="forgot-cancel" onPress={() => setForgotOpen(false)} style={styles.modalCancel}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={guestOpen} transparent animationType="fade" onRequestClose={() => setGuestOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={[styles.modalIconWrap, { backgroundColor: "rgba(250, 204, 21, 0.15)" }]}> 
              <Text style={{ color: "#FACC15", fontWeight: "800" as const }}>G</Text>
            </View>
            <Text style={styles.modalTitle}>Continue as Guest?</Text>
            <Text style={styles.modalDesc}>Your progress will be saved locally</Text>
            <TouchableOpacity
              testID="guest-continue"
              onPress={handleAnonymousSignIn}
              style={[styles.primaryButton, { marginTop: 16 }]}
              activeOpacity={0.9}
            >
              <LinearGradient colors={["#00FFFF", "#39FF14"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.primaryButtonInner}>
                <Text style={styles.primaryButtonText}>Continue</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity testID="guest-cancel" onPress={() => setGuestOpen(false)} style={styles.modalCancel}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {toastVisible && (
        <View style={styles.toast}>
          <Text style={styles.toastText}>Reset link sent successfully!</Text>
        </View>
      )}
    </View>
  );
}

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");

function Particles() {
  const count = 36;
  const items = useMemo(() => Array.from({ length: count }, (_, i) => i), [count]);
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {items.map((i) => (
        <FloatingDot key={`p-${i}`} index={i} />
      ))}
    </View>
  );
}

function FloatingDot({ index }: { index: number }) {
  const translateY = useRef(new Animated.Value(SCREEN_H + Math.random() * SCREEN_H)).current;
  const translateX = useRef(new Animated.Value(Math.random() * SCREEN_W)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const duration = 4000 + Math.random() * 4000;
    const start = () => {
      translateY.setValue(SCREEN_H + Math.random() * SCREEN_H * 0.5);
      translateX.setValue(Math.random() * SCREEN_W);
      opacity.setValue(0);
      Animated.parallel([
        Animated.timing(translateY, { toValue: -40, duration, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: duration * 0.2, useNativeDriver: true }),
      ]).start(({ finished }) => {
        if (finished) start();
      });
    };
    start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  return (
    <Animated.View
      style={{
        position: "absolute",
        width: 3,
        height: 3,
        borderRadius: 1.5,
        backgroundColor: "#00FFFF",
        opacity,
        transform: [{ translateY }, { translateX }],
      }}
    />
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
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
  },
  backButton: {
    marginBottom: 20,
  },
  header: {
    alignItems: "center",
    marginBottom: 16,
  },
  logoWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,20,40,0.6)",
    borderWidth: 1,
    borderColor: "rgba(0,255,255,0.25)",
    marginBottom: 12,
  },
  welcome: {
    color: "#00FFFF",
    fontSize: 18,
    fontWeight: "700" as const,
    letterSpacing: 1,
    marginBottom: 4,
  },
  appName: {
    color: "#FFFFFF",
    fontSize: 26,
    fontWeight: "900" as const,
    letterSpacing: 0.5,
  },
  glassPanel: {
    backgroundColor: "rgba(0,20,40,0.6)",
    borderWidth: 1,
    borderColor: "rgba(0,255,255,0.25)",
    borderRadius: 20,
    padding: 20,
  },
  field: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderWidth: 1,
    borderColor: "rgba(0,255,255,0.25)",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#FFFFFF",
  },
  button: {
    marginTop: 8,
  },
  primaryButton: {
    borderRadius: 14,
    overflow: "hidden",
    marginTop: 4,
  },
  primaryButtonInner: {
    minHeight: 52,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
  },
  primaryButtonText: {
    color: "#000",
    fontSize: 16,
    fontWeight: "800" as const,
    letterSpacing: 0.3,
  },
  secondaryButton: {
    marginTop: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(0,255,255,0.5)",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 52,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  secondaryButtonText: {
    color: "#00FFFF",
    fontSize: 16,
    fontWeight: "700" as const,
  },
  orRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 14,
    gap: 10,
  },
  orLine: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(0,255,255,0.3)",
  },
  orText: {
    color: "#94A3B8",
    fontSize: 12,
  },
  socialRow: {
    flexDirection: "row",
    gap: 12,
  },
  socialBtn: {
    flex: 1,
    minHeight: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
    borderWidth: 1,
    borderColor: "#475569",
  },
  socialText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700" as const,
  },
  linksWrap: {
    alignItems: "flex-end",
    marginTop: 8,
  },
  inlineRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  linkText: {
    color: "#7DD3FC",
  },
  switchWrap: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 18,
  },
  switchText: {
    color: "#94A3B8",
  },
  switchLink: {
    color: "#39FF14",
    fontWeight: "700" as const,
  },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.8)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  modalCard: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: "rgba(0,20,40,0.6)",
    borderWidth: 1,
    borderColor: "rgba(0,255,255,0.25)",
    borderRadius: 20,
    padding: 18,
  },
  modalIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,255,255,0.2)",
    alignSelf: "center",
    marginBottom: 10,
  },
  modalTitle: {
    color: "#00FFFF",
    fontSize: 18,
    fontWeight: "800" as const,
    textAlign: "center",
  },
  modalDesc: {
    color: "#94A3B8",
    fontSize: 13,
    textAlign: "center",
    marginTop: 6,
  },
  modalCancel: {
    alignItems: "center",
    paddingVertical: 10,
  },
  modalCancelText: {
    color: "#94A3B8",
  },
  toast: {
    position: "absolute",
    top: 16,
    right: 16,
    backgroundColor: "#39FF14",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  toastText: {
    color: "#000",
    fontWeight: "700" as const,
  },
});
