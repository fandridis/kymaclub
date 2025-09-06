import React from 'react';
import { View, ViewStyle, StyleSheet } from 'react-native';
import { theme } from '../theme';

interface DividerProps {
  rootStyle?: ViewStyle;
  dividerStyle?: ViewStyle;
}

export function Divider({ rootStyle, dividerStyle }: DividerProps) {
  return (
    <View style={[styles.root, rootStyle]}>
      <View style={[styles.separator, dividerStyle]} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    marginVertical: 24,
    paddingHorizontal: 16,
    flex: 1,
  },
  separator: {
    height: 1,
    backgroundColor: theme.colors.zinc[200],
  },
});