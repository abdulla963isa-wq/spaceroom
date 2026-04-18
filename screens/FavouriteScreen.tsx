import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS } from "../constants/colors";
import { useFavourites } from "../context/FavouritesContext";

const FavouritesScreen = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { favourites, toggleFavourite } = useFavourites();

  return (
    <View style={[styles.safeArea, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
          <Text style={styles.smallLabel}>Saved</Text>
          <Text style={styles.title}>Favourites</Text>
        </View>

        {favourites.length === 0 ? (
          <View style={styles.emptyWrapper}>
            <Text style={styles.emptyIcon}>🤍</Text>
            <Text style={styles.emptyTitle}>No favourites yet</Text>
            <Text style={styles.emptySubtitle}>
              Tap the heart on any space to save it here
            </Text>
          </View>
        ) : (
          <View style={styles.listWrapper}>
            {favourites.map((item) => (
              <View key={item.id} style={styles.card}>
                <View style={styles.cardLeft}>
                  <Text style={styles.spaceName}>{item.spaceName}</Text>
                  <Text style={styles.venueName}>{item.venueName}</Text>
                  <Text style={styles.location}>{item.location}</Text>
                  <Text style={styles.price}>
                    BHD {item.pricePerHour.toFixed(2)}/hour
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => toggleFavourite(item)}
                  style={styles.heartButton}
                  activeOpacity={0.8}
                >
                  <Text style={styles.heartIcon}>❤️</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default FavouritesScreen;

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { paddingBottom: 60 },
  header: {
    paddingHorizontal: 20,
    paddingTop: 32,
    paddingBottom: 12,
  },
  backButton: {
    alignSelf: "flex-start",
    marginBottom: 20,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    width: 46,
    height: 46,
    justifyContent: "center",
    alignItems: "center",
  },
  backArrow: {
    fontSize: 22,
    color: COLORS.textPrimary,
    fontWeight: "600",
    lineHeight: 26,
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
  },
  emptyWrapper: {
    alignItems: "center",
    marginTop: 100,
    paddingHorizontal: 40,
  },
  emptyIcon: { fontSize: 52, marginBottom: 16 },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },
  listWrapper: { paddingHorizontal: 20, paddingTop: 8 },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 18,
    marginBottom: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardLeft: { flex: 1, marginRight: 12 },
  spaceName: {
    fontSize: 17,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  venueName: {
    fontSize: 14,
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  location: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  price: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.primary,
  },
  heartButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: "center",
    alignItems: "center",
  },
  heartIcon: { fontSize: 20 },
});
