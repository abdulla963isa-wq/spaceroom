import React, { useState } from "react";
import {
  Alert,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { COLORS } from "../constants/colors";

// ─── Constants — replace with your real URLs ──────────────────────────────────

const APP_STORE_URL = "https://apps.apple.com/app/idYOUR_APP_ID";
const PLAY_STORE_URL =
  "https://play.google.com/store/apps/details?id=YOUR_PACKAGE_NAME";
const TERMS_URL = "https://yourapp.com/terms";
const PRIVACY_URL = "https://yourapp.com/privacy";

// ─── Types ────────────────────────────────────────────────────────────────────

type SettingToggleItem = {
  kind: "toggle";
  id: string;
  icon: string;
  title: string;
  subtitle: string;
  key: string;
};

type SettingActionItem = {
  kind: "action";
  id: string;
  icon: string;
  title: string;
  subtitle: string;
  onPress: () => void;
  danger?: boolean;
};

type SettingItem = SettingToggleItem | SettingActionItem;

type SettingSection = {
  title: string;
  items: SettingItem[];
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const openURL = async (url: string) => {
  const supported = await Linking.canOpenURL(url);
  if (supported) {
    await Linking.openURL(url);
  } else {
    Alert.alert("Error", "Unable to open this link.");
  }
};

// ─── Component ────────────────────────────────────────────────────────────────

const SettingsScreen = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();

  const [toggles, setToggles] = useState<Record<string, boolean>>({
    pushNotifications: true,
    emailNotifications: false,
    bookingReminders: true,
    promotions: false,
    locationServices: true,
    biometrics: false,
    darkMode: true,
  });

  const setToggle = (key: string, value: boolean) => {
    setToggles((prev) => ({ ...prev, [key]: value }));
  };

  // ── Action Handlers ───────────────────────────────────────────────────────

  const handleChangePassword = () => {
    Alert.alert(
      "Change Password",
      "We'll send a password reset link to your registered email address.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Send Link",
          onPress: () => {
            // TODO: call auth.sendPasswordResetEmail(user.email)
            Alert.alert(
              "Link Sent ✓",
              "Check your inbox and follow the instructions to reset your password."
            );
          },
        },
      ]
    );
  };

  const handleTwoFactor = () => {
    Alert.alert(
      "Two-Factor Authentication",
      "2FA adds an extra layer of security to your account. Once enabled, you'll be asked for a verification code each time you sign in.",
      [
        { text: "Not Now", style: "cancel" },
        {
          text: "Enable",
          onPress: () => {
            // TODO: navigation.navigate("TwoFactorSetup");
            Alert.alert(
              "Coming Soon",
              "2FA setup will be available in the next update."
            );
          },
        },
      ]
    );
  };

  const handleRateApp = () => {
    const url = Platform.OS === "ios" ? APP_STORE_URL : PLAY_STORE_URL;
    openURL(url);
  };

  const handleTerms = () => openURL(TERMS_URL);

  const handlePrivacy = () => openURL(PRIVACY_URL);

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "This will permanently delete your account and all associated data. This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete My Account",
          style: "destructive",
          onPress: () => {
            Alert.alert(
              "Are you absolutely sure?",
              "You will lose all your bookings, favourites, and profile data.",
              [
                { text: "Keep My Account", style: "cancel" },
                {
                  text: "Yes, Delete",
                  style: "destructive",
                  onPress: () => {
                    // TODO: call your account deletion API here
                    // e.g. user.delete() for Firebase Auth, then:
                    // navigation.reset({ index: 0, routes: [{ name: "Auth" }] });
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  // ── Sections ──────────────────────────────────────────────────────────────

  const sections: SettingSection[] = [
    {
      title: "Notifications",
      items: [
        {
          kind: "toggle",
          id: "n1",
          icon: "🔔",
          title: "Push Notifications",
          subtitle: "Receive alerts on your device",
          key: "pushNotifications",
        },
        {
          kind: "toggle",
          id: "n2",
          icon: "📧",
          title: "Email Notifications",
          subtitle: "Get updates sent to your email",
          key: "emailNotifications",
        },
        {
          kind: "toggle",
          id: "n3",
          icon: "⏰",
          title: "Booking Reminders",
          subtitle: "Remind me before a booking starts",
          key: "bookingReminders",
        },
        {
          kind: "toggle",
          id: "n4",
          icon: "🎁",
          title: "Promotions & Offers",
          subtitle: "Deals and special offers",
          key: "promotions",
        },
      ],
    },
    {
      title: "Privacy & Security",
      items: [
        {
          kind: "toggle",
          id: "p1",
          icon: "📍",
          title: "Location Services",
          subtitle: "Allow app to access your location",
          key: "locationServices",
        },
        {
          kind: "toggle",
          id: "p2",
          icon: "🔐",
          title: "Biometric Login",
          subtitle: "Use Face ID or fingerprint to sign in",
          key: "biometrics",
        },
        {
          kind: "action",
          id: "p3",
          icon: "🔑",
          title: "Change Password",
          subtitle: "Update your account password",
          onPress: handleChangePassword,
        },
        {
          kind: "action",
          id: "p4",
          icon: "🛡️",
          title: "Two-Factor Authentication",
          subtitle: "Add an extra layer of security",
          onPress: handleTwoFactor,
        },
      ],
    },
    {
      title: "Appearance",
      items: [
        {
          kind: "toggle",
          id: "a1",
          icon: "🌙",
          title: "Dark Mode",
          subtitle: "Use dark theme throughout the app",
          key: "darkMode",
        },
      ],
    },
    {
      title: "About",
      items: [
        {
          kind: "action",
          id: "ab1",
          icon: "⭐",
          title: "Rate the App",
          subtitle: "Enjoying the app? Leave us a review",
          onPress: handleRateApp,
        },
        {
          kind: "action",
          id: "ab2",
          icon: "📄",
          title: "Terms of Service",
          subtitle: "Read our terms and conditions",
          onPress: handleTerms,
        },
        {
          kind: "action",
          id: "ab3",
          icon: "🔏",
          title: "Privacy Policy",
          subtitle: "How we handle your data",
          onPress: handlePrivacy,
        },
        {
          kind: "action",
          id: "ab4",
          icon: "ℹ️",
          title: "App Version",
          subtitle: "Version 1.0.0 (Build 42)",
          onPress: () => {}, // info only — intentionally no action
        },
      ],
    },
    {
      title: "Remove account",
      items: [
        {
          kind: "action",
          id: "d1",
          icon: "🗑️",
          title: "Delete Account",
          subtitle: "Permanently remove your account and data",
          danger: true,
          onPress: handleDeleteAccount,
        },
      ],
    },
  ];

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <View style={[styles.safeArea, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Settings</Text>
        </View>

        {/* Sections */}
        {sections.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionLabel}>{section.title}</Text>
            <View style={styles.sectionCard}>
              {section.items.map((item, index) => {
                const isLast = index === section.items.length - 1;

                if (item.kind === "toggle") {
                  return (
                    <View
                      key={item.id}
                      style={[styles.row, !isLast && styles.rowBorder]}
                    >
                      <View style={styles.rowLeft}>
                        <View style={styles.iconWrapper}>
                          <Text style={styles.icon}>{item.icon}</Text>
                        </View>
                        <View style={styles.textWrapper}>
                          <Text style={styles.rowTitle}>{item.title}</Text>
                          <Text style={styles.rowSubtitle}>{item.subtitle}</Text>
                        </View>
                      </View>
                      <Switch
                        value={toggles[item.key]}
                        onValueChange={(val) => setToggle(item.key, val)}
                        trackColor={{
                          false: COLORS.border,
                          true: COLORS.primary,
                        }}
                        thumbColor={toggles[item.key] ? COLORS.black : "#888"}
                        ios_backgroundColor={COLORS.border}
                      />
                    </View>
                  );
                }

                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.row, !isLast && styles.rowBorder]}
                    onPress={item.onPress}
                    activeOpacity={0.7}
                  >
                    <View style={styles.rowLeft}>
                      <View
                        style={[
                          styles.iconWrapper,
                          item.danger && styles.iconWrapperDanger,
                        ]}
                      >
                        <Text style={styles.icon}>{item.icon}</Text>
                      </View>
                      <View style={styles.textWrapper}>
                        <Text
                          style={[
                            styles.rowTitle,
                            item.danger && styles.rowTitleDanger,
                          ]}
                        >
                          {item.title}
                        </Text>
                        <Text style={styles.rowSubtitle}>{item.subtitle}</Text>
                      </View>
                    </View>
                    {!item.danger && <Text style={styles.arrow}>›</Text>}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))}

        <View style={styles.footer}>
          <Text style={styles.footerText}></Text>
        </View>
      </ScrollView>
    </View>
  );
};

export default SettingsScreen;

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingBottom: 60,
  },

  // ── Header ──────────────────────────────────────────────────────────────────
  header: {
    paddingHorizontal: 20,
    paddingTop: 32,
    paddingBottom: 20,
  },
  backButton: {
    alignSelf: "flex-start",
    marginBottom: 20,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    width: 46,
    height: 46,
    justifyContent: "center",
    alignItems: "center",
  },
  backArrow: {
    fontSize: 22,
    color: COLORS.textPrimary,
    fontWeight: "600",
    lineHeight: 26,
  },
  smallLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.primary,
    marginBottom: 8,
  },
  title: {
    fontSize: 30,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },

  // ── Section ─────────────────────────────────────────────────────────────────
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 1.2,
    marginBottom: 10,
    paddingLeft: 4,
  },
  sectionCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: "hidden",
  },

  // ── Row ─────────────────────────────────────────────────────────────────────
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 12,
  },
  iconWrapper: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: COLORS.background,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  iconWrapperDanger: {
    backgroundColor: "rgba(229, 57, 53, 0.12)",
  },
  icon: {
    fontSize: 18,
  },
  textWrapper: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  rowTitleDanger: {
    color: "#E53935",
  },
  rowSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 16,
  },
  arrow: {
    fontSize: 22,
    color: COLORS.textSecondary,
  },

  // ── Footer ──────────────────────────────────────────────────────────────────
  footer: {
    alignItems: "center",
    paddingVertical: 20,
  },
  footerText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
});
