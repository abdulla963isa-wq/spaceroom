import React, { useEffect, useMemo, useState } from "react";
import {
  PermissionsAndroid,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import firestore from "@react-native-firebase/firestore";
import Geolocation from "react-native-geolocation-service";
import Header from "../components/Header";
import SpaceCard from "../components/SpaceCard";
import { COLORS } from "../constants/colors";
import type { Venue } from "../types/venue";
import { getDistanceKm, getImageSource } from "../utils/helpers";

const categories = ["All", "Nearby", "Work", "Study", "Meetings", "Events"];

const HomeScreen = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();

  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [venues, setVenues] = useState<Venue[]>([]);
  const [currentLocation, setCurrentLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [locationDenied, setLocationDenied] = useState(false);
  const [locationLoading, setLocationLoading] = useState(true);

  useEffect(() => {
    loadCurrentLocation().catch(() => setLocationLoading(false));
  }, []);

  useEffect(() => {
    const unsubscribe = firestore()
      .collection("venues")
      .where("isActive", "==", true)
      .onSnapshot(
        (snapshot) => {
          if (!snapshot?.docs) {
            setVenues([]);
            return;
          }
          const loaded = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...(doc.data() as Omit<Venue, "id">),
          }));
          setVenues(loaded);
        },
        (error) => {
          console.error("Venues snapshot error:", error);
          setVenues([]);
        }
      );

    return () => unsubscribe();
  }, []);

  const requestLocationPermission = async (): Promise<boolean> => {
    if (Platform.OS === "ios") {
      try {
        Geolocation.requestAuthorization();
        return true;
      } catch {
        return false;
      }
    }
    if (Platform.OS === "android") {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: "SpaceRoom location access",
          message:
            "Allow location access to find nearby spaces and show the best results.",
          buttonPositive: "Allow",
          buttonNegative: "Deny",
        }
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }
    return false;
  };

  const loadCurrentLocation = async () => {
    const granted = await requestLocationPermission();
    if (!granted) {
      setLocationDenied(true);
      setLocationLoading(false);
      return;
    }
    Geolocation.getCurrentPosition(
      (position) => {
        setCurrentLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setLocationDenied(false);
        setLocationLoading(false);
      },
      () => {
        setLocationDenied(true);
        setLocationLoading(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  };

  const venuesWithDistance = useMemo(
    () =>
      venues.map((venue) => ({
        ...venue,
        distanceKm:
          currentLocation &&
          typeof venue.latitude === "number" &&
          typeof venue.longitude === "number"
            ? getDistanceKm(
                currentLocation.latitude,
                currentLocation.longitude,
                venue.latitude,
                venue.longitude
              )
            : undefined,
      })),
    [venues, currentLocation]
  );

  const filteredVenues = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();

    const baseMatches = venuesWithDistance.filter((venue) => {
      const matchesSearch =
        query === "" ||
        venue.name.toLowerCase().includes(query) ||
        venue.location.toLowerCase().includes(query) ||
        venue.description.toLowerCase().includes(query) ||
        venue.categories.some((c) => c.toLowerCase().includes(query));

      if (!matchesSearch) return false;
      if (selectedCategory === "All" || selectedCategory === "Nearby") return true;
      return venue.categories.some(
        (c) => c.toLowerCase() === selectedCategory.toLowerCase()
      );
    });

    if (selectedCategory === "Nearby") {
      return baseMatches
        .filter((v) => typeof v.distanceKm === "number" && v.distanceKm <= 10)
        .sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0));
    }

    return baseMatches;
  }, [venuesWithDistance, searchQuery, selectedCategory]);

  const getEmptyStateMessage = () => {
    if (searchQuery.trim() !== "") return `No spaces found for "${searchQuery}"`;
    if (selectedCategory === "Nearby") {
      if (locationLoading) return "Finding nearby spaces…";
      if (locationDenied) return "Enable location access to show nearby spaces.";
      return "No nearby spaces found.";
    }
    return "No spaces found.";
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.screen}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Header title={"Find your next\nperfect space"} />

          <TextInput
            style={styles.searchInput}
            placeholder="Search spaces..."
            placeholderTextColor={COLORS.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
            returnKeyType="search"
          />

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryRow}
          >
            {categories.map((item) => {
              const isActive = selectedCategory === item;
              const isNearby = item === "Nearby";
              return (
                <TouchableOpacity
                  key={item}
                  style={[
                    styles.categoryChip,
                    isActive && styles.activeCategoryChip,
                  ]}
                  onPress={() => setSelectedCategory(item)}
                  activeOpacity={0.8}
                >
                  {isNearby && (
                    <Text
                      style={[
                        styles.nearbyIcon,
                        isActive && styles.activeNearbyIcon,
                      ]}
                    >
                      📍
                    </Text>
                  )}
                  <Text
                    style={[
                      styles.categoryText,
                      isActive && styles.activeCategoryText,
                    ]}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <Text style={styles.sectionTitle}>Featured spaces</Text>

          {filteredVenues.length > 0 ? (
            filteredVenues.map((venue) => (
              <SpaceCard
                key={venue.id}
                title={venue.name}
                location={venue.location}
                type={venue.categories[0] ?? "Work"}
                image={getImageSource(venue.heroImage)}
                onPress={() =>
                  navigation.navigate("SpaceDetails", { venueId: venue.id })
                }
              />
            ))
          ) : (
            <Text style={styles.emptyText}>{getEmptyStateMessage()}</Text>
          )}
        </ScrollView>
      </View>
    </View>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  searchInput: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    color: COLORS.textPrimary,
    fontSize: 14,
  },
  categoryRow: {
    paddingTop: 18,
    paddingBottom: 8,
  },
  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 18,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginRight: 10,
  },
  activeCategoryChip: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  categoryText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: "500",
  },
  activeCategoryText: {
    color: COLORS.black,
    fontWeight: "700",
  },
  nearbyIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  activeNearbyIcon: {
    color: COLORS.black,
  },
  sectionTitle: {
    color: COLORS.textPrimary,
    fontSize: 20,
    fontWeight: "700",
    marginTop: 20,
    marginBottom: 14,
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    textAlign: "center",
    marginTop: 32,
  },
});
