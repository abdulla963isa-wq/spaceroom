import React, { useState, useEffect } from "react";
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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import auth from "@react-native-firebase/auth";
import { COLORS } from "../constants/colors";
import { useAuth } from "../context/AuthContext";

const PersonalDetailsScreen = () => {
  const { user, getUserProfile, updateUserProfile } = useAuth();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();

  const [name, setName] = useState(user?.displayName || "");
  const [email] = useState(user?.email || "");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      if (user) {
        const profile = await getUserProfile();
        if (profile) {
          setDateOfBirth(profile.dateOfBirth || "");
          setPhoneNumber(profile.phoneNumber || "");
        }
      }
      setInitialLoading(false);
    };
    loadProfile();
  }, [user, getUserProfile]);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("Error", "Name cannot be empty");
      return;
    }

    try {
      setLoading(true);
      await auth().currentUser?.updateProfile({
        displayName: name.trim(),
      });
      await updateUserProfile({
        dateOfBirth: dateOfBirth.trim(),
        phoneNumber: phoneNumber.trim(),
      });
      await auth().currentUser?.reload();
      Alert.alert("Success", "Profile updated successfully");
      navigation.goBack();
    } catch (error) {
      Alert.alert("Error", "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <View style={[styles.safeArea, { paddingTop: insets.top }, styles.center]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.safeArea, { paddingTop: insets.top }]}>
      <View style={styles.screen}>
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backText}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Personal Details</Text>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* FORM */}
          <View style={styles.section}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Enter your full name"
              placeholderTextColor={COLORS.textSecondary}
            />

            <Text style={styles.label}>Email</Text>
            <TextInput
              style={[styles.input, styles.readOnlyInput]}
              value={email}
              editable={false}
              placeholder="Your email"
              placeholderTextColor={COLORS.textSecondary}
            />

            <Text style={styles.label}>Date of Birth</Text>
            <TextInput
              style={styles.input}
              value={dateOfBirth}
              onChangeText={setDateOfBirth}
              placeholder="DD-MM-YYYY"
              placeholderTextColor={COLORS.textSecondary}
              keyboardType="numeric"
            />

            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={styles.input}
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              placeholder="Enter your phone number"
              placeholderTextColor={COLORS.textSecondary}
              keyboardType="phone-pad"
            />
          </View>

          {/* SAVE BUTTON */}
          <TouchableOpacity
            style={[styles.saveButton, loading && styles.disabledButton]}
            onPress={handleSave}
            disabled={loading}
          >
            <Text >
              {loading ? "Saving..." : "Save Changes"}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </View>
  );
};

export default PersonalDetailsScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  backText: {
    fontSize: 24,
    color: COLORS.textPrimary,
    fontWeight: "600",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.textPrimary,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 120,
  },
  section: {
    marginBottom: 32,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: COLORS.textPrimary,
    marginBottom: 20,
  },
  readOnlyInput: {
    backgroundColor: "#0A0A0A",
    borderColor: "#1A1A1A",
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 24,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 20,
  },
  disabledButton: {
    opacity: 0.6,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});