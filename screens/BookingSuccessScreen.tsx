import React from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS } from "../constants/colors";
import { useNavigation } from "@react-navigation/native";

const BookingSuccessScreen = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const booking = {
    venueName: "Diwan Hub, Adliya",
    spaceName: "Board Room",
    date: "14 Apr 2026",
    time: "10:00 AM",
    duration: "2 hours",
    total: "BHD 28.60",
    bookingId: "SR-48291",
  };

  return (
    <View style={[styles.safeArea, { paddingTop: insets.top }]}>
      <View style={styles.container}>
        <View style={styles.iconWrapper}>
          <Text style={styles.checkIcon}>✓</Text>
        </View>

        <Text style={styles.title}>Booking Confirmed</Text>
        <Text style={styles.subtitle}>
          Your space has been successfully reserved.
        </Text>

        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.label}>Venue</Text>
            <Text style={styles.value}>{booking.venueName}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Space</Text>
            <Text style={styles.value}>{booking.spaceName}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Date</Text>
            <Text style={styles.value}>{booking.date}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Time</Text>
            <Text style={styles.value}>{booking.time}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Duration</Text>
            <Text style={styles.value}>{booking.duration}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Booking ID</Text>
            <Text style={styles.value}>{booking.bookingId}</Text>
          </View>

          <View style={[styles.row, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total Paid</Text>
            <Text style={styles.totalValue}>{booking.total}</Text>
          </View>
        </View>

       <TouchableOpacity
  style={styles.primaryButton}
  activeOpacity={0.8}
  onPress={() => navigation.navigate("MainTabs", { screen: "Bookings" })}
>
  <Text style={styles.primaryButtonText}>View Booking</Text>
</TouchableOpacity>

<TouchableOpacity
  style={styles.secondaryButton}
  activeOpacity={0.8}
  onPress={() => navigation.navigate("MainTabs", { screen: "Home" })}
>
  <Text style={styles.secondaryButtonText}>Back to Home</Text>
</TouchableOpacity>
      </View>
    </View>
  );
};

export default BookingSuccessScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: "center",
    backgroundColor: COLORS.background,
  },
  iconWrapper: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: "rgba(18, 207, 255, 0.14)",
    borderWidth: 2,
    borderColor: COLORS.primary,
    alignSelf: "center",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  checkIcon: {
    fontSize: 42,
    fontWeight: "800",
    color: COLORS.primary,
  },
  title: {
    fontSize: 30,
    fontWeight: "700",
    color: COLORS.textPrimary,
    textAlign: "center",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: COLORS.textSecondary,
    textAlign: "center",
    marginBottom: 28,
    paddingHorizontal: 10,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 18,
    marginBottom: 28,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingVertical: 10,
  },
  label: {
    fontSize: 14,
    color: COLORS.textSecondary,
    flex: 1,
    marginRight: 12,
  },
  value: {
    fontSize: 14,
    color: COLORS.textPrimary,
    fontWeight: "600",
    flex: 1.2,
    textAlign: "right",
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    marginTop: 8,
    paddingTop: 16,
  },
  totalLabel: {
    fontSize: 17,
    fontWeight: "800",
    color: COLORS.textPrimary,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.primary,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 18,
    alignItems: "center",
    marginBottom: 12,
  },
  primaryButtonText: {
    color: COLORS.black,
    fontSize: 16,
    fontWeight: "700",
  },
  secondaryButton: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 16,
    borderRadius: 18,
    alignItems: "center",
  },
  secondaryButtonText: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: "700",
  },
});