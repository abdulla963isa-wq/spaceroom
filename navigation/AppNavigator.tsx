import React from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import {
  BottomTabBarProps,
  createBottomTabNavigator,
} from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { enableScreens } from "react-native-screens";

import { COLORS } from "../constants/colors";
import { AuthProvider, useAuth } from "../context/AuthContext";
import { FavouritesProvider } from "../context/FavouritesContext";

import HomeScreen from "../screens/homeScreen";
import MyBookingsScreen from "../screens/MyBookingsScreen";
import ProfileScreen from "../screens/ProfileScreen";
import SpaceDetailsScreen from "../screens/SpaceDetailsScreen";
import BookingScreen from "../screens/BookingScreen";
import BookingSuccessScreen from "../screens/BookingSuccessScreen";
import FavouritesScreen from "../screens/FavouriteScreen";
import SettingsScreen from "../screens/SettingScreen";
import PersonalDetailsScreen from "../screens/personalDetails";
import LoginScreen from "../screens/Auth/LoginScreen";
import RegisterScreen from "../screens/Auth/RegisterScreen";
import ForgetPasswordScreen from "../screens/Auth/ForgotPasswordScreen";

enableScreens();

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// ─── Icon Components ──────────────────────────────────────────────────────────

function HomeIcon({ focused }: { focused: boolean }) {
  const c = focused ? COLORS.primary : "#555";
  const bg = focused ? "#0A0E1A" : "#0E1420";
  return (
    <View style={{ alignItems: "center", width: 24, height: 22 }}>
      <View
        style={{
          width: 0,
          height: 0,
          borderLeftWidth: 11,
          borderRightWidth: 11,
          borderBottomWidth: 10,
          borderLeftColor: "transparent",
          borderRightColor: "transparent",
          borderBottomColor: c,
          marginBottom: -1,
        }}
      />
      <View
        style={{
          width: 16,
          height: 12,
          backgroundColor: c,
          borderBottomLeftRadius: 2,
          borderBottomRightRadius: 2,
        }}
      >
        <View
          style={{
            position: "absolute",
            bottom: 0,
            left: 5,
            width: 6,
            height: 8,
            backgroundColor: bg,
            borderTopLeftRadius: 3,
            borderTopRightRadius: 3,
          }}
        />
      </View>
    </View>
  );
}

function BookingsIcon({ focused }: { focused: boolean }) {
  const c = focused ? COLORS.primary : "#555";
  const line = focused ? "rgba(20,207,255,0.35)" : "rgba(85,85,85,0.5)";
  return (
    <View
      style={{
        width: 20,
        height: 22,
        borderWidth: 1.5,
        borderColor: c,
        borderRadius: 5,
        overflow: "hidden",
        paddingTop: 8,
        paddingHorizontal: 3,
      }}
    >
      <View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 6,
          backgroundColor: c,
        }}
      />
      {[0, 1, 2].map((i) => (
        <View
          key={i}
          style={{
            height: 1.5,
            backgroundColor: line,
            marginBottom: i < 2 ? 3 : 0,
            borderRadius: 1,
          }}
        />
      ))}
    </View>
  );
}

function AccountIcon({ focused }: { focused: boolean }) {
  const c = focused ? COLORS.primary : "#555";
  return (
    <View style={{ alignItems: "center", width: 22, height: 22 }}>
      <View
        style={{
          width: 10,
          height: 10,
          borderRadius: 5,
          backgroundColor: c,
          marginBottom: 2,
        }}
      />
      <View
        style={{
          width: 18,
          height: 10,
          borderTopLeftRadius: 9,
          borderTopRightRadius: 9,
          backgroundColor: c,
        }}
      />
    </View>
  );
}

const TAB_ICONS: Record<string, (focused: boolean) => React.ReactNode> = {
  Home: (f) => <HomeIcon focused={f} />,
  Bookings: (f) => <BookingsIcon focused={f} />,
  Account: (f) => <AccountIcon focused={f} />,
};

const TAB_LABELS: Record<string, string> = {
  Home: "Home",
  Bookings: "Bookings",
  Account: "Account",
};

// ─── Custom Tab Bar ───────────────────────────────────────────────────────────

function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.tabBarOuter, { paddingBottom: insets.bottom + 8 }]}>
      <View style={styles.tabBar}>
        {state.routes.map((route, index) => {
          const focused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });
            if (!focused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              style={styles.tabItem}
              activeOpacity={0.7}
            >
              <View
                style={[styles.iconPill, focused && styles.iconPillActive]}
              >
                {TAB_ICONS[route.name]?.(focused)}
              </View>
              <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>
                {TAB_LABELS[route.name] ?? route.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

// ─── Stacks ───────────────────────────────────────────────────────────────────

function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomeMain" component={HomeScreen} />
      <Stack.Screen name="SpaceDetails" component={SpaceDetailsScreen} />
      <Stack.Screen name="Booking" component={BookingScreen} />
      <Stack.Screen name="BookingSuccess" component={BookingSuccessScreen} />
      <Stack.Screen name="Favourites" component={FavouritesScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="PersonalDetails" component={PersonalDetailsScreen} />
    </Stack.Navigator>
  );
}

function BookingsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="BookingsMain" component={MyBookingsScreen} />
    </Stack.Navigator>
  );
}

function AccountStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AccountMain" component={ProfileScreen} />
      <Stack.Screen name="PersonalDetails" component={PersonalDetailsScreen} />
      <Stack.Screen name="Favourites" component={FavouritesScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
    </Stack.Navigator>
  );
}

// ─── Main Tabs ────────────────────────────────────────────────────────────────

function MainTabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Home" component={HomeStack} />
      <Tab.Screen name="Bookings" component={BookingsStack} />
      <Tab.Screen name="Account" component={AccountStack} />
    </Tab.Navigator>
  );
}

// ─── Root Navigation ──────────────────────────────────────────────────────────

function Navigation() {
  const { user, isGuest, initializing } = useAuth();

  if (initializing) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const isAuthenticated = !!user || isGuest;

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!isAuthenticated ? (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
          <Stack.Screen name="ForgetPassword" component={ForgetPasswordScreen} />
        </>
      ) : (
        <Stack.Screen name="MainTabs" component={MainTabs} />
      )}
    </Stack.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <AuthProvider>
      <FavouritesProvider>
        <NavigationContainer>
          <Navigation />
        </NavigationContainer>
      </FavouritesProvider>
    </AuthProvider>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  tabBarOuter: {
    paddingHorizontal: 16,
    paddingTop: 8,
    backgroundColor: COLORS.background,
  },
  tabBar: {
    flexDirection: "row",
    backgroundColor: "#111827",
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    paddingVertical: 10,
    paddingHorizontal: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 20,
    elevation: 20,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
  },
  iconPill: {
    width: 48,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  iconPillActive: {
    backgroundColor: "rgba(20,207,255,0.1)",
    borderWidth: 1,
    borderColor: "rgba(20,207,255,0.2)",
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: "#555",
    letterSpacing: 0.3,
  },
  tabLabelActive: {
    color: COLORS.primary,
  },
});
