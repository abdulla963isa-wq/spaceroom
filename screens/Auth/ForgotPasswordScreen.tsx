import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import auth from "@react-native-firebase/auth";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { COLORS } from "../../constants/colors";

const ForgetPasswordScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleResetPassword = async () => {
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      setError("Please enter your email");
      return;
    }

    try {
      setLoading(true);
      setError("");

      // 🔥 STANDARD Firebase password reset
      await auth().sendPasswordResetEmail(cleanEmail);

      setLoading(false);

      Alert.alert(
        "Email Sent",
        "If an account exists, a password reset link has been sent to your email."
      );
    } catch (e: any) {
      setLoading(false);

      // ⚠️ Do NOT expose "email not found"
      setError("Something went wrong. Please try again.");
    }
  };

  return (
    <View style={[styles.safeArea, { paddingTop: insets.top }]}>
      {/* BACK BUTTON */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Text style={styles.backArrow}>←</Text>
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Forgot Password</Text>

        <Text style={styles.subtitle}>
          Enter your email and we'll send you a reset link
        </Text>

        {/* EMAIL INPUT */}
        <View style={styles.fieldWrapper}>
          <Text style={styles.label}>Email</Text>

          <TextInput
            style={styles.input}
            placeholder="john@example.com"
            placeholderTextColor={COLORS.textMuted}
            value={email}
            onChangeText={(v) => {
              setEmail(v);
              setError("");
            }}
            autoCapitalize="none"
            keyboardType="email-address"
          />
        </View>

        {/* ERROR */}
        {!!error && <Text style={styles.error}>{error}</Text>}

        {/* BUTTON */}
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleResetPassword}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.black} />
          ) : (
            <Text style={styles.buttonText}>Send Reset Link</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

export default ForgetPasswordScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  backButton: {
    marginTop: 12,
    marginLeft: 20,
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    alignItems: "center",
    justifyContent: "center",
  },

  backArrow: {
    fontSize: 20,
    color: COLORS.textPrimary,
    lineHeight: 22,
  },

  container: {
    paddingHorizontal: 28,
    paddingTop: 40,
  },

  title: {
    fontSize: 30,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginBottom: 10,
  },

  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 30,
  },

  fieldWrapper: {
    marginBottom: 18,
  },

  label: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.textPrimary,
    marginBottom: 6,
  },

  input: {
    height: 50,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    paddingHorizontal: 16,
    backgroundColor: COLORS.surface,
    color: COLORS.textPrimary,
  },

  button: {
    height: 52,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },

  buttonDisabled: {
    opacity: 0.6,
  },

  buttonText: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.black,
  },

  error: {
    color: COLORS.danger,
    marginBottom: 10,
    fontSize: 13,
  },
});