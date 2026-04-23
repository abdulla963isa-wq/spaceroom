import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  ScrollView,
  TouchableOpacity,
  Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import firestore from "@react-native-firebase/firestore";
import { useFavourites } from "../context/FavouritesContext";
import type { FavouriteItem } from "../context/FavouritesContext";

type SpaceOption = {
  id: string;
  title: string;
  description: string;
  image: string;
  tags: string[];
  capacity: number;
  price: string;
  pricePerHour: number;
  availability: string;
};

const VENUE_ID = "diwan-hub";

const ALL_TIME_SLOTS = [
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
const TOTAL_SLOTS = ALL_TIME_SLOTS.length;

// Returns today + tomorrow as "YYYY-MM-DD" in Bahrain time
const getUpcomingDateIds = (): string[] => {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bahrain",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = formatter.formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)?.value || "";
  const [year, month, day] = [
    Number(get("year")),
    Number(get("month")),
    Number(get("day")),
  ];

  return Array.from({ length: 2 }, (_, i) => {
    const d = new Date(Date.UTC(year, month - 1, day + i));
    return d.toISOString().split("T")[0];
  });
};

const SpaceDetailsScreen = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { toggleFavourite, isFavourite } = useFavourites();

  // spaceName → true if fully booked across all available dates
  const [unavailableSpaces, setUnavailableSpaces] = useState<
    Record<string, boolean>
  >({});

  const venue = {
    name: "Diwan Hub, Adliya",
    location: "Block 338, Adliya",
    description:
      "Flexible spaces designed for productivity and collaboration. Located in the heart of Block 338, Adliya.",
    heroImage:
      "https://images.unsplash.com/photo-1497366811353-6870744d04b2?q=80&w=1600&auto=format&fit=crop",
    categories: [
      "Private Room",
      "Shared Desk",
      "Event Space",
      "Wi-Fi",
      "Charging Port",
      "Coffee",
      "Quiet Area",
    ],
    options: [
      {
        id: "1",
        title: "Meeting Room",
        description:
          "A bright meeting space designed for collaboration, calls, and creative work.",
        image:
          "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?q=80&w=1200&auto=format&fit=crop",
        tags: ["Private Room", "Screen", "Coffee"],
        capacity: 6,
        price: "BHD 5.5 / hour",
        pricePerHour: 5.5,
        availability: "Available Sunday–Thursday, 9AM–5PM",
      },
      {
        id: "2",
        title: "Board Room",
        description:
          "A professional space ideal for client meetings, presentations, and strategy sessions.",
        image:
          "https://images.unsplash.com/photo-1497366754035-f200968a6e72?q=80&w=1200&auto=format&fit=crop",
        tags: ["Meeting Table", "Board Screen", "Power Outlets"],
        capacity: 8,
        price: "BHD 14.3 / hour",
        pricePerHour: 14.3,
        availability: "Available Sunday–Thursday, 9AM–5PM",
      },
      {
        id: "3",
        title: "Event Space",
        description:
          "A versatile area for workshops, seminars, and private sessions — perfect for teams and events.",
        image:
          "https://images.unsplash.com/photo-1517502884422-41eaead166d4?q=80&w=1200&auto=format&fit=crop",
        tags: ["Open Area", "Presentation Screen", "Wi-Fi", "Projector"],
        capacity: 20,
        price: "BHD 25 / hour",
        pricePerHour: 25,
        availability: "Available Sunday–Thursday, 9AM–5PM",
      },
      {
        id: "4",
        title: "Day Pass",
        description:
          "Access shared desks, lounge, and café with high-speed Wi-Fi and coffee all day long.",
        image:
          "https://images.unsplash.com/photo-1524758631624-e2822e304c36?q=80&w=1200&auto=format&fit=crop",
        tags: ["Shared Desk", "Wi-Fi", "Air Conditioning", "Coffee"],
        capacity: 1,
        price: "BHD 5.5 / day",
        pricePerHour: 5.5,
        availability: "Access from 9AM–5PM Weekdays",
      },
      {
        id: "5",
        title: "Day Office",
        description:
          "Private, comfortable, and ideal for focused work or client calls with full access to Diwan amenities.",
        image:
          "https://images.unsplash.com/photo-1497366412874-3415097a27e7?q=80&w=1200&auto=format&fit=crop",
        tags: ["Private Room", "Office Desk", "Power Outlets", "Coffee", "Quiet Area"],
        capacity: 2,
        price: "BHD 11 / day",
        pricePerHour: 11,
        availability: "Available Sunday–Thursday, 9AM–5PM",
      },
    ] as SpaceOption[],
  };

  // ✅ Real-time Firestore listener — checks all spaces at once
  useEffect(() => {
    const upcomingDates = getUpcomingDateIds();

    const unsubscribe = firestore()
      .collection("bookings")
      .where("venueId", "==", VENUE_ID)
      .where("status", "==", "Confirmed")
      .onSnapshot((snapshot) => {
        // { spaceName: { date: Set<time> } }
        const slotsBySpace: Record<string, Record<string, Set<string>>> = {};

        snapshot.docs.forEach((doc) => {
          const data = doc.data();
          const { spaceName, date, time } = data;
          if (!spaceName || !date || !time) return;
          if (!upcomingDates.includes(date)) return;

          if (!slotsBySpace[spaceName]) slotsBySpace[spaceName] = {};
          if (!slotsBySpace[spaceName][date])
            slotsBySpace[spaceName][date] = new Set();
          slotsBySpace[spaceName][date].add(time);
        });

        const result: Record<string, boolean> = {};

        venue.options.forEach((option) => {
          const byDate = slotsBySpace[option.title] || {};
          // Unavailable only if ALL upcoming dates are fully booked
          const allFull = upcomingDates.every(
            (date) => (byDate[date]?.size ?? 0) >= TOTAL_SLOTS
          );
          result[option.title] = allFull;
        });

        setUnavailableSpaces(result);
      });

    return () => unsubscribe();
  }, []);

  const toFavouriteItem = (option: SpaceOption): FavouriteItem => ({
    id: option.id,
    venueName: venue.name,
    spaceName: option.title,
    location: venue.location,
    pricePerHour: option.pricePerHour,
  });

  // ✅ Sort: available spaces first, unavailable spaces last
  const sortedOptions = [...venue.options].sort((a, b) => {
    const aUnavailable = unavailableSpaces[a.title] === true;
    const bUnavailable = unavailableSpaces[b.title] === true;
    if (aUnavailable === bUnavailable) return 0;
    return aUnavailable ? 1 : -1;
  });

  return (
    <View style={[styles.safeArea, { paddingTop: insets.top }]}>
      {/* Floating back button */}
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={[styles.backButton, { top: insets.top + 14 }]}
        activeOpacity={0.8}
      >
        <Text style={styles.backArrow}>←</Text>
      </TouchableOpacity>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <ImageBackground
          source={{ uri: venue.heroImage }}
          style={styles.hero}
          imageStyle={styles.heroImage}
        >
          <View style={styles.overlay}>
            <View style={styles.heroContent}>
              <Text style={styles.venueName}>{venue.name}</Text>
              <Text style={styles.venueDescription}>{venue.description}</Text>
            </View>
          </View>
        </ImageBackground>

        <View style={styles.categorySection}>
          <Text style={styles.sectionTitle}>Filter by Category</Text>
          <View style={styles.chipContainer}>
            {venue.categories.map((category, index) => (
              <View key={index} style={styles.categoryChip}>
                <Text style={styles.categoryChipText}>{category}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.optionsSection}>
          {sortedOptions.map((option, index) => {
            const fav = toFavouriteItem(option);
            const favourited = isFavourite(fav.id);
            const isUnavailable = unavailableSpaces[option.title] === true;

            return (
              <View
                key={option.id}
                style={[
                  styles.optionRow,
                  index % 2 !== 0 ? styles.optionRowAlt : null,
                ]}
              >
                <View style={styles.imageWrapper}>
                  <Image
                    source={{ uri: option.image }}
                    style={[
                      styles.optionImage,
                      isUnavailable && styles.optionImageDimmed,
                    ]}
                  />

                  {/* ✅ Unavailable badge overlaid on image */}
                  {isUnavailable && (
                    <View style={styles.unavailableOverlay}>
                      <View style={styles.unavailableBadge}>
                        <Text style={styles.unavailableBadgeText}>
                          🚫 Unavailable
                        </Text>
                      </View>
                    </View>
                  )}

                  {/* Heart button */}
                  <TouchableOpacity
                    style={styles.favoriteButton}
                    onPress={() => toggleFavourite(fav)}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.favoriteIcon,
                        favourited && styles.favoriteIconActive,
                      ]}
                    >
                      {favourited ? "♥" : "♡"}
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.optionContent}>
                  {/* ✅ Title row with inline pill */}
                  <View style={styles.titleRow}>
                    <Text style={styles.optionTitle}>{option.title}</Text>
                    {isUnavailable && (
                      <View style={styles.unavailablePill}>
                        <Text style={styles.unavailablePillText}>
                          Unavailable
                        </Text>
                      </View>
                    )}
                  </View>

                  <Text style={styles.optionDescription}>
                    {option.description}
                  </Text>

                  <View style={styles.optionTagsContainer}>
                    {option.tags.map((tag, tagIndex) => (
                      <View key={tagIndex} style={styles.optionTag}>
                        <Text style={styles.optionTagText}>{tag}</Text>
                      </View>
                    ))}
                    <View style={styles.capacityTag}>
                      <Text style={styles.capacityTagText}>
                        👥 Up to {option.capacity}{" "}
                        {option.capacity === 1 ? "guest" : "guests"}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.optionPrice}>{option.price}</Text>
                  <Text style={styles.optionAvailability}>
                    {option.availability}
                  </Text>

                  {/* ✅ Book Now disabled + greyed when unavailable */}
                  <TouchableOpacity
                    style={[
                      styles.bookButton,
                      isUnavailable && styles.bookButtonDisabled,
                    ]}
                    disabled={isUnavailable}
                    onPress={() =>
                      navigation.navigate("Booking", {
                        spaceId: option.id,
                        spaceName: option.title,
                        venueName: venue.name,
                        location: venue.location,
                        pricePerHour: option.pricePerHour,
                      })
                    }
                  >
                    <Text
                      style={[
                        styles.bookButtonText,
                        isUnavailable && styles.bookButtonTextDisabled,
                      ]}
                    >
                      {isUnavailable ? "Fully Booked" : "Book Now"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
};

export default SpaceDetailsScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#0E1420",
  },
  container: {
    flex: 1,
    backgroundColor: "#0E1420",
  },
  backButton: {
    position: "absolute",
    left: 20,
    zIndex: 10,
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
    justifyContent: "center",
    alignItems: "center",
  },
  backArrow: {
    fontSize: 22,
    color: "#FFFFFF",
    fontWeight: "600",
    lineHeight: 26,
  },
  hero: {
    width: "100%",
    height: 320,
    justifyContent: "flex-end",
  },
  heroImage: {
    resizeMode: "cover",
  },
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.45)",
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  heroContent: {
    alignItems: "center",
  },
  venueName: {
    fontSize: 32,
    fontWeight: "800",
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 10,
  },
  venueDescription: {
    fontSize: 15,
    lineHeight: 22,
    color: "rgba(255,255,255,0.9)",
    textAlign: "center",
    paddingHorizontal: 12,
  },
  categorySection: {
    paddingTop: 24,
    paddingBottom: 24,
    paddingHorizontal: 20,
    backgroundColor: "#111827",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 18,
  },
  chipContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
  },
  categoryChip: {
    borderWidth: 1,
    borderColor: "#3A4454",
    backgroundColor: "#1B2432",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    margin: 5,
  },
  categoryChipText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  optionsSection: {
    paddingVertical: 20,
  },
  optionRow: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    backgroundColor: "#0E1420",
    borderBottomWidth: 1,
    borderBottomColor: "#1B2432",
  },
  optionRowAlt: {
    backgroundColor: "#151C29",
  },
  imageWrapper: {
    position: "relative",
    marginBottom: 18,
  },
  optionImage: {
    width: "100%",
    height: 220,
    borderRadius: 18,
  },
  optionImageDimmed: {
    opacity: 0.45,
  },

  // ✅ Dark overlay + centred badge on the image
  unavailableOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  unavailableBadge: {
    backgroundColor: "rgba(255,59,48,0.18)",
    borderWidth: 1.5,
    borderColor: "#FF3B30",
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  unavailableBadgeText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#FF3B30",
    letterSpacing: 0.4,
  },

  favoriteButton: {
    position: "absolute",
    top: 14,
    right: 14,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(255,255,255,0.92)",
    justifyContent: "center",
    alignItems: "center",
  },
  favoriteIcon: {
    fontSize: 22,
    color: "#1F2937",
  },
  favoriteIconActive: {
    color: "#E53935",
  },
  optionContent: {
    width: "100%",
  },

  // ✅ Title + pill inline
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 10,
  },
  optionTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  unavailablePill: {
    backgroundColor: "rgba(255,59,48,0.15)",
    borderWidth: 1,
    borderColor: "#FF3B3060",
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

  optionDescription: {
    fontSize: 14,
    lineHeight: 22,
    color: "#C7CED8",
    marginBottom: 14,
  },
  optionTagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 14,
  },
  optionTag: {
    borderWidth: 1,
    borderColor: "#4B5563",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: "#1C2431",
  },
  optionTagText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "600",
  },
  capacityTag: {
    backgroundColor: "rgba(25, 230, 193, 0.15)",
    borderWidth: 1,
    borderColor: "#19E6C1",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginRight: 8,
    marginBottom: 8,
  },
  capacityTagText: {
    color: "#19E6C1",
    fontSize: 11,
    fontWeight: "700",
  },
  optionPrice: {
    fontSize: 18,
    fontWeight: "800",
    color: "#19E6C1",
    marginBottom: 6,
  },
  optionAvailability: {
    fontSize: 13,
    color: "#A6AFBB",
    marginBottom: 14,
  },
  bookButton: {
    backgroundColor: "#19E6C1",
    alignSelf: "flex-start",
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
  },
  bookButtonDisabled: {
    backgroundColor: "#1C2431",
    borderWidth: 1,
    borderColor: "#3A4454",
  },
  bookButtonText: {
    color: "#061018",
    fontSize: 14,
    fontWeight: "800",
  },
  bookButtonTextDisabled: {
    color: "#6B7280",
  },
});
