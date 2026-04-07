import React from "react";
import { StyleSheet, TextInput, TextInputProps } from "react-native";
import { COLORS } from "../constants/colors";

const Input = (props: TextInputProps) => {
  return (
    <TextInput
      placeholderTextColor={COLORS.textMuted}
      {...props}
      style={[styles.input, props.style]}
    />
  );
};

export default Input;

const styles = StyleSheet.create({
  input: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: COLORS.textPrimary,
    fontSize: 15,
  },
});