import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Platform } from "react-native";
import { AlertCircle } from "lucide-react-native";
import Colors from "@/constants/colors";

interface HealthStatus {
  status: "checking" | "ok" | "error";
  message: string;
  endpoint?: string;
}

export default function BackendHealthCheck() {
  const [health, setHealth] = useState<HealthStatus>({
    status: "checking",
    message: "Checking backend connection..."
  });

  const checkHealth = async () => {
    setHealth({ status: "checking", message: "Checking backend connection..." });
    
    try {
      const baseUrl = Platform.OS === "web" && typeof window !== "undefined"
        ? window.location.origin
        : process.env.EXPO_PUBLIC_RORK_API_BASE_URL || "http://localhost:3000";
      
      const endpoint = `${baseUrl}/api/`;
      
      console.log("🔍 [Health Check] Testing endpoint:", endpoint);
      
      const response = await fetch(endpoint, {
        method: "GET",
        headers: { "Accept": "application/json" }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.status === "ok") {
        setHealth({
          status: "ok",
          message: "✅ Backend connected successfully",
          endpoint
        });
      } else {
        setHealth({
          status: "error",
          message: "⚠️ Backend responded but status not OK",
          endpoint
        });
      }
    } catch (error: any) {
      console.error("❌ [Health Check] Failed:", error);
      setHealth({
        status: "error",
        message: `❌ Cannot connect to backend: ${error.message}`
      });
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  if (health.status === "ok" || health.status === "checking") {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <AlertCircle size={24} color={Colors.error} />
        
        <Text style={styles.message}>{health.message}</Text>
        
        {health.endpoint && (
          <Text style={styles.endpoint}>Endpoint: {health.endpoint}</Text>
        )}
        
        {health.status === "error" && (
          <TouchableOpacity style={styles.retryButton} onPress={checkHealth}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  card: {
    backgroundColor: Colors.surfaceLight,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    gap: 8,
  },
  message: {
    color: Colors.text,
    fontSize: 14,
    textAlign: "center",
  },
  endpoint: {
    color: Colors.textSecondary,
    fontSize: 12,
    textAlign: "center",
  },
  retryButton: {
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: Colors.primary,
    borderRadius: 8,
  },
  retryText: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: "600" as const,
  },
});
