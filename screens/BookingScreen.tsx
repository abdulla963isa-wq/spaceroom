import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import firestore from "@react-native-firebase/firestore";
import { COLORS } from "../constants/colors";
import { useAuth } from "../context/AuthContext";
import {
  ALL_TIME_SLOTS,
  calculateEndTime,
  getCoveredSlots,
  isBookingOverlap,
} from "../utils/helpers";
import type { Space } from "../types/space";

type RouteParams = {
  venueId: string;
  venueName: string;
  location: string;
  spaceId: string;
};

type DateItem = {
  id: string;
  shortDay: string;
  dayNumber: string;
  fullDate: string;
};

type SelectedSlot = {
  spaceId: string;
  spaceName: string;
  pricePerHour: number;
  startTime: string;
};

type SpaceInstance = {
  id: string;
  spaceName: string;
  pricePerHour: number;
};

const expandToInstances = (spaces: Space[]): SpaceInstance[] =>
  spaces.flatMap((space) => {
    const qty = space.quantity ?? 1;
    if (qty <= 1) {
      return [{ id: space.id, spaceName: space.title, pricePerHour: space.pricePerHour }];
    }
    return Array.from({ length: qty }, (_, i) => ({
      id: `${space.id}-${i + 1}`,
      spaceName: `${space.title} ${i + 1}`,
      pricePerHour: space.pricePerHour,
    }));
  });

const BookingScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const { user, logout } = useAuth();
  const insets = useSafeAreaInsets();

  const { venueId, venueName, location, spaceId: targetSpaceId } = route.params as RouteParams;

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
    const get = (type: string) => parts.find((p) => p.type === type)?.value || "";
    return {
      date: `${get("year")}-${get("month")}-${get("day")}`,
      hour: Number(get("hour")),
    };
  };

  const generateUpcomingDates = (count: number): DateItem[] => {
    const bh = getBahrainParts();
    const [year, month, day] = bh.date.split("-").map(Number);
    return Array.from({ length: count }, (_, i) => {
      const current = new Date(Date.UTC(year, month - 1, day + i, 0, 0, 0));
      const id = current.toISOString().split("T")[0];
      return {
        id,
        shortDay: current.toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" }),
        dayNumber: current.toLocaleDateString("en-US", { day: "2-digit", timeZone: "UTC" }),
        fullDate: current.toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          timeZone: "UTC",
        }),
      };
    });
  };

  const dates = useMemo(() => generateUpcomingDates(14), []);

  const durationOptions = [
    { hours: 1, label: "1 hr" },
    { hours: 2, label: "2 hrs" },
    { hours: 3, label: "3 hrs" },
    { hours: 4, label: "Half day" },
    { hours: 6, label: "6 hrs" },
    { hours: 8, label: "Full day" },
  ];

  const [selectedDateId, setSelectedDateId] = useState(dates[0].id);
  const [selectedDuration, setSelectedDuration] = useState(1);
  const [showUnavailable, setShowUnavailable] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<SelectedSlot | null>(null);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [bookingsBySpace, setBookingsBySpace] = useState<Record<string, Record<string, string[]>>>({});
  const [loading, setLoading] = useState(false);
  const [spacesLoading, setSpacesLoading] = useState(true);

  const selectedDate = useMemo(
    () => dates.find((d) => d.id === selectedDateId) || dates[0],
    [dates, selectedDateId]
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
    if (selectedDateId !== bh.date) return ALL_TIME_SLOTS;
    return ALL_TIME_SLOTS.filter((slot) => convertTo24Hour(slot) > bh.hour);
  }, [selectedDateId]);

  // Fetch only the single space that was selected
  useEffect(() => {
    if (!venueId || !targetSpaceId) return;
    setSpacesLoading(true);
    const unsub = firestore()
      .collection("spaces")
      .where("venueId", "==", venueId)
      .where("isActive", "==", true)
      .onSnapshot(
        (snap) => {
          if (!snap) return;
          const loaded = snap.docs
            .map((doc) => ({ id: doc.id, ...(doc.data() as Omit<Space, "id">) }))
            .filter((s) => s.id === targetSpaceId);
          setSpaces(loaded);
          setSpacesLoading(false);
        },
        () => { setSpacesLoading(false); }
      );
    return () => unsub();
  }, [venueId, targetSpaceId]);

  // Single listener for all confirmed bookings at this venue
  useEffect(() => {
    if (!venueId) return;
    const unsub = firestore()
      .collection("bookings")
      .where("venueId", "==", venueId)
      .where("status", "==", "Confirmed")
      .onSnapshot((snapshot) => {
        if (!snapshot) return;
        const bySpaceDate: Record<string, Record<string, Set<string>>> = {};
        snapshot.docs.forEach((doc) => {
          const data = doc.data();
          const { spaceId, date, reservedSlots } = data as {
            spaceId?: string;
            date?: string;
            reservedSlots?: string[];
          };
          if (!spaceId || !date || !Array.isArray(reservedSlots)) return;
          if (!bySpaceDate[spaceId]) bySpaceDate[spaceId] = {};
          if (!bySpaceDate[spaceId][date]) bySpaceDate[spaceId][date] = new Set();
          reservedSlots.forEach((slot) => { if (slot) bySpaceDate[spaceId][date].add(slot); });
        });

        const normalized: Record<string, Record<string, string[]>> = {};
        Object.entries(bySpaceDate).forEach(([sid, byDate]) => {
          normalized[sid] = {};
          Object.entries(byDate).forEach(([date, slots]) => {
            normalized[sid][date] = [...slots].sort(
              (a, b) => ALL_TIME_SLOTS.indexOf(a) - ALL_TIME_SLOTS.indexOf(b)
            );
          });
        });
        setBookingsBySpace(normalized);
      });
    return () => unsub();
  }, [venueId]);

  // Reset selected slot when date or duration changes
  useEffect(() => {
    setSelectedSlot(null);
  }, [selectedDateId, selectedDuration]);

  const spaceInstances = useMemo(() => expandToInstances(spaces), [spaces]);

  const getBookedSlots = (spaceId: string) =>
    bookingsBySpace[spaceId]?.[selectedDateId] ?? [];

  const getAvailableStartTimes = (spaceId: string) => {
    const booked = getBookedSlots(spaceId);
    return timeSlotsForDay.filter((slot) => {
      const covered = getCoveredSlots(slot, selectedDuration, ALL_TIME_SLOTS);
      return covered.length === selectedDuration && !isBookingOverlap(booked, covered);
    });
  };

  const total = useMemo(() => {
    if (!selectedSlot) return "";
    return (selectedSlot.pricePerHour * selectedDuration).toFixed(2);
  }, [selectedSlot, selectedDuration]);

  const endTime = useMemo(() => {
    if (!selectedSlot) return "";
    return calculateEndTime(selectedSlot.startTime, selectedDuration, ALL_TIME_SLOTS);
  }, [selectedSlot, selectedDuration]);

  const handleBooking = async () => {
    if (!user) {
      Alert.alert("Login Required", "You have to log in to make a booking.", [
        { text: "Cancel", style: "cancel" },
        { text: "Login", onPress: async () => await logout() },
      ]);
      return;
    }

    if (!selectedSlot) {
      Alert.alert("No Slot Selected", "Please choose an available time slot.");
      return;
    }

    const reservedSlots = getCoveredSlots(selectedSlot.startTime, selectedDuration, ALL_TIME_SLOTS);

    if (reservedSlots.length !== selectedDuration) {
      Alert.alert("Invalid duration", "Please select a valid start time for the chosen duration.");
      return;
    }

    if (isBookingOverlap(getBookedSlots(selectedSlot.spaceId), reservedSlots)) {
      Alert.alert("Slot Unavailable", "Some of the requested hours are already reserved.");
      return;
    }

    const endTimeStr = calculateEndTime(selectedSlot.startTime, selectedDuration, ALL_TIME_SLOTS);
    const totalAmount = parseFloat((selectedSlot.pricePerHour * selectedDuration).toFixed(2));

    setLoading(true);
    let bookingId = "";

    try {
      await firestore().runTransaction(async (tx) => {
        const snap = await firestore()
          .collection("bookings")
          .where("venueId", "==", venueId)
          .where("spaceId", "==", selectedSlot.spaceId)
          .where("date", "==", selectedDateId)
          .where("status", "==", "Confirmed")
          .get();

        const existingSlots: string[] = [];
        snap.docs.forEach((doc) => {
          const data = doc.data();
          const reserved = Array.isArray(data.reservedSlots)
            ? data.reservedSlots
            : data.time
            ? [data.time]
            : [];
          existingSlots.push(...reserved);
        });

        if (isBookingOverlap(existingSlots, reservedSlots)) throw new Error("SLOT_TAKEN");

        const newRef = firestore().collection("bookings").doc();
        bookingId = newRef.id;

        tx.set(newRef, {
          userId: user.uid,
          venueId,
          spaceId: selectedSlot.spaceId,
          venueName,
          spaceName: selectedSlot.spaceName,
          location,
          date: selectedDateId,
          fullDate: selectedDate.fullDate,
          startTime: selectedSlot.startTime,
          endTime: endTimeStr,
          duration: selectedDuration,
          reservedSlots,
          pricePerHour: selectedSlot.pricePerHour,
          total: totalAmount,
          status: "Confirmed",
          createdAt: firestore.FieldValue.serverTimestamp(),
        } as const);
      });

      navigation.navigate("BookingSuccess", {
        booking: {
          id: bookingId,
          userId: user.uid,
          venueId,
          spaceId: selectedSlot.spaceId,
          venueName,
          spaceName: selectedSlot.spaceName,
          location,
          date: selectedDateId,
          fullDate: selectedDate.fullDate,
          startTime: selectedSlot.startTime,
          endTime: endTimeStr,
          duration: selectedDuration,
          reservedSlots,
          total: totalAmount,
          status: "Confirmed",
          createdAt: null,
        },
      });
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
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Text style={styles.backArrow}>←</Text>
            </TouchableOpacity>
            <Text style={styles.smallLabel}>Booking</Text>
            <Text style={styles.title}>{venueName}</Text>
            <Text style={styles.location}>{location}</Text>
          </View>

          {/* 1. Day picker */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Select Day</Text>
            <View style={styles.dateWrapper}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.dateScroll}
              >
                {dates.map((item) => {
                  const isSelected = selectedDateId === item.id;
                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={[styles.dateCard, isSelected && styles.selectedDateCard]}
                      onPress={() => setSelectedDateId(item.id)}
                    >
                      <Text style={[styles.dateDayText, isSelected && styles.selectedDateText]}>
                        {item.shortDay}
                      </Text>
                      <Text style={[styles.dateNumberText, isSelected && styles.selectedDateText]}>
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

          {/* 2. Duration picker */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Duration</Text>
            <View style={styles.wrapRow}>
              {durationOptions.map((opt) => {
                const isSelected = selectedDuration === opt.hours;
                return (
                  <TouchableOpacity
                    key={opt.hours}
                    style={[styles.optionChip, isSelected && styles.selectedOptionChip]}
                    onPress={() => setSelectedDuration(opt.hours)}
                  >
                    <Text style={[styles.optionText, isSelected && styles.selectedOptionText]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* 3. Show unavailable toggle */}
          <View style={[styles.card, styles.toggleCard]}>
            <Text style={styles.toggleLabel}>Show unavailable slots</Text>
            <Switch
              value={showUnavailable}
              onValueChange={setShowUnavailable}
              trackColor={{ false: COLORS.border, true: COLORS.primary }}
              thumbColor={COLORS.textPrimary}
            />
          </View>

          {/* 4. Spaces with their time slots */}
          {spacesLoading ? (
            <ActivityIndicator color={COLORS.primary} size="large" style={{ marginTop: 32 }} />
          ) : spaceInstances.length === 0 ? (
            <View style={[styles.card, styles.centeredCard]}>
              <Text style={styles.noSlotsText}>No spaces available for this category.</Text>
            </View>
          ) : (
            spaceInstances.map((instance) => {
              const available = getAvailableStartTimes(instance.id);
              const slotsToShow = showUnavailable ? timeSlotsForDay : available;

              return (
                <View key={instance.id} style={styles.card}>
                  <View style={styles.spaceHeader}>
                    <Text style={styles.spaceName}>{instance.spaceName}</Text>
                    <Text style={styles.spacePrice}>BHD {instance.pricePerHour.toFixed(2)}/hr</Text>
                  </View>

                  {slotsToShow.length === 0 ? (
                    <Text style={styles.noSlotsText}>
                      {timeSlotsForDay.length === 0
                        ? "No time slots available today"
                        : "Fully booked — enable 'Show unavailable slots' to see all times"}
                    </Text>
                  ) : (
                    <View style={styles.wrapRow}>
                      {slotsToShow.map((slot) => {
                        const isAvailable = available.includes(slot);
                        const isSelected =
                          selectedSlot?.spaceId === instance.id &&
                          selectedSlot?.startTime === slot;
                        return (
                          <TouchableOpacity
                            key={slot}
                            style={[
                              styles.optionChip,
                              isSelected && styles.selectedOptionChip,
                              !isAvailable && styles.bookedOptionChip,
                            ]}
                            onPress={() => {
                              if (!isAvailable) return;
                              setSelectedSlot(
                                isSelected
                                  ? null
                                  : {
                                      spaceId: instance.id,
                                      spaceName: instance.spaceName,
                                      pricePerHour: instance.pricePerHour,
                                      startTime: slot,
                                    }
                              );
                            }}
                            disabled={!isAvailable}
                          >
                            <Text
                              style={[
                                styles.optionText,
                                isSelected && styles.selectedOptionText,
                                !isAvailable && styles.bookedOptionText,
                              ]}
                            >
                              {slot}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  )}
                </View>
              );
            })
          )}

          {/* Booking summary — appears only when a slot is selected */}
          {selectedSlot ? (
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Booking Summary</Text>
              {(
                [
                  ["Venue", venueName],
                  ["Space", selectedSlot.spaceName],
                  ["Date", selectedDate.fullDate],
                  ["Start", selectedSlot.startTime],
                  ["End", endTime],
                  ["Duration", `${selectedDuration} hour${selectedDuration > 1 ? "s" : ""}`],
                  ["Rate", `BHD ${selectedSlot.pricePerHour}/hour`],
                ] as [string, string][]
              ).map(([label, value]) => (
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
          ) : null}

          <TouchableOpacity
            style={[
              styles.confirmButton,
              (loading || !selectedSlot) && { opacity: 0.5 },
            ]}
            onPress={handleBooking}
            disabled={loading || !selectedSlot}
          >
            <Text style={styles.confirmButtonText}>
              {loading
                ? "Confirming..."
                : selectedSlot
                ? "Confirm Booking"
                : "Select a Time Slot"}
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

  title: {
    fontSize: 30,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginBottom: 4,
  },

  spaceTypeLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textSecondary,
    marginBottom: 2,
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

  centeredCard: {
    alignItems: "center",
    paddingVertical: 24,
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

  toggleCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
  },

  toggleLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.textPrimary,
  },

  spaceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },

  spaceName: {
    fontSize: 17,
    fontWeight: "700",
    color: COLORS.textPrimary,
    flex: 1,
    marginRight: 8,
  },

  spacePrice: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.primary,
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
