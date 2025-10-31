import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { ArrowLeft } from "lucide-react-native";
import Colors from "@/constants/colors";
import GlowingCard from "@/components/GlowingCard";
import { QUIZ_TOPICS } from "@/constants/topics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

export default function SoloTopicSelectionScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleTopicSelect = async (topicId: string) => {
    if (Platform.OS !== 'web') {
      await Haptics.selectionAsync();
    }
    router.push(`/quiz?topic=${topicId}` as any);
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <LinearGradient
        colors={[Colors.background, Colors.surface]}
        style={styles.gradient}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: insets.top + 20 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color={Colors.text} />
          </TouchableOpacity>

          <Text style={styles.title}>Solo Mode</Text>
          <Text style={styles.subtitle}>Choose a topic to get started</Text>

          <View style={styles.topicsGrid}>
            {QUIZ_TOPICS.map((topic) => (
              <TouchableOpacity
                key={topic.id}
                onPress={() => handleTopicSelect(topic.id)}
                activeOpacity={0.8}
              >
                <GlowingCard style={styles.topicCard}>
                  <Text style={styles.topicEmoji}>{topic.emoji}</Text>
                  <Text style={styles.topicName}>{topic.name}</Text>
                </GlowingCard>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
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
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  backButton: {
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: "800" as const,
    color: Colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginBottom: 32,
  },
  topicsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  topicCard: {
    width: "100%",
    minWidth: 160,
    alignItems: "center",
    padding: 20,
    gap: 12,
  },
  topicEmoji: {
    fontSize: 48,
  },
  topicName: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: Colors.text,
    textAlign: "center",
  },
});
