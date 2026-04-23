import React, { useMemo, useState, useEffect } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import firestore from "@react-native-firebase/firestore";
import { COLORS } from "../constants/colors";
import { useAuth } from "../context/AuthContext";

type DateItem = {
  id: string;
  shortDay: string;
  dayNumber: string;
  fullDate: string;
  rawDate: Date;
};

type RouteParams = {
  spaceId: string;
  spaceName: string;
  venueName: string;
  location: string;
  pricePerHour: number;
};

const VENUE_ID = "diwan-hub";

const BookingScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const { user, logout } = useAuth();
  const insets = useSafeAreaInsets();

  const { spaceName, venueName, location, pricePerHour } =
    route.params as RouteParams;

  const [fullyBookedDates, setFullyBookedDates] = useState<string[]>([]);
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const getBahrainParts = () => {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Bahrain",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      hour12: false,
    });
    const parts = formatter.formatToParts(now);
    const get = (type: string) =>
      parts.find((p) => p.type === type)?.value || "";
    return {
      date: `${get("year")}-${get("month")}-${get("day")}`,
      hour: Number(get("hour")),
    };
  };

  const generateUpcomingDates = (count: number): DateItem[] => {
    const bh = getBahrainParts();
    const [year, month, day] = bh.date.split("-").map(Number);
    return Array.from({ length: count }, (_, index) => {
      const current = new Date(Date.UTC(year, month - 1, day + index, 0, 0, 0));
      const id = current.toISOString().split("T")[0];
      return {
        id,
        shortDay: current.toLocaleDateString("en-US", {
          weekday: "short",
          timeZone: "UTC",
        }),
        dayNumber: current.toLocaleDateString("en-US", {
          day: "2-digit",
          timeZone: "UTC",
        }),
        fullDate: current.toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          timeZone: "UTC",
        }),
        rawDate: current,
      };
    });
  };

  const dates = useMemo(() => generateUpcomingDates(14), []);

  const allTimeSlots = [
    "9:00 AM",
    "10:00 AM",
    "11:00 AM",
    "12:00 PM",
    "1:00 PM",
    "2:00 PM",
    "3:00 PM",
    "4:00 PM",
    "5:00 PM",
    "6:00 PM",
  ];

  const TOTAL_SLOTS = allTimeSlots.length;

  const durationOptions = [
    { hours: 1, label: "1 hour" },
    { hours: 2, label: "2 hours" },
    { hours: 3, label: "3 hours" },
    { hours: 4, label: "Half day" },
    { hours: 6, label: "6 hours" },
    { hours: 8, label: "Full day" },
  ];

  const [selectedDateId, setSelectedDateId] = useState(dates[0].id);
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [selectedDuration, setSelectedDuration] = useState(1);

  const selectedDate = useMemo(
    () => dates.find((item) => item.id === selectedDateId) || dates[0],
    [dates, selectedDateId]
  );

  const total = useMemo(
    () => (pricePerHour * selectedDuration).toFixed(2),
    [pricePerHour, selectedDuration]
  );

  const convertTo24Hour = (time: string) => {
    const [clock, modifier] = time.split(" ");
    let [hours] = clock.split(":").map(Number);
    if (modifier === "PM" && hours !== 12) hours += 12;
    if (modifier === "AM" && hours === 12) hours = 0;
    return hours;
  };

  const timeSlotsForDay = useMemo(() => {
    const bh = getBahrainParts();
    if (selectedDateId !== bh.date) return allTimeSlots;
    return allTimeSlots.filter(
      (slot) => convertTo24Hour(slot) > bh.hour
    );
  }, [selectedDateId]);

  const availableTimeSlots = useMemo(
    () => timeSlotsForDay.filter((slot) => !bookedSlots.includes(slot)),
    [timeSlotsForDay, bookedSlots]
  );

  useEffect(() => {
    if (availableTimeSlots.length > 0) {
      if (!availableTimeSlots.includes(selectedTime)) {
        setSelectedTime(availableTimeSlots[0]);
      }
    } else {
      setSelectedTime("");
    }
  }, [availableTimeSlots]);

  const isRoomUnavailable = useMemo(
    () => dates.every((d) => fullyBookedDates.includes(d.id)),
    [dates, fullyBookedDates]
  );

  useEffect(() => {
    const unsubscribe = firestore()
      .collection("bookings")
      .where("venueId", "==", VENUE_ID)
      .where("spaceName", "==", spaceName)
      .where("status", "==", "Confirmed")
      .onSnapshot((snapshot) => {
        const byDate: Record<string, Set<string>> = {};
        snapshot.docs.forEach((doc) => {
          const data = doc.data();
          if (!data?.date || !data?.time) return;
          if (!byDate[data.date]) byDate[data.date] = new Set();
          byDate[data.date].add(data.time);
        });

        const fullyBooked = Object.entries(byDate)
          .filter(([, slots]) => slots.size >= TOTAL_SLOTS)
          .map(([date]) => date);

        setFullyBookedDates(fullyBooked);
      });

    return () => unsubscribe();
  }, [spaceName]);

  useEffect(() => {
    const unsubscribe = firestore()
      .collection("bookings")
      .where("venueId", "==", VENUE_ID)
      .where("spaceName", "==", spaceName)
      .where("date", "==", selectedDateId)
      .where("status", "==", "Confirmed")
      .onSnapshot((snapshot) => {
        const taken = snapshot.docs.map((doc) => doc.data()?.time as string);
        setBookedSlots(taken);
      });

    return () => unsubscribe();
  }, [spaceName, selectedDateId]);

  const handleBooking = async () => {
    if (!user) {
      Alert.alert("Login Required", "You have to log in to make a booking.", [
        { text: "Cancel", style: "cancel" },
        { text: "Login", onPress: async () => await logout() },
      ]);
      return;
    }

    if (isRoomUnavailable) {
      Alert.alert("Room Unavailable", "This room is fully booked for all available dates.");
      return;
    }

    if (fullyBookedDates.includes(selectedDateId)) {
      Alert.alert("Unavailable", "This room is fully booked for this date.");
      return;
    }

    if (!selectedTime) {
      Alert.alert("No Slot Selected", "Please choose an available time slot.");
      return;
    }

    setLoading(true);

    try {
      await firestore().runTransaction(async (tx) => {
        const existing = await firestore()
          .collection("bookings")
          .where("venueId", "==", VENUE_ID)
          .where("spaceName", "==", spaceName)
          .where("date", "==", selectedDateId)
          .where("time", "==", selectedTime)
          .where("status", "==", "Confirmed")
          .get();

        if (!existing.empty) throw new Error("SLOT_TAKEN");

        const newDocRef = firestore().collection("bookings").doc();
        tx.set(newDocRef, {
          userId: user.uid,
          venueId: VENUE_ID,
          venueName,
          spaceName,
          location,
          date: selectedDateId,
          fullDate: selectedDate.fullDate,
          time: selectedTime,
          duration: selectedDuration,
          pricePerHour,
          total: parseFloat(total),
          status: "Confirmed",
          createdAt: firestore.FieldValue.serverTimestamp(),
        });
      });

      navigation.navigate("BookingSuccess");
    } catch (err: any) {
      if (err.message === "SLOT_TAKEN") {
        Alert.alert("Slot Unavailable", "Someone just booked this slot. Please pick another time.");
      } else {
        Alert.alert("Error", "Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
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
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            >
              <Text style={styles.backArrow}>←</Text>
            </TouchableOpacity>

            <Text style={styles.smallLabel}>Booking</Text>

            <View style={styles.titleRow}>
              <Text style={styles.title}>{spaceName}</Text>
              {isRoomUnavailable && (
                <View style={styles.unavailablePill}>
                  <Text style={styles.unavailablePillText}>Unavailable</Text>
                </View>
              )}
            </View>

            <Text style={styles.subtitle}>{venueName}</Text>
            <Text style={styles.location}>{location}</Text>
          </View>

          {/* DATE */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Select Date</Text>
            <View style={styles.dateWrapper}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.dateScroll}
              >
                {dates.map((item) => {
                  const isSelected = selectedDateId === item.id;
                  const isFullyBooked = fullyBookedDates.includes(item.id);
                  return (
                    <TouchableOpacity
                      key={item.id}
                      disabled={isFullyBooked}
                      style={[
                        styles.dateCard,
                        isSelected && styles.selectedDateCard,
                        isFullyBooked && { opacity: 0.3 },
                      ]}
                      onPress={() => setSelectedDateId(item.id)}
                    >
                      <Text
                        style={[
                          styles.dateDayText,
                          isSelected && styles.selectedDateText,
                        ]}
                      >
                        {item.shortDay}
                      </Text>
                      <Text
                        style={[
                          styles.dateNumberText,
                          isSelected && styles.selectedDateText,
                        ]}
                      >
                        {item.dayNumber}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
              <View style={styles.arrowCircle} pointerEvents="none">
                <Text style={styles.arrowText}>›</Text>
              </View>
            </View>
          </View>

          {/* TIME */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Select Time</Text>
            <View style={styles.wrapRow}>
              {timeSlotsForDay.length === 0 ? (
                <Text style={styles.noSlotsText}>
                  No available time slots for this date
                </Text>
              ) : (
                timeSlotsForDay.map((slot) => {
                  const isSelected = selectedTime === slot;
                  const isBooked = bookedSlots.includes(slot);
                  return (
                    <TouchableOpacity
                      key={slot}
                      style={[
                        styles.optionChip,
                        isSelected && styles.selectedOptionChip,
                        isBooked && styles.bookedOptionChip,
                      ]}
                      onPress={() => !isBooked && setSelectedTime(slot)}
                      disabled={isBooked}
                    >
                      <Text
                        style={[
                          styles.optionText,
                          isSelected && styles.selectedOptionText,
                          isBooked && styles.bookedOptionText,
                        ]}
                      >
                        {slot}
                      </Text>
                    </TouchableOpacity>
                  );
                })
              )}
            </View>
          </View>

          {/* DURATION */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Duration</Text>
            <View style={styles.wrapRow}>
              {durationOptions.map((option) => {
                const isSelected = selectedDuration === option.hours;
                return (
                  <TouchableOpacity
                    key={option.hours}
                    style={[
                      styles.optionChip,
                      isSelected && styles.selectedOptionChip,
                    ]}
                    onPress={() => setSelectedDuration(option.hours)}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        isSelected && styles.selectedOptionText,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* SUMMARY */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Booking Summary</Text>
            {[
              ["Venue", venueName],
              ["Space", spaceName],
              ["Date", selectedDate.fullDate],
              ["Time", selectedTime || "—"],
              [
                "Duration",
                `${selectedDuration} hour${selectedDuration > 1 ? "s" : ""}`,
              ],
              ["Rate", `BHD ${pricePerHour}/hour`],
            ].map(([label, value]) => (
              <View key={label} style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>{label}</Text>
                <Text style={styles.summaryValue}>{value}</Text>
              </View>
            ))}
            <View style={[styles.summaryRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>BHD {total}</Text>
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.confirmButton,
              (loading || isRoomUnavailable || !selectedTime) && {
                opacity: 0.6,
              },
            ]}
            onPress={handleBooking}
            disabled={loading || isRoomUnavailable || !selectedTime}
          >
            <Text style={styles.confirmButtonText}>
              {loading
                ? "Confirming..."
                : isRoomUnavailable
                ? "Room Unavailable"
                : "Confirm Booking"}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </View>
  );
};

export default BookingScreen;

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  screen: { flex: 1, backgroundColor: COLORS.background },
  container: { flex: 1 },
  scrollContent: { paddingTop: 32, paddingBottom: 120 },

  header: { paddingHorizontal: 20, paddingBottom: 12 },

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
  },

  smallLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.primary,
    marginBottom: 8,
  },

  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 4,
  },

  title: {
    fontSize: 30,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },

  unavailablePill: {
    backgroundColor: "#FF3B3018",
    borderWidth: 1,
    borderColor: "#FF3B3050",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },

  unavailablePillText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FF3B30",
    letterSpacing: 0.3,
  },

  subtitle: {
    fontSize: 16,
    color: COLORS.textPrimary,
  },

  location: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },

  card: {
    backgroundColor: COLORS.surface,
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 18,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginBottom: 14,
  },

  dateWrapper: { position: "relative" },
  dateScroll: { paddingRight: 40 },

  arrowCircle: {
    position: "absolute",
    right: 0,
    top: "50%",
    marginTop: -16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: "center",
    alignItems: "center",
  },

  arrowText: {
    fontSize: 22,
    fontWeight: "700",
    color: COLORS.textSecondary,
  },

  dateCard: {
    width: 76,
    height: 90,
    borderRadius: 18,
    backgroundColor: COLORS.background,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  selectedDateCard: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },

  dateDayText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },

  dateNumberText: {
    fontSize: 24,
    fontWeight: "800",
    color: COLORS.textPrimary,
  },

  selectedDateText: {
    color: COLORS.black,
  },

  wrapRow: {
    flexDirection: "row",
    flexWrap: "wrap",
  },

  optionChip: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 18,
    marginRight: 10,
    marginBottom: 10,
  },

  selectedOptionChip: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },

  bookedOptionChip: {
    opacity: 0.45,
  },

  optionText: {
    color: COLORS.textPrimary,
    fontWeight: "600",
  },

  selectedOptionText: {
    color: COLORS.black,
  },

  bookedOptionText: {
    color: COLORS.textSecondary,
    textDecorationLine: "line-through",
  },

  noSlotsText: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },

  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
  },

  summaryLabel: {
    color: COLORS.textSecondary,
  },

  summaryValue: {
    color: COLORS.textPrimary,
    fontWeight: "600",
  },

  totalRow: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    marginTop: 8,
    paddingTop: 14,
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

  confirmButton: {
    backgroundColor: COLORS.primary,
    marginHorizontal: 20,
    marginTop: 18,
    marginBottom: 34,
    paddingVertical: 17,
    borderRadius: 18,
    alignItems: "center",
  },

  confirmButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.black,
  },
});