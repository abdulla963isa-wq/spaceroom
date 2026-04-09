import React, { useState } from "react";
import {
  ActivityIndicator,
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

const RegisterScreen = () => {
  const navigation = useNavigation<any>();
  const { register } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState("");

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = "Name is required";
    if (!email.trim()) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = "Invalid email address";
    if (!phone.trim()) newErrors.phone = "Phone number is required";
    else if (!/^\+?[\d\s\-]{8,}$/.test(phone)) newErrors.phone = "Invalid phone number";
    if (!password) newErrors.password = "Password is required";
    else if (password.length < 8) newErrors.password = "Password must be at least 8 characters";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    setLoading(true);
    setGeneralError("");
    const result = await register(name.trim(), email.trim(), password);
    setLoading(false);
    if (result.success) {
      navigation.navigate("SpaceDetails");
    } else {
      setGeneralError(result.error || "Registration failed. Please try again.");
    }
  };

  const handleChange = (field: string, setter: (v: string) => void, value: string) => {
    setter(value);
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
    if (generalError) setGeneralError("");
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
          <Text style={styles.title}>Create account</Text>
          <Text style={styles.subtitle}>Join Spaceroom today</Text>

          {/* Name */}
          <View style={styles.fieldWrapper}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={[styles.input, !!errors.name && styles.inputError]}
              placeholder="John Doe"
              placeholderTextColor={COLORS.textMuted}
              value={name}
              onChangeText={(v) => handleChange("name", setName, v)}
              autoCapitalize="words"
            />
            {!!errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
          </View>

          {/* Email */}
          <View style={styles.fieldWrapper}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={[styles.input, !!errors.email && styles.inputError]}
              placeholder="john@example.com"
              placeholderTextColor={COLORS.textMuted}
              value={email}
              onChangeText={(v) => handleChange("email", setEmail, v)}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            {!!errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
          </View>

          {/* Phone */}
          <View style={styles.fieldWrapper}>
            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={[styles.input, !!errors.phone && styles.inputError]}
              placeholder="+973 3300 0000"
              placeholderTextColor={COLORS.textMuted}
              value={phone}
              onChangeText={(v) => handleChange("phone", setPhone, v)}
              keyboardType="phone-pad"
            />
            {!!errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
          </View>

          {/* Password */}
          <View style={styles.fieldWrapper}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>Password</Text>
              <TouchableOpacity onPress={() => setShowPassword((p) => !p)}>
                <Text style={styles.toggleText}>{showPassword ? "Hide" : "Show"}</Text>
              </TouchableOpacity>
            </View>
            <TextInput
              style={[styles.input, !!errors.password && styles.inputError]}
              placeholder="Min. 8 characters"
              placeholderTextColor={COLORS.textMuted}
              value={password}
              onChangeText={(v) => handleChange("password", setPassword, v)}
              secureTextEntry={!showPassword}
            />
            {!!errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
          </View>

          {!!generalError && <Text style={styles.generalError}>{generalError}</Text>}

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleRegister}
            activeOpacity={0.85}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.black} />
            ) : (
              <Text style={styles.buttonText}>Create Account</Text>
            )}
          </TouchableOpacity>

          <View style={styles.loginRow}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate("Login")}>
              <Text style={styles.loginLink}>Sign in</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default RegisterScreen;

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
  inputError: { borderColor: COLORS.danger },
  errorText: { color: COLORS.danger, fontSize: 12, marginTop: 4, fontWeight: "500" },
  generalError: { color: COLORS.danger, fontSize: 13, marginBottom: 16, textAlign: "center", fontWeight: "500" },
  button: { height: 52, backgroundColor: COLORS.primary, borderRadius: 14, alignItems: "center", justifyContent: "center", marginBottom: 24, marginTop: 8 },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: COLORS.black, fontSize: 15, fontWeight: "700", letterSpacing: 0.2 },
  loginRow: { flexDirection: "row", justifyContent: "center" },
  loginText: { color: COLORS.textSecondary, fontSize: 14 },
  loginLink: { color: COLORS.primary, fontSize: 14, fontWeight: "600" },
});
