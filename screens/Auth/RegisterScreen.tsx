import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../../context/AuthContext";
import { COLORS } from "../../constants/colors";

const RegisterScreen = () => {
  const navigation = useNavigation<any>();
  const { register } = useAuth();
  const insets = useSafeAreaInsets();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState("");

  // ✅ VALIDATION (UPDATED)
  const validate = () => {
    const newErrors: Record<string, string> = {};

    // Name
    if (!name.trim()) {
      newErrors.name = "Name is required";
    }

    // Email
    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Invalid email address";
    }

    // Phone → EXACT 8 digits
    const phoneClean = phone.replace(/\D/g, "");
    if (!phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!/^\d{8}$/.test(phoneClean)) {
      newErrors.phone = "Phone number must be exactly 8 digits";
    }

    // Date of Birth → DD-MM-YYYY format
    if (!dateOfBirth.trim()) {
      newErrors.dateOfBirth = "Date of birth is required";
    } else if (!/^\d{2}-\d{2}-\d{4}$/.test(dateOfBirth)) {
      newErrors.dateOfBirth = "Date must be in DD-MM-YYYY format";
    }

    // Password → 8+ strong password
const passwordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

if (!password) {
  newErrors.password = "Password is required";
} else if (!passwordRegex.test(password)) {
  newErrors.password =
    "Password must be 8+ chars with uppercase, lowercase, number & symbol";
}

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;

    setLoading(true);
    setGeneralError("");

    const result = await register(
      name.trim(),
      email.trim().toLowerCase(),
      password,
      phone.trim(),
      dateOfBirth.trim()
    );

    setLoading(false);

    if (!result.success) {
      setGeneralError(result.error || "Registration failed.");
    }
  };

  const handleChange = (
    field: string,
    setter: (v: string) => void,
    value: string
  ) => {
    setter(value);

    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }

    if (generalError) {
      setGeneralError("");
    }
  };

  return (
    <View style={[styles.safeArea, { paddingTop: insets.top }]}>
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

          {/* NAME */}
          <View style={styles.fieldWrapper}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={[styles.input, !!errors.name && styles.inputError]}
              placeholder="Full Name"
              placeholderTextColor={COLORS.textMuted}
              value={name}
              onChangeText={(v) => handleChange("name", setName, v)}
            />
            {!!errors.name && (
              <Text style={styles.errorText}>{errors.name}</Text>
            )}
          </View>

          {/* EMAIL */}
          <View style={styles.fieldWrapper}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={[styles.input, !!errors.email && styles.inputError]}
              placeholder="name@example.com"
              placeholderTextColor={COLORS.textMuted}
              value={email}
              onChangeText={(v) => handleChange("email", setEmail, v)}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            {!!errors.email && (
              <Text style={styles.errorText}>{errors.email}</Text>
            )}
          </View>

          {/* PHONE */}
          <View style={styles.fieldWrapper}>
            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={[styles.input, !!errors.phone && styles.inputError]}
              placeholder="+973 33333333"
              placeholderTextColor={COLORS.textMuted}
              value={phone}
              onChangeText={(v) => handleChange("phone", setPhone, v)}
              keyboardType="number-pad"
              maxLength={8}
            />
            {!!errors.phone && (
              <Text style={styles.errorText}>{errors.phone}</Text>
            )}
          </View>

          {/* DATE OF BIRTH */}
          <View style={styles.fieldWrapper}>
            <Text style={styles.label}>Date of Birth</Text>
            <TextInput
              style={[styles.input, !!errors.dateOfBirth && styles.inputError]}
              placeholder="DD-MM-YYYY"
              placeholderTextColor={COLORS.textMuted}
              value={dateOfBirth}
              onChangeText={(v) => handleChange("dateOfBirth", setDateOfBirth, v)}
              keyboardType="numeric"
              maxLength={10}
            />
            {!!errors.dateOfBirth && (
              <Text style={styles.errorText}>{errors.dateOfBirth}</Text>
            )}
          </View>

          {/* PASSWORD */}
          <View style={styles.fieldWrapper}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>Password</Text>
              <TouchableOpacity
                onPress={() => setShowPassword((p) => !p)}
              >
                <Text style={styles.toggleText}>
                  {showPassword ? "Hide" : "Show"}
                </Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={[styles.input, !!errors.password && styles.inputError]}
              placeholder="Strong password"
              placeholderTextColor={COLORS.textMuted}
              value={password}
              onChangeText={(v) => handleChange("password", setPassword, v)}
              secureTextEntry={!showPassword}
            />

            <Text style={styles.hint}>
              8+ chars, uppercase, lowercase, number & symbol
            </Text>

            {!!errors.password && (
              <Text style={styles.errorText}>{errors.password}</Text>
            )}
          </View>

          {/* GENERAL ERROR */}
          {!!generalError && (
            <Text style={styles.generalError}>{generalError}</Text>
          )}

          {/* BUTTON */}
          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.black} />
            ) : (
              <Text style={styles.buttonText}>Create Account</Text>
            )}
          </TouchableOpacity>

          {/* LOGIN LINK */}
          <View style={styles.loginRow}>
            <Text style={styles.loginText}>
              Already have an account?{" "}
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate("Login")}>
              <Text style={styles.loginLink}>Sign in</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

export default RegisterScreen;

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: {
    paddingHorizontal: 28,
    paddingTop: 80,
    paddingBottom: 40,
  },

  title: {
    color: COLORS.textPrimary,
    fontSize: 30,
    fontWeight: "700",
    marginBottom: 6,
  },

  subtitle: {
    color: COLORS.textSecondary,
    fontSize: 15,
    marginBottom: 40,
  },

  fieldWrapper: {
    marginBottom: 20,
  },

  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },

  label: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: "600",
  },

  toggleText: {
    color: COLORS.textSecondary,
    fontSize: 13,
  },

  input: {
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 50,
    color: COLORS.textPrimary,
  },

  inputError: {
    borderColor: COLORS.danger,
  },

  errorText: {
    color: COLORS.danger,
    fontSize: 12,
    marginTop: 4,
  },

  generalError: {
    color: COLORS.danger,
    textAlign: "center",
    marginBottom: 16,
  },

  hint: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 6,
  },

  button: {
    height: 52,
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },

  buttonDisabled: {
    opacity: 0.6,
  },

  buttonText: {
    color: COLORS.black,
    fontSize: 15,
    fontWeight: "700",
  },

  loginRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 20,
  },

  loginText: {
    color: COLORS.textSecondary,
  },

  loginLink: {
    color: COLORS.primary,
    fontWeight: "600",
  },
});