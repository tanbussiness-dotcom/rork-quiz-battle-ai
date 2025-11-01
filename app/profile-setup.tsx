import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  Animated,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from "expo-image-picker";
import { ArrowLeft, Camera, Check, Globe2, Loader2, Sparkles } from "lucide-react-native";
import Colors from "@/constants/colors";
import { useAuth } from "@/contexts/AuthContext";
import { useI18n } from "@/contexts/I18nContext";
import { QUIZ_TOPICS } from "@/constants/topics";
import { updateUserPreferences, updateUserProfile } from "@/services/user.service";

const PRESET_AVATARS = [
  "https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-1.jpg",
  "https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-2.jpg",
  "https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-3.jpg",
  "https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-4.jpg",
];
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function ProfileSetup() {
  const router = useRouter();
  const { user } = useAuth();
  const { language, setLanguage } = useI18n();
  const insets = useSafeAreaInsets();

  const [currentStep, setCurrentStep] = useState<number>(1);
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [saving, setSaving] = useState<boolean>(false);
  const [selectedLang, setSelectedLang] = useState<typeof language>(language);
  const [topics, setTopics] = useState<string[]>([]);
  const [uploading, setUploading] = useState<boolean>(false);

  const slideAnim = useRef(new Animated.Value(30)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const ringScale = useRef(new Animated.Value(0)).current;

  const startCardAnim = useCallback(() => {
    slideAnim.setValue(30);
    fadeAnim.setValue(0);
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const startRing = useCallback(() => {
    ringScale.setValue(0);
    Animated.loop(
      Animated.sequence([
        Animated.timing(ringScale, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(ringScale, { toValue: 0, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, [ringScale]);

  const stopRing = useCallback(() => {
    ringScale.stopAnimation();
  }, [ringScale]);

  const ringStyle = {
    transform: [
      {
        scale: ringScale.interpolate({ inputRange: [0, 1], outputRange: [1, 1.07] }),
      },
    ],
    shadowColor: "#22c55e",
    shadowOpacity: 0.8,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 0 },
  } as const;

  const canNextFromStep1 = !!avatarUri;
  const canNextFromStep2 = !!selectedLang;
  const canComplete = topics.length >= 2;

  const pickImage = useCallback(async () => {
    try {
      setUploading(true);
      startRing();
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert("Permission required", "We need access to your photos to set your avatar.");
        stopRing();
        setUploading(false);
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: [1, 1],
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
      });
      if (!result.canceled) {
        const uri = result.assets[0]?.uri ?? null;
        if (uri) setAvatarUri(uri);
      }
    } catch (e: any) {
      Alert.alert("Error", e?.message ?? "Failed to pick image");
    } finally {
      stopRing();
      setUploading(false);
    }
  }, [startRing, stopRing]);

  const selectPreset = useCallback((uri: string) => {
    setAvatarUri(uri);
  }, []);

  const goToStep = useCallback((s: number) => {
    setCurrentStep(s);
    startCardAnim();
  }, [startCardAnim]);

  const toggleTopic = useCallback((id: string) => {
    setTopics((prev) => (prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]));
  }, []);

  const completeSetup = useCallback(async () => {
    if (!user) return;
    try {
      setSaving(true);
      if (selectedLang) {
        await setLanguage(selectedLang);
      }
      await updateUserPreferences(user.uid, {
        language: selectedLang,
        favoriteTopics: topics,
      });
      if (avatarUri) {
        await updateUserProfile(user.uid, { photoURL: avatarUri });
      }
      await updateUserProfile(user.uid, { onboardingComplete: true });
      router.replace("/home");
    } catch (e: any) {
      Alert.alert("Setup failed", e?.message ?? "Please try again");
    } finally {
      setSaving(false);
    }
  }, [avatarUri, router, selectedLang, setLanguage, topics, user]);

  React.useEffect(() => {
    startCardAnim();
  }, [currentStep, startCardAnim]);

  const supportedLanguages = useMemo(() => (
    [
      { code: "en" as const, label: "English", flag: "🇺🇸" },
      { code: "vi" as const, label: "Vietnamese", flag: "🇻🇳" },
    ]
  ), []);

  return (
    <View style={styles.container} testID="profile-setup-screen">
      <Stack.Screen options={{ headerShown: false }} />
      <LinearGradient colors={["#000000", "#02070A"]} style={styles.gradient}>
        <View style={[styles.header, { paddingTop: 16 + insets.top }]}> 
          <TouchableOpacity accessibilityRole="button" onPress={() => router.back()} style={styles.headerBtn} testID="back-btn">
            <ArrowLeft color="#9CA3AF" size={18} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile Setup</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.progressWrap}>
          <View style={styles.progressRow}>
            {([1,2,3] as const).map((n, idx) => {
              const isActive = currentStep === n;
              const isDone = currentStep > n;
              return (
                <View key={`step-${n}`} style={styles.progressItem}>
                  <View style={[styles.stepDot, isDone ? styles.stepComplete : isActive ? styles.stepActive : styles.stepInactive]}>
                    {isDone ? <Check size={12} color="#000" /> : <Text style={styles.stepText}>{n}</Text>}
                  </View>
                  {idx < 2 && <View style={styles.stepLine} />}
                </View>
              );
            })}
          </View>
          <Text style={styles.stepCaption} testID="step-caption">
            {currentStep === 1 ? "Upload your avatar" : currentStep === 2 ? "Select your language" : "Choose your interests"}
          </Text>
        </View>

        <ScrollView contentContainerStyle={[styles.content, { paddingBottom: 32 + insets.bottom }]} showsVerticalScrollIndicator={false}>
          {currentStep === 1 && (
            <Animated.View style={[styles.card, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}> 
              <Text style={styles.cardTitle}>Choose Your Avatar</Text>
              <Text style={styles.cardSub}>Upload a photo or select from our collection</Text>

              <View style={styles.avatarZone}>
                <TouchableOpacity onPress={pickImage} activeOpacity={0.9} style={styles.avatarButton} testID="pick-image">
                  {avatarUri ? (
                    <View>
                      <Animated.View style={[styles.glowRing, uploading ? ringStyle : undefined]} />
                      <Image source={{ uri: avatarUri }} style={styles.avatarImg} />
                    </View>
                  ) : (
                    <View style={styles.emptyAvatar}> 
                      <Camera size={28} color="#9CA3AF" />
                    </View>
                  )}
                </TouchableOpacity>
              </View>

              <View style={styles.presetGrid}>
                {PRESET_AVATARS.map((uri) => (
                  <TouchableOpacity onPress={() => selectPreset(uri)} key={uri} style={styles.presetItem} accessibilityRole="button">
                    <Image source={{ uri }} style={styles.presetImg} />
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity disabled={!canNextFromStep1} onPress={() => goToStep(2)} activeOpacity={0.9} style={[styles.primaryBtn, !canNextFromStep1 && styles.btnDisabled]} testID="next-1">
                <LinearGradient colors={["#22d3ee", "#34d399"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.primaryBtnInner}>
                  <Text style={styles.primaryBtnText}>Continue</Text>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          )}

          {currentStep === 2 && (
            <Animated.View style={[styles.card, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}> 
              <Text style={styles.cardTitle}>Select Language</Text>
              <Text style={styles.cardSub}>Choose your preferred language for the app</Text>

              <View style={{ gap: 10 }}>
                {supportedLanguages.map((l) => {
                  const active = selectedLang === l.code;
                  return (
                    <TouchableOpacity key={l.code} onPress={() => setSelectedLang(l.code)} style={[styles.langRow, active && styles.langActive]} activeOpacity={0.9} testID={`lang-${l.code}`}>
                      <View style={styles.langLeft}>
                        <View style={styles.flagBox}><Text style={styles.flagText}>{l.flag}</Text></View>
                        <Text style={styles.langLabel}>{l.label}</Text>
                      </View>
                      {active ? <Check size={18} color="#22d3ee" /> : <Globe2 size={18} color="#6B7280" />}
                    </TouchableOpacity>
                  );
                })}
              </View>

              <TouchableOpacity disabled={!canNextFromStep2} onPress={() => goToStep(3)} activeOpacity={0.9} style={[styles.primaryBtn, !canNextFromStep2 && styles.btnDisabled]} testID="next-2">
                <LinearGradient colors={["#22d3ee", "#34d399"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.primaryBtnInner}>
                  <Text style={styles.primaryBtnText}>Continue</Text>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          )}

          {currentStep === 3 && (
            <Animated.View style={[styles.card, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}> 
              <Text style={styles.cardTitle}>Choose Your Interests</Text>
              <Text style={styles.cardSub}>Select topics you would like to be quizzed on</Text>

              <View style={styles.topicGrid}>
                {QUIZ_TOPICS.map((t) => {
                  const active = topics.includes(t.id);
                  return (
                    <TouchableOpacity key={t.id} onPress={() => toggleTopic(t.id)} style={[styles.topicCard, active && styles.topicActive]} activeOpacity={0.9} testID={`topic-${t.id}`}>
                      <Text style={styles.topicEmoji}>{t.emoji}</Text>
                      <Text style={styles.topicLabel}>{t.name}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={styles.helperText}>Select at least 2 topics</Text>

              <TouchableOpacity disabled={!canComplete || saving} onPress={completeSetup} activeOpacity={0.9} style={[styles.primaryBtn, (!canComplete || saving) && styles.btnDisabled]} testID="complete-setup">
                <LinearGradient colors={["#22d3ee", "#34d399"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.primaryBtnInner}>
                  <View style={styles.btnContentRow}>
                    {saving ? <Loader2 size={18} color="#000" /> : <Sparkles size={18} color="#000" />}
                    <Text style={styles.primaryBtnText}>{saving ? "Saving..." : "Complete Setup"}</Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          )}
        </ScrollView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  gradient: { flex: 1 },
  header: {
    paddingTop: 16,
    paddingHorizontal: 20,
    paddingBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#111827",
    borderWidth: 1,
    borderColor: "#374151",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { color: Colors.text, fontWeight: "700", fontSize: 16 },
  headerSpacer: { width: 40 },

  progressWrap: { paddingHorizontal: 20, marginBottom: 10 },
  progressRow: { flexDirection: "row", justifyContent: "center", alignItems: "center" },
  progressItem: { flexDirection: "row", alignItems: "center" },
  stepDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  stepText: { color: "#fff", fontWeight: "700" as const, fontSize: 12 },
  stepLine: { width: 48, height: 2, backgroundColor: "#374151", marginHorizontal: 6 },
  stepActive: { backgroundColor: "#0891b2" },
  stepComplete: { backgroundColor: "#16a34a" },
  stepInactive: { backgroundColor: "#374151" },
  stepCaption: { color: "#9CA3AF", textAlign: "center", marginTop: 8, fontSize: 12 },

  content: { padding: 20, paddingBottom: 32, gap: 14 },
  card: {
    backgroundColor: "#0b0f14",
    borderWidth: 1,
    borderColor: "#1f2937",
    borderRadius: 20,
    padding: 16,
  },
  cardTitle: { color: Colors.text, fontSize: 18, fontWeight: "700" as const, marginBottom: 4 },
  cardSub: { color: Colors.textSecondary, fontSize: 13, marginBottom: 14 },

  avatarZone: { alignItems: "center", marginBottom: 14 },
  avatarButton: { width: 128, height: 128, borderRadius: 64, overflow: "hidden" },
  emptyAvatar: {
    width: 128,
    height: 128,
    borderRadius: 64,
    backgroundColor: "#111827",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#374151",
  },
  glowRing: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 64,
    borderWidth: 4,
    borderColor: "#22c55e",
    opacity: 0.6,
  },
  avatarImg: { width: 128, height: 128, borderRadius: 64, borderWidth: 4, borderColor: "#22c55e" },

  presetGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, justifyContent: "space-between" },
  presetItem: {
    width: 64,
    height: 64,
    borderRadius: 32,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "transparent",
    backgroundColor: "#111827",
  },
  presetImg: { width: "100%", height: "100%" },

  primaryBtn: { borderRadius: 14, overflow: "hidden", marginTop: 10 },
  primaryBtnInner: { minHeight: 52, alignItems: "center", justifyContent: "center" },
  primaryBtnText: { color: "#000", fontWeight: "800" as const },
  btnDisabled: { opacity: 0.5 },
  btnContentRow: { flexDirection: "row", alignItems: "center", gap: 8 },

  langRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#111827",
    borderWidth: 1,
    borderColor: "#374151",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  langActive: { borderColor: "#22d3ee" },
  langLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  flagBox: { width: 28, height: 20, borderRadius: 4, backgroundColor: "#374151", alignItems: "center", justifyContent: "center" },
  flagText: { fontSize: 12 },
  langLabel: { color: Colors.text, fontWeight: "600" as const },

  topicGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  topicCard: {
    width: "48%",
    backgroundColor: "#111827",
    borderWidth: 1,
    borderColor: "#374151",
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  topicActive: { borderColor: "#22d3ee", backgroundColor: "#0b3b44" },
  topicEmoji: { fontSize: 22, marginBottom: 6 },
  topicLabel: { color: Colors.text, fontWeight: "600" as const, textAlign: "center" },
  helperText: { color: "#6B7280", fontSize: 12, textAlign: "center", marginTop: 6 },
});
