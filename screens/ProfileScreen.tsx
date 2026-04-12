import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS } from "../constants/colors";
import { useAuth } from "../context/AuthContext";

const ProfileScreen = () => {
  const { logout, user } = useAuth();
  const insets = useSafeAreaInsets();

  const handleLogout = async () => {
    await logout();
  };

  // ✅ REAL USER DATA FROM FIREBASE
  const fullName = user?.displayName || "User";
  const email = user?.email || "No email";

  const initial = fullName?.charAt(0)?.toUpperCase() || "U";

  const menuItems = [
    {
      id: "1",
      icon: "👤",
      title: "Personal Details",
      subtitle: "Manage your account information",
    },
    {
      id: "2",
      icon: "💳",
      title: "Payment Methods",
      subtitle: "Cards and payment options",
    },
    {
      id: "3",
      icon: "🕘",
      title: "History",
      subtitle: "View your past bookings",
    },
    {
      id: "4",
      icon: "⚙️",
      title: "Settings",
      subtitle: "App preferences and options",
    },
    {
      id: "5",
      icon: "❓",
      title: "Help & Support",
      subtitle: "Get help or contact support",
    },
  ];

  return (
    <View style={[styles.safeArea, { paddingTop: insets.top }]}>
      <View style={styles.screen}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* HEADER */}
          <View style={styles.header}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initial}</Text>
            </View>

            <Text style={styles.name}>{fullName}</Text>
            <Text style={styles.email}>{email}</Text>
          </View>

          {/* MENU */}
          <View style={styles.section}>
            {menuItems.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.menuCard}
                activeOpacity={0.8}
              >
                <View style={styles.menuLeft}>
                  <View style={styles.iconWrapper}>
                    <Text style={styles.icon}>{item.icon}</Text>
                  </View>

                  <View style={styles.textWrapper}>
                    <Text style={styles.menuTitle}>{item.title}</Text>
                    <Text style={styles.menuSubtitle}>
                      {item.subtitle}
                    </Text>
                  </View>
                </View>

                <Text style={styles.arrow}>›</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* LOGOUT */}
          <TouchableOpacity
            style={styles.logoutButton}
            activeOpacity={0.8}
            onPress={handleLogout}
          >
            <Text style={styles.logoutText}>Log Out</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </View>
  );
};

export default ProfileScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingBottom: 120,
  },

  header: {
    alignItems: "center",
    paddingTop: 60,
    paddingBottom: 28,
    paddingHorizontal: 20,
  },

  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },

  avatarText: {
    fontSize: 30,
    fontWeight: "800",
    color: COLORS.black,
  },

  name: {
    fontSize: 24,
    fontWeight: "800",
    color: COLORS.textPrimary,
    marginBottom: 6,
  },

  email: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },

  section: {
    paddingHorizontal: 20,
    paddingBottom: 18,
  },

  menuCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    marginBottom: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  menuLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },

  iconWrapper: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: COLORS.background,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },

  icon: {
    fontSize: 20,
  },

  textWrapper: {
    flex: 1,
  },

  menuTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginBottom: 4,
  },

  menuSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },

  arrow: {
    fontSize: 24,
    color: COLORS.textSecondary,
  },

  logoutButton: {
    marginHorizontal: 20,
    marginBottom: 20,
    marginTop: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: "center",
    backgroundColor: COLORS.surface,
  },

  logoutText: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: "700",
  },
});