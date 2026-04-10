import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "../../context/AuthContext";
import { COLORS } from "../../constants/colors";

const LoginScreen = () => {
  const navigation = useNavigation<any>();
  const { login, continueAsGuest } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
  if (!email.trim() || !password.trim()) {
    setError("Please fill in all fields");
    return;
  }

  setLoading(true);
  setError("");

  const result = await login(email.trim(), password);

  setLoading(false);

  if (!result.success) {
    setError(result.error || "Login failed");
  }

  // ✅ NO navigation.navigate here
};
  const handleGuest = () => {
    console.log("Guest button pressed");
    continueAsGuest();
  };

const handleForgotPassword = () => {
  navigation.navigate("ForgetPassword");
};

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>Welcome back</Text>
          <Text style={styles.subtitle}>Sign in to your account</Text>

          <View style={styles.fieldWrapper}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="john@example.com"
              placeholderTextColor={COLORS.textMuted}
              value={email}
              onChangeText={(v) => { setEmail(v); setError(""); }}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.fieldWrapper}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>Password</Text>
              <TouchableOpacity onPress={() => setShowPassword((p) => !p)}>
                <Text style={styles.toggleText}>{showPassword ? "Hide" : "Show"}</Text>
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.input}
              placeholder="Your password"
              placeholderTextColor={COLORS.textMuted}
              value={password}
              onChangeText={(v) => { setPassword(v); setError(""); }}
              secureTextEntry={!showPassword}
            />
          </View>

<TouchableOpacity onPress={handleForgotPassword} style={styles.forgotWrapper}>
  <Text style={styles.forgotText}>Forgot password?</Text>
</TouchableOpacity>

          {!!error && <Text style={styles.errorText}>{error}</Text>}

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            activeOpacity={0.85}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.black} />
            ) : (
              <Text style={styles.buttonText}>Sign In</Text>
            )}
          </TouchableOpacity>

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity
            style={styles.guestButton}
            onPress={handleGuest}
            activeOpacity={0.85}
          >
            <Text style={styles.guestButtonText}>Continue as Guest</Text>
          </TouchableOpacity>

          <View style={styles.registerRow}>
            <Text style={styles.registerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate("Register")}>
              <Text style={styles.registerLink}>Sign up</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { paddingHorizontal: 28, paddingTop: 80, paddingBottom: 40 },
  title: { color: COLORS.textPrimary, fontSize: 30, fontWeight: "700", letterSpacing: -0.5, marginBottom: 6 },
  subtitle: { color: COLORS.textSecondary, fontSize: 15, marginBottom: 40 },
  fieldWrapper: { marginBottom: 20 },
  labelRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  label: { color: COLORS.textPrimary, fontSize: 13, fontWeight: "600", marginBottom: 6 },
  toggleText: { color: COLORS.textSecondary, fontSize: 13 },
  input: { backgroundColor: COLORS.surface, borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 12, paddingHorizontal: 16, height: 50, fontSize: 15, color: COLORS.textPrimary },
  forgotWrapper: { alignSelf: "flex-end", marginTop: -10, marginBottom: 20 },
  forgotText: { color: COLORS.primary, fontSize: 13, fontWeight: "500" },
  errorText: { color: COLORS.danger, fontSize: 13, marginBottom: 16, fontWeight: "500" },
  button: { height: 52, backgroundColor: COLORS.primary, borderRadius: 14, alignItems: "center", justifyContent: "center", marginBottom: 24, marginTop: 8 },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: COLORS.black, fontSize: 15, fontWeight: "700", letterSpacing: 0.2 },
  dividerRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 20 },
  dividerLine: { flex: 1, height: 1, backgroundColor: COLORS.border },
  dividerText: { color: COLORS.textMuted, fontSize: 13 },
  guestButton: { height: 52, backgroundColor: "transparent", borderRadius: 14, borderWidth: 1.5, borderColor: COLORS.border, alignItems: "center", justifyContent: "center", marginBottom: 32 },
  guestButtonText: { color: COLORS.textSecondary, fontSize: 15, fontWeight: "600" },
  registerRow: { flexDirection: "row", justifyContent: "center" },
  registerText: { color: COLORS.textSecondary, fontSize: 14 },
  registerLink: { color: COLORS.primary, fontSize: 14, fontWeight: "600" },
});