import React, { useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  Image,
  Linking,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { COLORS } from "../../constants/colors";

const { width } = Dimensions.get("window");

const carouselImages = [
  require("../../assets/images/diwan.jpg"),
  require("../../assets/images/savoy.jpg"),
];

const RegisterScreen = () => {
  const navigation = useNavigation<any>();
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const onScroll = (e: any) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / (width - 40));
    setActiveIndex(index);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* App name */}
        <Text style={styles.appName}>Spaceroom</Text>

        {/* Image Carousel */}
        <FlatList
          ref={flatListRef}
          data={carouselImages}
          horizontal
          pagingEnabled={false}
          snapToInterval={width - 40}
          decelerationRate="fast"
          showsHorizontalScrollIndicator={false}
          onScroll={onScroll}
          scrollEventThrottle={16}
          contentContainerStyle={styles.carouselContainer}
          keyExtractor={(_, i) => String(i)}
          renderItem={({ item }) => (
            <Image source={item} style={styles.carouselImage} />
          )}
        />

        {/* Dots */}
        <View style={styles.dotsRow}>
          {carouselImages.map((_, i) => (
            <View
              key={i}
              style={[styles.dot, activeIndex === i && styles.activeDot]}
            />
          ))}
        </View>

        {/* About us */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About us:</Text>
          <Text style={styles.sectionText}>
            We believe the right environment changes everything. Spaceroom
            connects Bahrain's students, freelancers, and professionals to
            inspiring spaces — transforming how people work, study, meet, and
            create. Through partnerships with cafés, co-working hubs, hotels,
            and studios, we bring flexibility, discovery, and connection to
            everyday productivity and collaboration. Whether for work, study,
            or events, there's always a space ready to inspire you.
          </Text>
          <Text style={styles.sectionText}>
            Our Vision: To make every corner of the city a space to work,
            connect, and experience.
          </Text>
        </View>

        {/* Book Now */}
        <TouchableOpacity
          style={styles.bookButton}
          onPress={() => navigation.navigate("Booking")}
          activeOpacity={0.85}
        >
          <Text style={styles.bookButtonText}>BOOK NOW</Text>
        </TouchableOpacity>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Contact us */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact us:</Text>
          <Text style={styles.sectionText}>
            Whether you're a venue partner or someone looking for the perfect
            place to work — we'd love to connect.
          </Text>
          <TouchableOpacity
            onPress={() => Linking.openURL("mailto:spaceroombh@gmail.com")}
          >
            <Text style={styles.emailLink}>✉ spaceroombh@gmail.com</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default RegisterScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  appName: {
    color: COLORS.textPrimary,
    fontSize: 26,
    fontWeight: "700",
    paddingHorizontal: 20,
    paddingTop: 90,
    marginBottom: 16,
  },
  carouselContainer: {
    paddingHorizontal: 20,
    gap: 12,
  },
  carouselImage: {
    width: width - 40,
    height: 160,
    borderRadius: 16,
    marginRight: 12,
  },
  dotsRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 12,
    marginBottom: 24,
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.border,
  },
  activeDot: {
    backgroundColor: COLORS.textSecondary,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 10,
    textAlign: "center",
  },
  sectionText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 10,
  },
  bookButton: {
    marginHorizontal: 20,
    backgroundColor: COLORS.primary,
    borderRadius: 30,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 24,
  },
  bookButtonText: {
    color: COLORS.black,
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 1,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginHorizontal: 20,
    marginBottom: 24,
  },
  emailLink: {
    color: COLORS.primary,
    fontSize: 13,
    marginTop: 8,
    textDecorationLine: "underline",
  },
});
