import React from "react";
import { StyleSheet, Text, TouchableOpacity } from "react-native";
import { COLORS } from "../constants/colors";

type ButtonProps = {
  title: string;
  onPress?: () => void;
  variant?: "primary" | "outline";
};

const Button = ({ title, onPress, variant = "primary" }: ButtonProps) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.button, variant === "outline" && styles.outlineButton]}
      activeOpacity={0.8}
    >
      <Text
        style={[styles.text, variant === "outline" && styles.outlineButtonText]}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );
};

export default Button;

const styles = StyleSheet.create({
  button: {
    backgroundColor: COLORS.primary,
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: "center",
  },
  outlineButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  text: {
    color: COLORS.black,
    fontSize: 16,
    fontWeight: "700",
  },
  outlineButtonText: {
    color: COLORS.textPrimary,
  },
});