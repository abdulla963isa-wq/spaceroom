import React, { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Header from "../components/Header";
import Input from "../components/Input";
import SpaceCard from "../components/SpaceCard";
import { COLORS } from "../constants/colors";

const diwanImg = require("../assets/images/diwan.jpg");
const savoyImg = require("../assets/images/savoy.jpg");

const HomeScreen = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();

  // ✅ FIX 1: state for selected category
  const [selectedCategory, setSelectedCategory] = useState("Work");

  const categories = ["Work", "Study", "Meetings", "Events"];

  const featuredSpaces = [
    {
      id: "1",
      title: "Diwan Studio",
      location: "Manama",
      type: "Work",
      image: diwanImg,
    },
    {
      id: "2",
      title: "Savoy Hotel Lounge",
      location: "Juffair",
      type: "Meetings",
      image: savoyImg,
    },
  ];

  // (optional future filtering ready)
  const filteredSpaces = featuredSpaces.filter((space) =>
    selectedCategory === "Work"
      ? true
      : space.type.includes(selectedCategory)
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.screen}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Header title={"Find your next\nperfect space"} />

          <Input placeholder="Search spaces..." />

          {/* ✅ FIX 2: category selection works now */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryRow}
          >
            {categories.map((item) => {
              const isActive = selectedCategory === item;

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

          {filteredSpaces.map((space) => (
            <SpaceCard
              key={space.id}
              title={space.title}
              location={space.location}
              type={space.type}
              image={space.image}
              onPress={() => navigation.navigate("SpaceDetails")}
            />
          ))}
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
  categoryRow: {
    paddingTop: 18,
    paddingBottom: 8,
  },
  categoryChip: {
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
  sectionTitle: {
    color: COLORS.textPrimary,
    fontSize: 20,
    fontWeight: "700",
    marginTop: 20,
    marginBottom: 14,
  },
});