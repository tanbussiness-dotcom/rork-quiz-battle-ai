import React, { useEffect, useMemo, useRef } from "react";
import { Tabs } from "expo-router";
import { View, Text, StyleSheet, Animated, Platform, TouchableOpacity } from "react-native";
import { Home, Gamepad2, Sword, User } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import Colors from "@/constants/colors";

function NeonTabBar({ state, descriptors, navigation }: any) {
  const animatedValues = useMemo(
    () => state.routes.map(() => new Animated.Value(0)),
    [state.routes.length]
  );

  useEffect(() => {
    state.routes.forEach((_: any, index: number) => {
      const focused = state.index === index;
      Animated.timing(animatedValues[index], {
        toValue: focused ? 1 : 0,
        duration: 220,
        useNativeDriver: true,
      }).start();
    });
  }, [state.index]);

  return (
    <View style={styles.tabBar}>
      {state.routes.map((route: any, index: number) => {
        const { options } = descriptors[route.key];
        const label =
          options.tabBarLabel !== undefined
            ? options.tabBarLabel
            : options.title !== undefined
            ? options.title
            : route.name;
        const isFocused = state.index === index;
        const onPress = () => {
          const event = navigation.emit({
            type: "tabPress",
            target: route.key,
            canPreventDefault: true,
          });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };
        const scale = animatedValues[index].interpolate({ inputRange: [0, 1], outputRange: [1, 1.15] });
        const glowOpacity = animatedValues[index].interpolate({ inputRange: [0, 1], outputRange: [0, 1] });

        const Icon = options.tabBarIcon as ((p: { color: string }) => React.ReactElement) | undefined;
        const color = isFocused ? Colors.primary : Colors.textSecondary;

        return (
          <TouchableOpacity
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            onPress={onPress}
            style={styles.tabItem}
          >
            <View style={styles.iconWrap}>
              <Animated.View style={[styles.glowWrap, { opacity: glowOpacity }]}> 
                <LinearGradient
                  colors={["#22d3ee", "#34d399"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.glowGradient}
                />
              </Animated.View>
              <Animated.View style={{ transform: [{ scale }] }}>
                {Icon ? (
                  <Icon color={color} />
                ) : (
                  <Home color={color} />
                )}
              </Animated.View>
            </View>
            <Text style={[styles.label, isFocused ? styles.labelActive : undefined]}>{label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { display: "none" },
        animation: "shift",
      }}
      tabBar={(props) => <NeonTabBar {...props} />}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarIcon: ({ color }: { color: string }) => <Home size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="solo"
        options={{
          title: "Solo",
          tabBarIcon: ({ color }: { color: string }) => <Gamepad2 size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="battle"
        options={{
          title: "Battle",
          tabBarIcon: ({ color }: { color: string }) => <Sword size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }: { color: string }) => <User size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: Platform.OS === "ios" ? 24 : 12,
    backgroundColor: Colors.surfaceLight,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  glowWrap: {
    ...Platform.select({
      web: { display: "none" },
      default: {
        position: "absolute",
        inset: 0 as unknown as number,
      },
    }),
  },
  glowGradient: {
    flex: 1,
    opacity: 0.25,
  },
  label: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: "600" as const,
  },
  labelActive: {
    color: Colors.primary,
  },
});