import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform } from "react-native";
import { Stack, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import { Copy } from "lucide-react-native";

export default function EnvCheckScreen() {
  useSafeAreaInsets();
  const router = useRouter();
  
  const envVars = {
    "Platform": Platform.OS,
    "EXPO_PUBLIC_RORK_API_BASE_URL": process.env.EXPO_PUBLIC_RORK_API_BASE_URL || "(not set)",
    "OPENAI_API_KEY": process.env.OPENAI_API_KEY ? `Set (${process.env.OPENAI_API_KEY.substring(0, 10)}...)` : "(not set - backend only)",
    "EXPO_PUBLIC_FIREBASE_API_KEY": process.env.EXPO_PUBLIC_FIREBASE_API_KEY ? "✅ Set" : "❌ Not set",
    "EXPO_PUBLIC_FIREBASE_PROJECT_ID": process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "(not set)",
  };
  
  const currentUrl = typeof window !== "undefined" ? window.location.href : "N/A";
  const currentOrigin = typeof window !== "undefined" ? window.location.origin : "N/A";
  
  const guessedBackendUrls = Platform.OS === "web" && typeof window !== "undefined" ? [
    currentOrigin.replace(":8081", ":3000"),
    currentOrigin.replace(":8081", ":8080"),
    currentOrigin + "/api",
  ] : [];

  const copyToClipboard = async (text: string) => {
    if (Platform.OS === "web" && typeof navigator !== "undefined" && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(text);
        Alert.alert("Copied", "Text copied to clipboard!");
      } catch {
        Alert.alert("Error", "Failed to copy to clipboard");
      }
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: "Environment Check", headerShown: true }} />
      <ScrollView style={[styles.content, { paddingTop: 20 }]}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Current URL</Text>
          <TouchableOpacity 
            style={styles.valueCard} 
            onPress={() => copyToClipboard(currentUrl)}
          >
            <Text style={styles.valueText}>{currentUrl}</Text>
            {Platform.OS === "web" && (
              <Copy size={16} color={Colors.textSecondary} />
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Environment Variables</Text>
          {Object.entries(envVars).map(([key, value]) => (
            <View key={key} style={styles.envCard}>
              <Text style={styles.envKey}>{key}</Text>
              <TouchableOpacity onPress={() => copyToClipboard(value as string)}>
                <Text style={styles.envValue}>{value}</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {guessedBackendUrls.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Possible Backend URLs</Text>
            <Text style={styles.helpText}>
              Try adding one of these to your env file:
            </Text>
            {guessedBackendUrls.map((url, index) => (
              <TouchableOpacity 
                key={index}
                style={styles.urlCard}
                onPress={() => copyToClipboard(url)}
              >
                <Text style={styles.urlText}>{url}</Text>
                <Copy size={16} color={Colors.primary} />
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push("/debug-backend" as any)}
          >
            <Text style={styles.actionButtonText}>Test Backend Connection</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push("/debug-api" as any)}
          >
            <Text style={styles.actionButtonText}>API Debug Screen</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.instructionsTitle}>How to Fix Backend Issues:</Text>
          <Text style={styles.instructionsText}>
            1. Copy one of the Possible Backend URLs above{"\n"}
            2. Add it to your env file as:{"\n"}
               EXPO_PUBLIC_RORK_API_BASE_URL=(url here){"\n"}
            3. Restart the development server{"\n"}
            4. Use Test Backend Connection to verify
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: Colors.text,
    marginBottom: 12,
  },
  valueCard: {
    backgroundColor: Colors.surfaceLight,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  valueText: {
    fontSize: 12,
    color: Colors.text,
    flex: 1,
  },
  envCard: {
    backgroundColor: Colors.surfaceLight,
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  envKey: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: Colors.primary,
    marginBottom: 4,
  },
  envValue: {
    fontSize: 14,
    color: Colors.text,
  },
  helpText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  urlCard: {
    backgroundColor: Colors.surface,
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: Colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  urlText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: "600" as const,
    flex: 1,
  },
  actionButton: {
    backgroundColor: Colors.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 12,
  },
  actionButtonText: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: "600" as const,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: Colors.success,
    marginBottom: 8,
  },
  instructionsText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
});
