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
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Mail, Lock, ArrowLeft, User, UserPlus } from "lucide-react-native";
import Colors from "@/constants/colors";
import { useAuth } from "@/contexts/AuthContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function RegisterScreen() {
  const router = useRouter();
  const { signUp, signInWithGoogle, signInWithApple, loading } = useAuth();
  const insets = useSafeAreaInsets();
  const [displayName, setDisplayName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");

  const slideAnim = useRef(new Animated.Value(40)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const handleRegister = async () => {
    if (!displayName || !email || !password || !confirmPassword) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters");
      return;
    }

    try {
      await signUp(email, password, displayName);
      router.replace("/home");
    } catch (error: any) {
      Alert.alert("Registration Failed", error.message || "Please try again");
    }
  };

  const handleGoogleSignUp = async () => {
    try {
      await signInWithGoogle();
      router.replace("/home");
    } catch (error: any) {
      Alert.alert("Sign Up Failed", error.message || "Please try again");
    }
  };

  const handleAppleSignUp = async () => {
    try {
      await signInWithApple();
      router.replace("/home");
    } catch (error: any) {
      if (error.code !== 'ERR_REQUEST_CANCELED') {
        Alert.alert("Sign Up Failed", error.message || "Please try again");
      }
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
              testID="register-back"
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
                <View style={[styles.logoWrap, { borderColor: "rgba(57,255,20,0.35)" }]}>
                  <UserPlus color="#39FF14" size={28} />
                </View>
                <Text style={[styles.welcome, { color: "#39FF14" }]}>Join the Battle</Text>
                <Text style={styles.appName}>Create Your Account</Text>
              </View>

              <View style={[styles.glassPanel, { borderColor: "rgba(57,255,20,0.35)" }]}> 
                <View style={[styles.field, { borderColor: "rgba(57,255,20,0.35)" }]}>
                  <User size={18} color="#86EFAC" />
                  <TextInput
                    testID="register-name"
                    style={styles.input}
                    placeholder="Full Name"
                    placeholderTextColor="#94A3B8"
                    value={displayName}
                    onChangeText={setDisplayName}
                    autoCapitalize="words"
                  />
                </View>

                <View style={[styles.field, { borderColor: "rgba(57,255,20,0.35)" }]}>
                  <Mail size={18} color="#86EFAC" />
                  <TextInput
                    testID="register-email"
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

                <View style={[styles.field, { borderColor: "rgba(57,255,20,0.35)" }]}>
                  <Lock size={18} color="#86EFAC" />
                  <TextInput
                    testID="register-password"
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

                <View style={[styles.field, { borderColor: "rgba(57,255,20,0.35)" }]}>
                  <Lock size={18} color="#86EFAC" />
                  <TextInput
                    testID="register-confirm"
                    style={styles.input}
                    placeholder="Confirm Password"
                    placeholderTextColor="#94A3B8"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry
                    autoCapitalize="none"
                    autoComplete="password"
                  />
                </View>

                <TouchableOpacity
                  testID="register-submit"
                  activeOpacity={0.9}
                  onPress={handleRegister}
                  disabled={loading}
                  style={styles.primaryButton}
                >
                  <LinearGradient colors={["#39FF14", "#00FFFF"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.primaryButtonInner}>
                    <Text style={styles.primaryButtonText}>{loading ? "Creating..." : "Create Account"}</Text>
                  </LinearGradient>
                </TouchableOpacity>

                <View style={styles.orRow}>
                  <View style={styles.orLine} />
                  <Text style={styles.orText}>or continue with</Text>
                  <View style={styles.orLine} />
                </View>

                <View style={styles.socialRow}>
                  <TouchableOpacity
                    testID="register-google"
                    onPress={handleGoogleSignUp}
                    style={styles.socialBtn}
                    activeOpacity={0.9}
                  >
                    <Text style={styles.socialText}>G</Text>
                  </TouchableOpacity>
                  {Platform.OS !== 'android' && (
                    <TouchableOpacity
                      testID="register-apple"
                      onPress={handleAppleSignUp}
                      style={styles.socialBtn}
                      activeOpacity={0.9}
                    >
                      <Text style={styles.socialText}></Text>
                    </TouchableOpacity>
                  )}
                </View>

                <View style={styles.switchWrap}>
                  <Text style={styles.switchText}>Already have an account? </Text>
                  <TouchableOpacity testID="link-login" onPress={() => router.push("/login")}>
                    <Text style={styles.switchLink}>Login</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>

      <Particles />
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
        <FloatingDot key={`pr-${i}`} index={i} />
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
        backgroundColor: "#39FF14",
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
    color: "#39FF14",
    fontSize: 18,
    fontWeight: "700" as const,
    letterSpacing: 1,
    marginBottom: 4,
  },
  appName: {
    color: "#FFFFFF",
    fontSize: 22,
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
    borderColor: "rgba(57,255,20,0.35)",
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
  primaryButton: {
    borderRadius: 14,
    overflow: "hidden",
    marginTop: 8,
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
  orRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 14,
    gap: 10,
  },
  orLine: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(57,255,20,0.35)",
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
});
