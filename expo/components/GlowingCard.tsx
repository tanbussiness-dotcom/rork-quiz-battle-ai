import React from "react";
import { View, StyleSheet, ViewStyle } from "react-native";
import Colors from "@/constants/colors";

interface GlowingCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  glow?: boolean;
}

export default function GlowingCard({ children, style, glow = true }: GlowingCardProps) {
  return (
    <View style={[styles.container, glow && styles.glow, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surfaceLight,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 20,
  },
  glow: {
    borderColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
});
