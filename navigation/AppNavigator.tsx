import React from "react";
import { ActivityIndicator, View, Text } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { enableScreens } from "react-native-screens";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { COLORS } from "../constants/colors";
import { AuthProvider, useAuth } from "../context/AuthContext";

import HomeScreen from "../screens/HomeScreen";
import MyBookingsScreen from "../screens/MyBookingsScreen";
import ProfileScreen from "../screens/ProfileScreen";
import SpaceDetailsScreen from "../screens/SpaceDetailsScreen";
import BookingScreen from "../screens/BookingScreen";
import BookingSuccessScreen from "../screens/BookingSuccessScreen";
import LoginScreen from "../screens/Auth/LoginScreen";
import RegisterScreen from "../screens/Auth/RegisterScreen";
import ForgetPasswordScreen from "../screens/Auth/ForgotPasswordScreen";

enableScreens();

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: "#14cfff",
        tabBarInactiveTintColor: "#888",
        tabBarStyle: {
          backgroundColor: "#141414",
          borderTopColor: "#141414",
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ focused, color }) => (
            <View
              style={{
                width: 32,
                height: 32,
                borderRadius: 6,
                justifyContent: "center",
                alignItems: "center",
                backgroundColor: focused ? "#14cfff" : "transparent",
              }}
            >
              <Text style={{ fontSize: 16, color: focused ? "#141414" : color }}>
                ⌂
              </Text>
            </View>
          ),
        }}
      />

      <Tab.Screen
        name="Bookings"
        component={MyBookingsScreen}
        options={{
          tabBarIcon: ({ focused, color }) => (
            <View
              style={{
                width: 32,
                height: 32,
                borderRadius: 6,
                justifyContent: "center",
                alignItems: "center",
                backgroundColor: focused ? "#14cfff" : "transparent",
              }}
            >
              <Text style={{ fontSize: 16, color: focused ? "#141414" : color }}>
                🕘
              </Text>
            </View>
          ),
        }}
      />

      <Tab.Screen
        name="Account"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ focused, color }) => (
            <View
              style={{
                width: 32,
                height: 32,
                borderRadius: 6,
                justifyContent: "center",
                alignItems: "center",
                backgroundColor: focused ? "#14cfff" : "transparent",
              }}
            >
              <Text style={{ fontSize: 16, color: focused ? "#141414" : color }}>
                👤
              </Text>
            </View>
          ),
        }}
      />
    </Tab.Navigator>
  );
}

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
        <>
          <Stack.Screen name="MainTabs" component={MainTabs} />
          <Stack.Screen name="SpaceDetails" component={SpaceDetailsScreen} />
          <Stack.Screen name="Booking" component={BookingScreen} />
          <Stack.Screen name="BookingSuccess" component={BookingSuccessScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <NavigationContainer>
          <Navigation />
        </NavigationContainer>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}