import React, { useEffect, useMemo, useState } from "react";
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
import { useNavigation, useRoute } from "@react-navigation/native";
import firestore from "@react-native-firebase/firestore";
import { useFavourites } from "../context/FavouritesContext";
import type { FavouriteItem } from "../context/FavouritesContext";
import type { Venue } from "../types/venue";
import type { Space } from "../types/space";
import { ALL_TIME_SLOTS, getImageSource, getUpcomingDateIds } from "../utils/helpers";

type RouteParams = {
  venueId: string;
  venueData?: Venue;
};

const TOTAL_SLOTS = ALL_TIME_SLOTS.length;

const SpaceDetailsScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { toggleFavourite, isFavourite } = useFavourites();

  const { venueId, venueData } = route.params as RouteParams;

  const [venue, setVenue] = useState<Venue | null>(venueData ?? null);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [unavailableSpaces, setUnavailableSpaces] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!venueId) return;

    const loadVenue = async () => {
      if (venueData) return;
      const doc = await firestore().collection("venues").doc(venueId).get();
      if (doc.exists()) {
        setVenue({ id: doc.id, ...(doc.data() as Omit<Venue, "id">) });
      }
    };

    loadVenue();

    const unsubscribeSpaces = firestore()
      .collection("spaces")
      .where("venueId", "==", venueId)
      .where("isActive", "==", true)
      .onSnapshot((snapshot) => {
        const loadedSpaces = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<Space, "id">),
        }));
        setSpaces(loadedSpaces);
      });

    return () => unsubscribeSpaces();
  }, [venueId, venueData]);

  useEffect(() => {
    if (!venueId || spaces.length === 0) return;

    const upcomingDates = getUpcomingDateIds();

    const unsubscribe = firestore()
      .collection("bookings")
      .where("venueId", "==", venueId)
      .where("status", "==", "Confirmed")
      .onSnapshot((snapshot) => {
        const slotsBySpace: Record<string, Record<string, Set<string>>> = {};

        snapshot.docs.forEach((doc) => {
          const data = doc.data();
          const { spaceId, date, reservedSlots } = data as {
            spaceId?: string;
            date?: string;
            reservedSlots?: string[];
          };

          if (!spaceId || !date || !Array.isArray(reservedSlots)) return;
          if (!upcomingDates.includes(date)) return;

          if (!slotsBySpace[spaceId]) slotsBySpace[spaceId] = {};
          if (!slotsBySpace[spaceId][date]) slotsBySpace[spaceId][date] = new Set();
          reservedSlots.forEach((slot) => {
            if (slot) slotsBySpace[spaceId][date].add(slot);
          });
        });

        const nextUnavailable: Record<string, boolean> = {};

        spaces.forEach((space) => {
          const byDate = slotsBySpace[space.id] || {};
          const allFull = upcomingDates.every(
            (date) => (byDate[date]?.size ?? 0) >= TOTAL_SLOTS
          );
          nextUnavailable[space.id] = allFull;
        });

        setUnavailableSpaces(nextUnavailable);
      });

    return () => unsubscribe();
  }, [venueId, spaces]);

  const sortedSpaces = useMemo(() => {
    return [...spaces].sort((a, b) => {
      const aUnavailable = unavailableSpaces[a.id] === true;
      const bUnavailable = unavailableSpaces[b.id] === true;
      if (aUnavailable === bUnavailable) return 0;
      return aUnavailable ? 1 : -1;
    });
  }, [spaces, unavailableSpaces]);

  const toFavouriteItem = (space: Space): FavouriteItem => ({
    id: space.id,
    venueName: venue?.name ?? "",
    spaceName: space.title,
    location: venue?.location ?? "",
    pricePerHour: space.pricePerHour,
  });

  if (!venue) {
    return (
      <View style={[styles.safeArea, { paddingTop: insets.top }]}> 
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading venue details…</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.safeArea, { paddingTop: insets.top }]}> 
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={[styles.backButton, { top: insets.top + 14 }]}
        activeOpacity={0.8}
      >
        <Text style={styles.backArrow}>←</Text>
      </TouchableOpacity>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <ImageBackground
          source={getImageSource(venue.heroImage)}
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
          {sortedSpaces.map((space, index) => {
            const favourited = isFavourite(space.id);
            const isUnavailable = unavailableSpaces[space.id] === true;

            return (
              <View
                key={space.id}
                style={[
                  styles.optionRow,
                  index % 2 !== 0 ? styles.optionRowAlt : null,
                ]}
              >
                <View style={styles.imageWrapper}>
                  <Image
                    source={getImageSource(space.image)}
                    style={[
                      styles.optionImage,
                      isUnavailable && styles.optionImageDimmed,
                    ]}
                  />

                  {isUnavailable && (
                    <View style={styles.unavailableOverlay}>
                      <View style={styles.unavailableBadge}>
                        <Text style={styles.unavailableBadgeText}>
                          🚫 Unavailable
                        </Text>
                      </View>
                    </View>
                  )}

                  <TouchableOpacity
                    style={styles.favoriteButton}
                    onPress={() => toggleFavourite(toFavouriteItem(space))}
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
                  <View style={styles.titleRow}>
                    <Text style={styles.optionTitle}>{space.title}</Text>
                    {isUnavailable && (
                      <View style={styles.unavailablePill}>
                        <Text style={styles.unavailablePillText}>
                          Unavailable
                        </Text>
                      </View>
                    )}
                  </View>

                  <Text style={styles.optionDescription}>{space.description}</Text>

                  <View style={styles.optionTagsContainer}>
                    {space.tags.map((tag, tagIndex) => (
                      <View key={tagIndex} style={styles.optionTag}>
                        <Text style={styles.optionTagText}>{tag}</Text>
                      </View>
                    ))}
                    <View style={styles.capacityTag}>
                      <Text style={styles.capacityTagText}>
                        👥 Up to {space.capacity}{" "}
                        {space.capacity === 1 ? "guest" : "guests"}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.optionPrice}>
                    BHD {space.pricePerHour.toFixed(2)} / hour
                  </Text>
                  <Text style={styles.optionAvailability}>
                    {space.availabilityText}
                  </Text>

                  <TouchableOpacity
                    style={[
                      styles.bookButton,
                      isUnavailable && styles.bookButtonDisabled,
                    ]}
                    disabled={isUnavailable}
                    onPress={() =>
                      navigation.navigate("Booking", {
                        venueId,
                        venueName: venue.name,
                        location: venue.location,
                        spaceId: space.id,
                        spaceName: space.title,
                        pricePerHour: space.pricePerHour,
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#FFFFFF",
    fontSize: 16,
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
    right: 16,
    top: 16,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
  },
  favoriteIcon: {
    color: "#FFFFFF",
    fontSize: 20,
  },
  favoriteIconActive: {
    color: "#FF375F",
  },
  optionContent: {
    paddingBottom: 4,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  optionTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "800",
    flex: 1,
  },
  optionDescription: {
    color: "rgba(255,255,255,0.85)",
    lineHeight: 20,
    marginBottom: 12,
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
  optionTagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  optionTag: {
    backgroundColor: "#1E293B",
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
    marginBottom: 8,
  },
  optionTagText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  capacityTag: {
    backgroundColor: "#111827",
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  capacityTagText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  optionPrice: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 6,
  },
  optionAvailability: {
    color: "#9CA3AF",
    fontSize: 14,
    marginBottom: 16,
  },
  bookButton: {
    backgroundColor: "#14CFFF",
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: "center",
  },
  bookButtonDisabled: {
    backgroundColor: "rgba(20,207,255,0.2)",
  },
  bookButtonText: {
    color: "#141414",
    fontSize: 15,
    fontWeight: "700",
  },
  bookButtonTextDisabled: {
    color: "rgba(20,207,255,0.8)",
  },
});
