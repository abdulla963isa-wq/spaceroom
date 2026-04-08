import React from "react";
import { Text, TouchableOpacity, View, StyleSheet } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { enableScreens } from "react-native-screens";
import { COLORS } from "../constants/colors";

enableScreens();

import MyBookingsScreen from "../screens/MyBookingsScreen";
import ProfileScreen from "../screens/ProfileScreen";
import SpaceDetailsScreen from "../screens/SpaceDetailsScreen";
import BookingScreen from "../screens/BookingScreen";
import BookingSuccessScreen from "../screens/BookingSuccessScreen";
import RegisterScreen from "../screens/Auth/RegisterScreen";

export type RootStackParamList = {
  MainTabs: undefined;
  SpaceDetails: undefined;
  Booking: undefined;
  BookingSuccess: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Bookings: undefined;
  Account: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

function CustomTabBar({ state, navigation }: any) {
  const tabs = [
    { name: "Home", icon: "⌂" },
    { name: "Bookings", icon: "🕘" },
    { name: "Account", icon: "👤" },
  ];

  return (
    <View style={styles.bottomTabBar}>
      {tabs.map((tab, index) => {
        const isFocused = state.index === index;

        return (
          <TouchableOpacity
            key={tab.name}
            style={[styles.tabItem, isFocused && styles.activeTab]}
            onPress={() => navigation.navigate(tab.name)}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabIcon, isFocused && styles.activeTabText]}>
              {tab.icon}
            </Text>
            <Text style={[styles.tabText, isFocused && styles.activeTabText]}>
              {tab.name}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <CustomTabBar {...props} />}
    >
      <Tab.Screen name="Home" component={RegisterScreen} />
      <Tab.Screen name="Bookings" component={MyBookingsScreen} />
      <Tab.Screen name="Account" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="MainTabs" component={MainTabs} />
        <Stack.Screen name="SpaceDetails" component={SpaceDetailsScreen} />
        <Stack.Screen name="Booking" component={BookingScreen} />
        <Stack.Screen name="BookingSuccess" component={BookingSuccessScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  bottomTabBar: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 12,
    paddingHorizontal: 10,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
    borderRadius: 18,
  },
  activeTab: {
    backgroundColor: COLORS.primary,
  },
  tabIcon: {
    fontSize: 18,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  tabText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: "500",
  },
  activeTabText: {
    color: COLORS.black,
    fontWeight: "700",
  },
});