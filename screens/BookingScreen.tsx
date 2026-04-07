import React, { useMemo, useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { COLORS } from "../constants/colors";
import BottomNav from "../components/BottomNav";

type DateItem = {
  id: string;
  shortDay: string;
  dayNumber: string;
  fullDate: string;
  rawDate: Date;
};

const BookingScreen = () => {
const navigation = useNavigation<any>();

  const bookingItem = {
    venueName: "Diwan Hub, Adliya",
    spaceName: "Meeting Room",
    pricePerHour: 5.5,
    location: "Block 338, Adliya",
  };

  const generateUpcomingDates = (count: number): DateItem[] => {
    const today = new Date();

    return Array.from({ length: count }, (_, index) => {
      const current = new Date(today);
      current.setDate(today.getDate() + index);

      const shortDay = current.toLocaleDateString("en-US", {
        weekday: "short",
      });

      const dayNumber = current.toLocaleDateString("en-US", {
        day: "2-digit",
      });

      const fullDate = current.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });

      const id = current.toISOString().split("T")[0];

      return {
        id,
        shortDay,
        dayNumber,
        fullDate,
        rawDate: current,
      };
    });
  };

  const dates = useMemo(() => generateUpcomingDates(14), []);
  const timeSlots = [
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
  const durations = [1, 2, 3, 4];

  const [selectedDateId, setSelectedDateId] = useState(dates[0].id);
  const [selectedTime, setSelectedTime] = useState("10:00 AM");
  const [selectedDuration, setSelectedDuration] = useState(2);

  const selectedDate = useMemo(() => {
    return dates.find((item) => item.id === selectedDateId) || dates[0];
  }, [dates, selectedDateId]);

  const total = useMemo(() => {
    return (bookingItem.pricePerHour * selectedDuration).toFixed(2);
  }, [bookingItem.pricePerHour, selectedDuration]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.screen}>
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.smallLabel}>Booking</Text>
            <Text style={styles.title}>{bookingItem.spaceName}</Text>
            <Text style={styles.subtitle}>{bookingItem.venueName}</Text>
            <Text style={styles.location}>{bookingItem.location}</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Select Date</Text>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalRow}
            >
              {dates.map((item) => {
                const isSelected = selectedDateId === item.id;

                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.dateCard,
                      isSelected && styles.selectedDateCard,
                    ]}
                    onPress={() => setSelectedDateId(item.id)}
                    activeOpacity={0.8}
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
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Select Time</Text>

            <View style={styles.wrapRow}>
              {timeSlots.map((slot) => {
                const isSelected = selectedTime === slot;

                return (
                  <TouchableOpacity
                    key={slot}
                    style={[
                      styles.optionChip,
                      isSelected && styles.selectedOptionChip,
                    ]}
                    onPress={() => setSelectedTime(slot)}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        isSelected && styles.selectedOptionText,
                      ]}
                    >
                      {slot}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Duration</Text>

            <View style={styles.wrapRow}>
              {durations.map((hours) => {
                const isSelected = selectedDuration === hours;

                return (
                  <TouchableOpacity
                    key={hours}
                    style={[
                      styles.optionChip,
                      isSelected && styles.selectedOptionChip,
                    ]}
                    onPress={() => setSelectedDuration(hours)}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        isSelected && styles.selectedOptionText,
                      ]}
                    >
                      {hours} {hours === 1 ? "hour" : "hours"}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Booking Summary</Text>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Venue</Text>
              <Text style={styles.summaryValue}>{bookingItem.venueName}</Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Space</Text>
              <Text style={styles.summaryValue}>{bookingItem.spaceName}</Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Date</Text>
              <Text style={styles.summaryValue}>{selectedDate.fullDate}</Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Time</Text>
              <Text style={styles.summaryValue}>{selectedTime}</Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Duration</Text>
              <Text style={styles.summaryValue}>
                {selectedDuration} {selectedDuration === 1 ? "hour" : "hours"}
              </Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Rate</Text>
              <Text style={styles.summaryValue}>
                BHD {bookingItem.pricePerHour.toFixed(2)}/hour
              </Text>
            </View>

            <View style={[styles.summaryRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>BHD {total}</Text>
            </View>
          </View>

         <TouchableOpacity
  style={styles.confirmButton}
  activeOpacity={0.8}
  onPress={() => navigation.navigate("BookingSuccess")}
>
  <Text style={styles.confirmButtonText}>Confirm Booking</Text>
</TouchableOpacity>
        </ScrollView>

        <BottomNav activeTab=" My Bookings" />
      </View>
    </SafeAreaView>
  );
};

export default BookingScreen;

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
    paddingTop: 32,
    paddingBottom: 120,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 12,
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
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textPrimary,
    marginBottom: 4,
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
  horizontalRow: {
    paddingRight: 8,
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
    fontWeight: "600",
    color: COLORS.textSecondary,
    marginBottom: 6,
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
  optionText: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.textPrimary,
  },
  selectedOptionText: {
    color: COLORS.black,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    flex: 1,
  },
  summaryValue: {
    fontSize: 14,
    color: COLORS.textPrimary,
    fontWeight: "600",
    flex: 1,
    textAlign: "right",
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