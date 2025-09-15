import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { theme } from '../theme';

interface TabScreenHeaderProps {
  title: string;
  renderLeftSide?: () => React.ReactNode;
  renderRightSide?: () => React.ReactNode;
}

export function TabScreenHeader({ title, renderLeftSide, renderRightSide }: TabScreenHeaderProps) {
  return (
    <View style={styles.headerContainer}>
      {renderLeftSide && (
        <View style={styles.leftSide}>
          {renderLeftSide()}
        </View>
      )}
      <Text style={styles.title}>{title}</Text>
      {renderRightSide && (
        <View style={styles.rightSide}>
          {renderRightSide()}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: theme.colors.zinc[50],
  },
  title: {
    fontSize: theme.fontSize['2xl'],
    fontWeight: theme.fontWeight.black,
    color: theme.colors.zinc[900],
    flex: 1,
  },
  // Keep title left-aligned even when side content exists
  // (was centered previously causing awkward positioning)
  titleWithSides: {},
  leftSide: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rightSide: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
});
