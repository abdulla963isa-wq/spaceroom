import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Image,
} from "react-native";
import { useNavigation } from "@react-navigation/native";


type SpaceOption = {
  id: string;
  title: string;
  description: string;
  image: string;
  tags: string[];
  capacity: number;
  price: string;
  availability: string;
};

const SpaceDetailsScreen = () => {
const navigation = useNavigation<any>();
  const [favorites, setFavorites] = useState<Record<string, boolean>>({});

  const toggleFavorite = (id: string) => {
    setFavorites((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const venue = {
    name: "Diwan Hub, Adliya",
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
        availability: "Available Sunday–Thursday, 9AM–5PM",
      },
    ] as SpaceOption[],
  };

  return (
    <SafeAreaView style={styles.safeArea}>
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
          {venue.options.map((option, index) => {
            const isFavorite = favorites[option.id];

            return (
              <View
                key={option.id}
                style={[
                  styles.optionRow,
                  index % 2 !== 0 ? styles.optionRowAlt : null,
                ]}
              >
                <View style={styles.imageWrapper}>
                  <Image source={{ uri: option.image }} style={styles.optionImage} />

                  <TouchableOpacity
                    style={styles.favoriteButton}
                    onPress={() => toggleFavorite(option.id)}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.favoriteIcon,
                        isFavorite && styles.favoriteIconActive,
                      ]}
                    >
                      {isFavorite ? "♥" : "♡"}
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.optionContent}>
                  <Text style={styles.optionTitle}>{option.title}</Text>
                  <Text style={styles.optionDescription}>{option.description}</Text>

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
                  <Text style={styles.optionAvailability}>{option.availability}</Text>

                  <TouchableOpacity
  style={styles.bookButton}
  onPress={() => navigation.navigate("Booking")}
>
  <Text style={styles.bookButtonText}>Book Now</Text>
</TouchableOpacity>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
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
  optionTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 10,
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
  bookButtonText: {
    color: "#061018",
    fontSize: 14,
    fontWeight: "800",
  },
});