import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { COLORS } from "../constants/colors";

type BottomNavProps = {
  activeTab: "Home" | "My Bookings" | "Account";
};

const BottomNav = ({ activeTab }: BottomNavProps) => {
  return (
    <View style={styles.bottomTabBar}>
      <TouchableOpacity
        style={[styles.tabItem, activeTab === "Home" && styles.activeTab]}
        activeOpacity={0.8}
      >
        <Text style={[styles.tabIcon, activeTab === "Home" && styles.activeTabText]}>
          ⌂
        </Text>
        <Text style={[styles.tabText, activeTab === "Home" && styles.activeTabText]}>
          Home
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.tabItem, activeTab === "My Bookings" && styles.activeTab]}
        activeOpacity={0.8}
      >
        <Text
          style={[styles.tabIcon, activeTab === "My Bookings" && styles.activeTabText]}
        >
          🗓️
        </Text>
        <Text
          style={[styles.tabText, activeTab === "My Bookings" && styles.activeTabText]}
        >
          My Bookings
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.tabItem, activeTab === "Account" && styles.activeTab]}
        activeOpacity={0.8}
      >
        <Text
          style={[styles.tabIcon, activeTab === "Account" && styles.activeTabText]}
        >
          👤
        </Text>
        <Text
          style={[styles.tabText, activeTab === "Account" && styles.activeTabText]}
        >
          Account
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default BottomNav;

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