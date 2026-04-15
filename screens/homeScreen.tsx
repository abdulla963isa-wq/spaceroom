import React, { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Header from "../components/Header";
import SpaceCard from "../components/SpaceCard";
import { COLORS } from "../constants/colors";

const diwanImg = require("../assets/images/diwan.jpg");
const savoyImg = require("../assets/images/savoy.jpg");

const HomeScreen = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();

  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  const categories = ["All", "Nearby", "Work", "Study", "Meetings", "Events"];

  const featuredSpaces = [
    {
      id: "1",
      title: "Diwan Studio",
      location: "Manama",
      type: "Work",
      image: diwanImg,
      nearby: true,
    },
    {
      id: "2",
      title: "Savoy Hotel Lounge",
      location: "Juffair",
      type: "Meetings",
      image: savoyImg,
      nearby: false,
    },
  ];

  const filteredSpaces = featuredSpaces.filter((space) => {
    const matchesCategory =
      selectedCategory === "All"
        ? true
        : selectedCategory === "Nearby"
        ? space.nearby
        : space.type === selectedCategory;

    const query = searchQuery.toLowerCase().trim();
    const matchesSearch =
      query === "" ||
      space.title.toLowerCase().includes(query) ||
      space.location.toLowerCase().includes(query) ||
      space.type.toLowerCase().includes(query);

    return matchesCategory && matchesSearch;
  });

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
                    <Text style={[styles.nearbyIcon, isActive && styles.activeNearbyIcon]}>
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
                onPress={() => navigation.navigate("SpaceDetails")}
              />
            ))
          ) : (
            <Text style={styles.emptyText}>
              {searchQuery.trim() !== ""
                ? `No spaces found for "${searchQuery}"`
                : "No spaces found."}
            </Text>
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
