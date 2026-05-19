import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { COLORS } from "../constants/colors";

type SpaceCardProps = {
  title: string;
  location: string;
  type: string;
  image: any;
  distanceKm?: number;
  onPress?: () => void;
};

const SpaceCard = ({ title, location, type, image, distanceKm, onPress }: SpaceCardProps) => {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      <Image source={image} style={styles.image} />
      <View style={styles.cardContent}>
        <View style={styles.titleRow}>
          <Text style={styles.cardTitle}>{title}</Text>
          {distanceKm !== undefined && (
            <View style={styles.distanceBadge}>
              <Text style={styles.distanceText}>{distanceKm} km</Text>
            </View>
          )}
        </View>
        <Text style={styles.cardSubtitle}>{location}</Text>
        <Text style={styles.cardType}>{type}</Text>
      </View>
    </TouchableOpacity>
  );
};

export default SpaceCard;

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: "hidden",
    marginBottom: 16,
  },
  image: {
    width: "100%",
    height: 180,
  },
  cardContent: {
    padding: 16,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  cardTitle: {
    color: COLORS.textPrimary,
    fontSize: 20,
    fontWeight: "700",
    flex: 1,
  },
  distanceBadge: {
    backgroundColor: COLORS.primary + "22",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  distanceText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: "600",
  },
  cardSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 14,
    marginTop: 6,
  },
  cardType: {
    color: COLORS.primary,
    fontSize: 14,
    marginTop: 8,
    fontWeight: "600",
  },
});