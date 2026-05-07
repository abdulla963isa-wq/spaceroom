import React, { useEffect, useState } from "react";
import {
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import firestore from "@react-native-firebase/firestore";
import { useAuth } from "../context/AuthContext";
import { COLORS } from "../constants/colors";
import { ALL_TIME_SLOTS, calculateEndTime } from "../utils/helpers";

const diwanImg = require("../assets/images/diwan.jpg");
const savoyImg = require("../assets/images/savoy.jpg");

type Booking = {
  id: string;
  userId: string;
  venueId: string;
  spaceId?: string;
  venueName: string;
  spaceName: string;
  date: string;
  fullDate: string;
  startTime: string;
  endTime: string;
  duration: number;
  reservedSlots: string[];
  total: number;
  status: string;
  image: any;
};

const getBahrainNow = () => {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bahrain",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hour12: false,
  });
  const parts = formatter.formatToParts(new Date());
  const get = (type: string) => parts.find((p) => p.type === type)?.value || "0";
  return {
    date: `${get("year")}-${get("month")}-${get("day")}`,
    hour: Number(get("hour")),
  };
};

const to24h = (time: string): number => {
  const [clock, mod] = time.split(" ");
  let [h] = clock.split(":").map(Number);
  if (mod === "PM" && h !== 12) h += 12;
  if (mod === "AM" && h === 12) h = 0;
  return h;
};

const isPast = (date: string, time: string): boolean => {
  const bh = getBahrainNow();
  if (date < bh.date) return true;
  if (date > bh.date) return false;
  return to24h(time) <= bh.hour;
};

const deriveStatus = (firestoreStatus: string, date: string, endTime: string): string => {
  if (firestoreStatus === "Cancelled") return "Cancelled";
  if (!endTime) return firestoreStatus || "Confirmed";
  return isPast(date, endTime) ? "Completed" : "Confirmed";
};

const MyBookingsScreen = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"Upcoming" | "Past">("Upcoming");
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [allBookings, setAllBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);

    const unsubscribe = firestore()
      .collection("bookings")
      .where("userId", "==", user.uid)
      .orderBy("date", "desc")
      .onSnapshot(
        (snapshot) => {
          const all: Booking[] = snapshot.docs.map((doc) => {
            const d = doc.data();
            const duration = typeof d.duration === "number" ? d.duration : Number(d.duration) || 1;
            const startTime = d.startTime ?? d.time ?? "";
            const endTime =
              d.endTime ?? (startTime ? calculateEndTime(startTime, duration, ALL_TIME_SLOTS) : "");
            const reservedSlots = Array.isArray(d.reservedSlots)
              ? d.reservedSlots
              : d.time
              ? [d.time]
              : [];
            const status = deriveStatus(d.status, d.date, endTime);

            return {
              id: doc.id,
              userId: d.userId,
              venueId: d.venueId,
              spaceId: d.spaceId,
              venueName: d.venueName,
              spaceName: d.spaceName,
              date: d.date,
              fullDate: d.fullDate,
              startTime,
              endTime,
              duration,
              reservedSlots,
              total: d.total,
              status,
              image: d.venueId === "savoy-grande" ? savoyImg : diwanImg,
            };
          });

          setAllBookings(all);
          setLoading(false);
        },
        (error) => {
          console.error("Firestore error:", error);
          setLoading(false);
        }
      );

    return () => unsubscribe();
  }, [user]);

  const bookings =
    activeTab === "Upcoming"
      ? allBookings.filter((b) => !isPast(b.date, b.endTime) && b.status !== "Cancelled")
      : allBookings.filter((b) => isPast(b.date, b.endTime) || b.status === "Cancelled");

  const handleCancelBooking = (bookingId: string) => {
    Alert.alert(
      "Cancel Booking",
      "Are you sure you want to cancel this booking? This action cannot be undone.",
      [
        { text: "No, Don't Cancel", style: "cancel" },
        {
          text: "Cancel Booking",
          style: "destructive",
          onPress: async () => {
            try {
              await firestore()
                .collection("bookings")
                .doc(bookingId)
                .update({ status: "Cancelled" });
              setSelectedBooking(null);
            } catch {
              Alert.alert("Error", "Failed to cancel booking. Please try again.");
            }
          },
        },
      ]
    );
  };

  const detailRows = (b: Booking) => [
    { label: "Booking ID", value: `#BK-${b.id.slice(0, 8).toUpperCase()}` },
    { label: "Date", value: b.fullDate },
    { label: "Time", value: `${b.startTime} - ${b.endTime}` },
    { label: "Duration", value: `${b.duration} ${b.duration === 1 ? "hour" : "hours"}` },
    { label: "Status", value: b.status, isStatus: true },
    { label: "Total paid", value: `BHD ${b.total.toFixed(2)}`, isPrice: true },
  ];

  const statusBadgeStyle = (status: string) => {
    if (status === "Completed") return styles.completedBadge;
    if (status === "Cancelled") return styles.cancelledBadge;
    return undefined;
  };

  const statusTextStyle = (status: string) => {
    if (status === "Completed") return styles.completedStatusText;
    if (status === "Cancelled") return styles.cancelledStatusText;
    return undefined;
  };

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
            <Text style={styles.subtitle}>View your upcoming and past reservations</Text>
          </View>

          <View style={styles.switchWrapper}>
            {(["Upcoming", "Past"] as const).map((tab) => (
              <TouchableOpacity
                key={tab}
                style={[styles.switchButton, activeTab === tab && styles.activeSwitchButton]}
                onPress={() => setActiveTab(tab)}
                activeOpacity={0.8}
              >
                <Text style={[styles.switchText, activeTab === tab && styles.activeSwitchText]}>
                  {tab}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.cardsWrapper}>
            {loading ? (
              <ActivityIndicator color={COLORS.primary} size="large" style={{ marginTop: 60 }} />
            ) : bookings.length > 0 ? (
              bookings.map((booking) => (
                <View key={booking.id} style={styles.card}>
                  <Image source={booking.image} style={styles.cardImage} />

                  <View style={styles.cardContent}>
                    <View style={styles.topRow}>
                      <View style={styles.titleWrapper}>
                        <Text style={styles.spaceName}>{booking.spaceName}</Text>
                        <Text style={styles.venueName}>{booking.venueName}</Text>
                      </View>

                      <View style={[styles.statusBadge, statusBadgeStyle(booking.status)]}>
                        <Text style={[styles.statusText, statusTextStyle(booking.status)]}>
                          {booking.status}
                        </Text>
                      </View>
                    </View>

                    {[
                      ["Date", booking.fullDate],
                      ["Time", `${booking.startTime} - ${booking.endTime}`],
                      [
                        "Duration",
                        `${booking.duration} ${booking.duration === 1 ? "hour" : "hours"}`,
                      ],
                    ].map(([label, value]) => (
                      <View key={label as string} style={styles.infoRow}>
                        <Text style={styles.infoLabel}>{label}</Text>
                        <Text style={styles.infoValue}>{value as string}</Text>
                      </View>
                    ))}

                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Total</Text>
                      <Text style={styles.priceValue}>BHD {booking.total.toFixed(2)}</Text>
                    </View>

                    <TouchableOpacity
                      style={styles.detailsButton}
                      activeOpacity={0.8}
                      onPress={() => setSelectedBooking(booking)}
                    >
                      <Text style={styles.detailsButtonText}>View details</Text>
                    </TouchableOpacity>

                    {activeTab === "Upcoming" ? (
                      <TouchableOpacity
                        style={styles.cancelButton}
                        activeOpacity={0.8}
                        onPress={() => handleCancelBooking(booking.id)}
                      >
                        <Text style={styles.cancelButtonText}>Cancel Booking</Text>
                      </TouchableOpacity>
                    ) : null}
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

        <Modal
          visible={!!selectedBooking}
          animationType="slide"
          transparent
          onRequestClose={() => setSelectedBooking(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <TouchableOpacity
                style={styles.modalClose}
                onPress={() => setSelectedBooking(null)}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>

              {selectedBooking ? (
                <>
                  <Image source={selectedBooking.image} style={styles.modalImage} />
                  <Text style={styles.sheetTitle}>Booking Details</Text>
                  <Text style={styles.sheetSpaceName}>{selectedBooking.spaceName}</Text>
                  <Text style={styles.sheetVenueName}>{selectedBooking.venueName}</Text>

                  {detailRows(selectedBooking).map((row) => (
                    <View key={row.label} style={styles.sheetRow}>
                      <Text style={styles.sheetLabel}>{row.label}</Text>
                      <Text
                        style={[
                          styles.sheetValue,
                          row.isStatus && styles.sheetStatusValue,
                          row.isPrice && styles.sheetPriceValue,
                        ]}
                      >
                        {row.value}
                      </Text>
                    </View>
                  ))}

                  {!isPast(selectedBooking.date, selectedBooking.endTime) &&
                  selectedBooking.status !== "Cancelled" ? (
                    <TouchableOpacity
                      style={styles.modalCancelButton}
                      activeOpacity={0.8}
                      onPress={() => handleCancelBooking(selectedBooking.id)}
                    >
                      <Text style={styles.modalCancelButtonText}>Cancel Booking</Text>
                    </TouchableOpacity>
                  ) : null}
                </>
              ) : null}
            </View>
          </View>
        </Modal>
      </View>
    </View>
  );
};

export default MyBookingsScreen;

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  screen: { flex: 1, backgroundColor: COLORS.background },
  container: { flex: 1 },
  scrollContent: { paddingTop: 24, paddingBottom: 120 },

  header: { paddingHorizontal: 20, marginBottom: 16 },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: COLORS.textPrimary,
    marginBottom: 10,
  },
  subtitle: { color: COLORS.textSecondary, fontSize: 14, lineHeight: 20 },

  switchWrapper: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 16,
    marginBottom: 10,
  },
  switchButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    marginHorizontal: 5,
    alignItems: "center",
  },
  activeSwitchButton: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  switchText: { color: COLORS.textSecondary, fontWeight: "600" },
  activeSwitchText: { color: COLORS.black },

  cardsWrapper: { paddingHorizontal: 20 },

  card: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 24,
    marginBottom: 18,
    overflow: "hidden",
  },
  cardImage: { width: "100%", height: 180 },
  cardContent: { padding: 18 },

  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  titleWrapper: { flex: 1, marginRight: 14 },
  spaceName: { color: COLORS.textPrimary, fontSize: 20, fontWeight: "700" },
  venueName: { color: COLORS.textSecondary, fontSize: 14, marginTop: 4 },

  statusBadge: {
    backgroundColor: "rgba(20,207,255,0.12)",
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  completedBadge: { backgroundColor: "rgba(16,185,129,0.18)" },
  cancelledBadge: { backgroundColor: "rgba(255,77,77,0.12)" },
  statusText: { color: COLORS.primary, fontWeight: "700" },
  completedStatusText: { color: "#10B981" },
  cancelledStatusText: { color: COLORS.danger },

  infoRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 10 },
  infoLabel: { color: COLORS.textSecondary, fontSize: 13 },
  infoValue: { color: COLORS.textPrimary, fontWeight: "600", fontSize: 13 },
  priceValue: { color: COLORS.primary, fontWeight: "700" },

  detailsButton: {
    marginTop: 16,
    backgroundColor: COLORS.primary,
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: "center",
  },
  detailsButtonText: { color: COLORS.black, fontWeight: "700" },

  cancelButton: {
    marginTop: 10,
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: COLORS.danger,
    borderRadius: 18,
    paddingVertical: 13,
    alignItems: "center",
  },
  cancelButtonText: { color: COLORS.danger, fontWeight: "700" },

  emptyState: { paddingHorizontal: 20, paddingVertical: 48, alignItems: "center" },
  emptyTitle: { color: COLORS.textPrimary, fontSize: 18, fontWeight: "700", marginBottom: 10 },
  emptySubtitle: { color: COLORS.textSecondary, textAlign: "center" },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: "85%",
  },
  modalClose: { alignSelf: "flex-end" },
  modalCloseText: { color: COLORS.textSecondary, fontSize: 20 },
  modalImage: { width: "100%", height: 180, borderRadius: 18, marginBottom: 18 },
  sheetTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  sheetSpaceName: { fontSize: 18, fontWeight: "700", color: COLORS.textPrimary },
  sheetVenueName: { color: COLORS.textSecondary, marginBottom: 16 },
  sheetRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 12 },
  sheetLabel: { color: COLORS.textSecondary, fontSize: 13 },
  sheetValue: { color: COLORS.textPrimary, fontSize: 13, fontWeight: "600" },
  sheetStatusValue: { color: COLORS.primary },
  sheetPriceValue: { color: COLORS.primary, fontWeight: "800" },

  modalCancelButton: {
    marginTop: 20,
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: COLORS.danger,
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: "center",
  },
  modalCancelButtonText: { color: COLORS.danger, fontWeight: "700", fontSize: 15 },
});
