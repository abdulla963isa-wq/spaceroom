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
import type { Space } from "../types/space";
import type { Venue } from "../types/venue";
import { getDistanceKm, getImageSource } from "../utils/helpers";
import { seedAppDataIfEmpty } from "../services/firestoreSeed";

type HomeSpaceCard = {
  id: string;
  title: string;
  location: string;
  type: string;
  image: any;
  venueId: string;
  distanceKm?: number;
};

const categories = ["All", "Nearby", "Work", "Study", "Meetings", "Events"];

const HomeScreen = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();

  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [venues, setVenues] = useState<Venue[]>([]);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [currentLocation, setCurrentLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [locationDenied, setLocationDenied] = useState(false);
  const [locationLoading, setLocationLoading] = useState(true);

  useEffect(() => {
    const initialize = async () => {
      await seedAppDataIfEmpty();
      await loadCurrentLocation();
    };

    initialize().catch((error) => {
      console.error("HomeScreen initialization error:", error);
      setLocationLoading(false);
    });
  }, []);

  useEffect(() => {
    const unsubscribeVenues = firestore()
      .collection("venues")
      .where("isActive", "==", true)
      .onSnapshot(
        (snapshot) => {
          if (!snapshot?.docs) {
            setVenues([]);
            return;
          }

          const loadedVenues = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...(doc.data() as Omit<Venue, "id">),
          }));
          setVenues(loadedVenues);
        },
        (error) => {
          console.error("Venues snapshot error:", error);
          setVenues([]);
        }
      );

    const unsubscribeSpaces = firestore()
      .collection("spaces")
      .where("isActive", "==", true)
      .onSnapshot(
        (snapshot) => {
          if (!snapshot?.docs) {
            setSpaces([]);
            return;
          }

          const loadedSpaces = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...(doc.data() as Omit<Space, "id">),
          }));
          setSpaces(loadedSpaces);
        },
        (error) => {
          console.error("Spaces snapshot error:", error);
          setSpaces([]);
        }
      );

    return () => {
      unsubscribeVenues();
      unsubscribeSpaces();
    };
  }, []);

  const requestLocationPermission = async (): Promise<boolean> => {
    if (Platform.OS === "ios") {
      try {
        Geolocation.requestAuthorization();
        return true;
      } catch (error) {
        console.warn("iOS location authorization failed:", error);
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
      (error) => {
        console.error("Location error:", error);
        setLocationDenied(true);
        setLocationLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 10000,
      }
    );
  };

  const venuesById = useMemo(
    () => Object.fromEntries(venues.map((venue) => [venue.id, venue])),
    [venues]
  );

  const featuredSpaces = useMemo((): HomeSpaceCard[] =>
    spaces
      .map<HomeSpaceCard | null>((space) => {
        const venue = venuesById[space.venueId];
        if (!venue) return null;

        const type = space.type?.trim() || space.tags?.[0] || "Work";
        const image = getImageSource(space.image);
        const distanceKm =
          currentLocation &&
          typeof venue.latitude === "number" &&
          typeof venue.longitude === "number"
            ? getDistanceKm(
                currentLocation.latitude,
                currentLocation.longitude,
                venue.latitude,
                venue.longitude
              )
            : undefined;

        return {
          id: space.id,
          title: space.title,
          location: venue.location || "",
          type,
          image,
          venueId: venue.id,
          distanceKm,
        };
      })
      .filter((item): item is HomeSpaceCard => item !== null),
    [spaces, venuesById, currentLocation]
  );

  const filteredSpaces = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    const baseMatches = featuredSpaces.filter((space) => {
      const matchesSearch =
        query === "" ||
        space.title.toLowerCase().includes(query) ||
        space.location.toLowerCase().includes(query) ||
        space.type.toLowerCase().includes(query);

      if (!matchesSearch) return false;
      if (selectedCategory === "All") return true;
      if (selectedCategory === "Nearby") return true;
      return space.type.toLowerCase() === selectedCategory.toLowerCase();
    });

    if (selectedCategory === "Nearby") {
      return baseMatches
        .filter((space) => typeof space.distanceKm === "number" && space.distanceKm <= 10)
        .sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0));
    }

    return baseMatches;
  }, [featuredSpaces, searchQuery, selectedCategory]);

  const getEmptyStateMessage = () => {
    if (searchQuery.trim() !== "") {
      return `No spaces found for "${searchQuery}"`;
    }

    if (selectedCategory === "Nearby") {
      if (locationLoading) {
        return "Finding nearby spaces…";
      }
      if (locationDenied) {
        return "Enable location access to show nearby spaces.";
      }
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

          {filteredSpaces.length > 0 ? (
            filteredSpaces.map((space) => (
              <SpaceCard
                key={space.id}
                title={space.title}
                location={space.location}
                type={space.type}
                image={space.image}
                onPress={() =>
                  navigation.navigate("SpaceDetails", {
                    venueId: space.venueId,
                  })
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
