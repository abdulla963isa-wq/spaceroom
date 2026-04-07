import React, { useMemo, useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const BookingScreen = () => {
  const bookingItem = {
    venueName: "Diwan Hub, Adliya",
    spaceName: "Meeting Room",
    pricePerHour: 5.5,
    location: "Block 338, Adliya",
  };

  const dates = [
    { day: "Sun", date: "13" },
    { day: "Mon", date: "14" },
    { day: "Tue", date: "15" },
    { day: "Wed", date: "16" },
    { day: "Thu", date: "17" },
  ];

  const timeSlots = [
    "9:00 AM",
    "10:00 AM",
    "11:00 AM",
    "12:00 PM",
    "1:00 PM",
    "2:00 PM",
    "3:00 PM",
    "4:00 PM",
  ];

  const durations = [1, 2, 3, 4];

  const [selectedDate, setSelectedDate] = useState("14");
  const [selectedTime, setSelectedTime] = useState("10:00 AM");
  const [selectedDuration, setSelectedDuration] = useState(2);

  const total = useMemo(() => {
    return (bookingItem.pricePerHour * selectedDuration).toFixed(2);
  }, [bookingItem.pricePerHour, selectedDuration]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
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
              const isSelected = selectedDate === item.date;

              return (
                <TouchableOpacity
                  key={item.date}
                  style={[styles.dateCard, isSelected && styles.selectedDateCard]}
                  onPress={() => setSelectedDate(item.date)}
                >
                  <Text
                    style={[styles.dateDayText, isSelected && styles.selectedDateText]}
                  >
                    {item.day}
                  </Text>
                  <Text
                    style={[styles.dateNumberText, isSelected && styles.selectedDateText]}
                  >
                    {item.date}
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
                  style={[styles.slotChip, isSelected && styles.selectedSlotChip]}
                  onPress={() => setSelectedTime(slot)}
                >
                  <Text
                    style={[styles.slotText, isSelected && styles.selectedSlotText]}
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
                  style={[styles.durationChip, isSelected && styles.selectedDurationChip]}
                  onPress={() => setSelectedDuration(hours)}
                >
                  <Text
                    style={[
                      styles.durationText,
                      isSelected && styles.selectedDurationText,
                    ]}
                  >
                    {hours} {hours === 1 ? "hour" : "hours"}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.summaryCard}>
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
            <Text style={styles.summaryValue}>{selectedDate}</Text>
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

        <TouchableOpacity style={styles.confirmButton}>
          <Text style={styles.confirmButtonText}>Confirm Booking</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

export default BookingScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#0E1420",
  },
  container: {
    flex: 1,
    backgroundColor: "#0E1420",
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 12,
  },
  smallLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#19E6C1",
    marginBottom: 8,
  },
  title: {
    fontSize: 30,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 16,
    color: "#D5DBE3",
    marginBottom: 4,
  },
  location: {
    fontSize: 14,
    color: "#94A0AF",
  },
  card: {
    backgroundColor: "#151C29",
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 20,
    padding: 18,
  },
  summaryCard: {
    backgroundColor: "#151C29",
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 20,
    padding: 18,
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 14,
  },
  horizontalRow: {
    paddingRight: 8,
  },
  dateCard: {
    width: 72,
    height: 86,
    borderRadius: 18,
    backgroundColor: "#1D2635",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    borderWidth: 1,
    borderColor: "#263041",
  },
  selectedDateCard: {
    backgroundColor: "#19E6C1",
    borderColor: "#19E6C1",
  },
  dateDayText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#B8C0CC",
    marginBottom: 6,
  },
  dateNumberText: {
    fontSize: 22,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  selectedDateText: {
    color: "#061018",
  },
  wrapRow: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  slotChip: {
    backgroundColor: "#1D2635",
    borderWidth: 1,
    borderColor: "#263041",
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 14,
    marginRight: 10,
    marginBottom: 10,
  },
  selectedSlotChip: {
    backgroundColor: "#19E6C1",
    borderColor: "#19E6C1",
  },
  slotText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  selectedSlotText: {
    color: "#061018",
  },
  durationChip: {
    backgroundColor: "#1D2635",
    borderWidth: 1,
    borderColor: "#263041",
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 14,
    marginRight: 10,
    marginBottom: 10,
  },
  selectedDurationChip: {
    backgroundColor: "#19E6C1",
    borderColor: "#19E6C1",
  },
  durationText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  selectedDurationText: {
    color: "#061018",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: "#97A3B3",
    flex: 1,
  },
  summaryValue: {
    fontSize: 14,
    color: "#FFFFFF",
    fontWeight: "600",
    flex: 1,
    textAlign: "right",
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: "#243041",
    marginTop: 8,
    paddingTop: 14,
  },
  totalLabel: {
    fontSize: 17,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  totalValue: {
    fontSize: 18,
    fontWeight: "800",
    color: "#19E6C1",
  },
  confirmButton: {
    backgroundColor: "#19E6C1",
    marginHorizontal: 20,
    marginBottom: 34,
    paddingVertical: 17,
    borderRadius: 16,
    alignItems: "center",
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#061018",
  },
});