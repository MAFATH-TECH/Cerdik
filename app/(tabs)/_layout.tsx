import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";

import { CERDIK_COLORS } from "../../constants/colors";

type TabIconName = keyof typeof Ionicons.glyphMap;

const getTabIcon = (routeName: string, focused: boolean): TabIconName => {
  if (routeName === "index") return focused ? "home" : "home-outline";
  if (routeName === "catat") return focused ? "create" : "create-outline";
  if (routeName === "evaluasi") return focused ? "bar-chart" : "bar-chart-outline";
  if (routeName === "rencanakan") return focused ? "flag" : "flag-outline";
  return focused ? "sparkles" : "sparkles-outline";
};

export default function TabLayout() {
  return (
    <Tabs
      detachInactiveScreens={false}
      screenOptions={({ route }) => ({
        sceneStyle: { backgroundColor: CERDIK_COLORS.background },
        headerStyle: { backgroundColor: CERDIK_COLORS.card },
        headerTintColor: CERDIK_COLORS.textPrimary,
        headerTitleStyle: { fontWeight: "700" },
        tabBarActiveTintColor: CERDIK_COLORS.primary,
        tabBarInactiveTintColor: CERDIK_COLORS.textSecondary,
        /** Freeze tab tidak aktif agar JS tidak terus update di belakang */
        freezeOnBlur: true,
        tabBarStyle: {
          backgroundColor: CERDIK_COLORS.card,
          borderTopWidth: 0,
          height: 76,
          paddingBottom: 8,
          paddingTop: 8,
          shadowColor: "#000000",
          shadowOffset: { width: 0, height: -3 },
          shadowOpacity: 0.08,
          shadowRadius: 10,
          elevation: 10,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
        },
        tabBarIcon: ({ color, size, focused }) => (
          <Ionicons name={getTabIcon(route.name, focused)} size={route.name === "catat" ? 28 : size} color={color} />
        ),
      })}
    >
      <Tabs.Screen name="index" options={{ title: "Beranda" }} />
      <Tabs.Screen
        name="catat"
        options={{
          title: "Catat",
          tabBarLabel: "Catat",
          tabBarButton: (props) => (
            <Pressable
              accessibilityRole={props.accessibilityRole}
              accessibilityState={props.accessibilityState}
              accessibilityLabel={props.accessibilityLabel}
              testID={props.testID}
              onPress={props.onPress}
              onLongPress={props.onLongPress}
              style={[
                props.style,
                {
                  top: -14,
                  alignItems: "center",
                  justifyContent: "center",
                },
              ]}
            >
              <View
                style={{
                  width: 58,
                  height: 58,
                  borderRadius: 29,
                  backgroundColor: CERDIK_COLORS.primary,
                  justifyContent: "center",
                  alignItems: "center",
                  shadowColor: CERDIK_COLORS.primary,
                  shadowOffset: { width: 0, height: 6 },
                  shadowOpacity: 0.35,
                  shadowRadius: 10,
                  elevation: 10,
                }}
              >
                <Ionicons name="add-circle" size={30} color="#FFFFFF" />
              </View>
              <Text style={{ marginTop: 4, fontSize: 11, fontWeight: "700", color: CERDIK_COLORS.primary }}>
                Catat
              </Text>
            </Pressable>
          ),
        }}
      />
      <Tabs.Screen name="evaluasi" options={{ title: "Evaluasi" }} />
      <Tabs.Screen
        name="rencanakan"
        options={{
          title: "Target",
          /** Cegah layar hitam saat pindah tab di iOS + react-native-screens / Expo Go */
          freezeOnBlur: false,
          lazy: false,
        }}
      />
      <Tabs.Screen name="inisiasi" options={{ title: "AI Saran" }} />
    </Tabs>
  );
}
