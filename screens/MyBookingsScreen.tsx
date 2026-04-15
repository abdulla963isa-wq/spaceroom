import React, { useState } from "react";
import {
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS } from "../constants/colors";

const diwanImg = require("../assets/images/diwan.jpg");
const savoyImg = require("../assets/images/savoy.jpg");

type Booking = {
  id: string;
  venueName: string;
  spaceName: string;
  date: string;
  time: string;
  duration: string;
  status: string;
  price: string;
  image: any;
};

const MyBookingsScreen = () => {
  const [activeTab, setActiveTab] = useState<"Upcoming" | "Past">("Upcoming");
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const insets = useSafeAreaInsets();

  const upcomingBookings: Booking[] = [
    {
      id: "1",
      venueName: "Diwan Hub, Adliya",
      spaceName: "Meeting Room",
      date: "14 Apr 2026",
      time: "10:00 AM",
      duration: "2 hours",
      status: "Confirmed",
      price: "BHD 11.00",
      image: diwanImg,
    },
    {
      id: "2",
      venueName: "Savoy Hotel Lounge",
      spaceName: "Private Lounge",
      date: "18 Apr 2026",
      time: "6:30 PM",
      duration: "3 hours",
      status: "Confirmed",
      price: "BHD 24.00",
      image: savoyImg,
    },
  ];

  const pastBookings: Booking[] = [
    {
      id: "3",
      venueName: "Diwan Hub, Adliya",
      spaceName: "Board Room",
      date: "02 Apr 2026",
      time: "1:00 PM",
      duration: "1 hour",
      status: "Completed",
      price: "BHD 14.30",
      image: diwanImg,
    },
  ];

  const bookings = activeTab === "Upcoming" ? upcomingBookings : pastBookings;

  const detailRows = (booking: Booking) => [
    { label: "Booking ID", value: `#BK-2026-00${booking.id}` },
    { label: "Date", value: booking.date },
    { label: "Time", value: booking.time },
    { label: "Duration", value: booking.duration },
    { label: "Status", value: booking.status, isStatus: true },
    { label: "Total paid", value: booking.price, isPrice: true },
  ];

  return (
    <View style={[styles.safeArea, { paddingTop: insets.top }]}>
      <View style={styles.screen}>
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.title}>My Bookings</Text>
            <Text style={styles.subtitle}>
              View your upcoming and past reservations
            </Text>
          </View>

          <View style={styles.switchWrapper}>
            <TouchableOpacity
              style={[
                styles.switchButton,
                activeTab === "Upcoming" && styles.activeSwitchButton,
              ]}
              onPress={() => setActiveTab("Upcoming")}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.switchText,
                  activeTab === "Upcoming" && styles.activeSwitchText,
                ]}
              >
                Upcoming
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.switchButton,
                activeTab === "Past" && styles.activeSwitchButton,
              ]}
              onPress={() => setActiveTab("Past")}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.switchText,
                  activeTab === "Past" && styles.activeSwitchText,
                ]}
              >
                Past
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.cardsWrapper}>
            {bookings.length > 0 ? (
              bookings.map((booking) => (
                <View key={booking.id} style={styles.card}>
                  <Image source={booking.image} style={styles.cardImage} />

                  <View style={styles.cardContent}>
                    <View style={styles.topRow}>
                      <View style={styles.titleWrapper}>
                        <Text style={styles.spaceName}>{booking.spaceName}</Text>
                        <Text style={styles.venueName}>{booking.venueName}</Text>
                      </View>

                      <View
                        style={[
                          styles.statusBadge,
                          booking.status === "Completed" && styles.completedBadge,
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusText,
                            booking.status === "Completed" &&
                              styles.completedStatusText,
                          ]}
                        >
                          {booking.status}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Date</Text>
                      <Text style={styles.infoValue}>{booking.date}</Text>
                    </View>

                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Time</Text>
                      <Text style={styles.infoValue}>{booking.time}</Text>
                    </View>

                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Duration</Text>
                      <Text style={styles.infoValue}>{booking.duration}</Text>
                    </View>

                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Total</Text>
                      <Text style={styles.priceValue}>{booking.price}</Text>
                    </View>

                    <TouchableOpacity
                      style={styles.viewButton}
                      onPress={() => setSelectedBooking(booking)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.viewButtonText}>View Details</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyTitle}>No bookings found</Text>
                <Text style={styles.emptySubtitle}>
                  Your {activeTab.toLowerCase()} bookings will appear here.
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
      </View>

      {/* Booking Detail Modal */}
      <Modal
        visible={!!selectedBooking}
        animationType="slide"
        transparent
        onRequestClose={() => setSelectedBooking(null)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setSelectedBooking(null)}
        />

        {selectedBooking && (
          <View style={[styles.bottomSheet, { paddingBottom: insets.bottom + 20 }]}>
            <View style={styles.dragHandle} />

            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Booking Details</Text>
              <TouchableOpacity
                onPress={() => setSelectedBooking(null)}
                style={styles.closeBtn}
              >
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.sheetVenueCard}>
              <Image source={selectedBooking.image} style={styles.sheetImage} />
              <View style={styles.sheetVenueInfo}>
                <Text style={styles.sheetSpaceName}>{selectedBooking.spaceName}</Text>
                <Text style={styles.sheetVenueName}>{selectedBooking.venueName}</Text>
              </View>
            </View>

            <View style={styles.detailContainer}>
              {detailRows(selectedBooking).map((row, i, arr) => (
                <View
                  key={row.label}
                  style={[
                    styles.detailRow,
                    i < arr.length - 1 && styles.detailRowBorder,
                  ]}
                >
                  <Text style={styles.detailLabel}>{row.label}</Text>

                  {row.isStatus ? (
                    <View
                      style={[
                        styles.statusBadge,
                        selectedBooking.status === "Completed" && styles.completedBadge,
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusText,
                          selectedBooking.status === "Completed" &&
                            styles.completedStatusText,
                        ]}
                      >
                        {row.value}
                      </Text>
                    </View>
                  ) : (
                    <Text
                      style={[
                        styles.detailValue,
                        row.isPrice && styles.priceValue,
                      ]}
                    >
                      {row.value}
                    </Text>
                  )}
                </View>
              ))}
            </View>


          </View>
        )}
      </Modal>
    </View>
  );
};

export default MyBookingsScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: 30,
    fontWeight: "700",
    marginBottom: 8,
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: 14,
    lineHeight: 21,
  },
  switchWrapper: {
    flexDirection: "row",
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 22,
    padding: 6,
    marginBottom: 20,
  },
  switchButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 18,
  },
  activeSwitchButton: {
    backgroundColor: COLORS.primary,
  },
  switchText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: "600",
  },
  activeSwitchText: {
    color: COLORS.black,
    fontWeight: "700",
  },
  cardsWrapper: {
    gap: 16,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 24,
    overflow: "hidden",
  },
  cardImage: {
    width: "100%",
    height: 170,
  },
  cardContent: {
    padding: 16,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  titleWrapper: {
    flex: 1,
    paddingRight: 10,
  },
  spaceName: {
    color: COLORS.textPrimary,
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 6,
  },
  venueName: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  statusBadge: {
    backgroundColor: "rgba(18, 207, 255, 0.16)",
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  completedBadge: {
    backgroundColor: "transparent",
    borderColor: COLORS.border,
  },
  statusText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: "700",
  },
  completedStatusText: {
    color: COLORS.textSecondary,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
  },
  infoLabel: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  infoValue: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: "600",
  },
  priceValue: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: "700",
  },
  viewButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 14,
  },
  viewButtonText: {
    color: COLORS.black,
    fontSize: 15,
    fontWeight: "700",
  },
  emptyState: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 24,
    paddingVertical: 40,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  emptyTitle: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
  },
  emptySubtitle: {
    color: COLORS.textSecondary,
    fontSize: 14,
    textAlign: "center",
    lineHeight: 21,
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.55)",
  },
  bottomSheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
    borderTopWidth: 1,
    borderColor: COLORS.border,
  },
  dragHandle: {
    width: 40,
    height: 5,
    backgroundColor: COLORS.border,
    borderRadius: 4,
    alignSelf: "center",
    marginBottom: 16,
  },
  sheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sheetTitle: {
    color: COLORS.textPrimary,
    fontSize: 20,
    fontWeight: "700",
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.background,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  closeBtnText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: "600",
  },
  sheetVenueCard: {
    backgroundColor: COLORS.background,
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sheetImage: {
    width: "100%",
    height: 130,
  },
  sheetVenueInfo: {
    padding: 12,
  },
  sheetSpaceName: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  sheetVenueName: {
    color: COLORS.textSecondary,
    fontSize: 13,
  },
  detailContainer: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 11,
    paddingHorizontal: 14,
  },
  detailRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  detailLabel: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  detailValue: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: "600",
  },

});
