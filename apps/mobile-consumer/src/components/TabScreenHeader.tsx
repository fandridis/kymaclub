import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { theme } from '../theme';

interface TabScreenHeaderProps {
  title?: string;
  subtitle?: string;
  renderLeftSide?: () => React.ReactNode;
  renderRightSide?: () => React.ReactNode;
  titleBadge?: React.ReactNode;
}

export function TabScreenHeader({ title, subtitle, renderLeftSide, renderRightSide, titleBadge }: TabScreenHeaderProps) {
  return (
    <View style={styles.headerContainer}>
      {renderLeftSide && (
        <View style={styles.leftSide}>
          {renderLeftSide()}
        </View>
      )}
      {title && (
        <View style={styles.titleContainer}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>{title}</Text>
            {titleBadge && (
              <View style={styles.badgeContainer}>
                {titleBadge}
              </View>
            )}
          </View>
          {subtitle && (
            <Text style={styles.subtitle}>{subtitle}</Text>
          )}
        </View>
      )}
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
    paddingHorizontal: 12,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: theme.colors.zinc[50],
  },
  titleContainer: {
    flex: 1,
    gap: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: theme.fontSize['2xl'],
    fontWeight: theme.fontWeight.black,
    color: theme.colors.zinc[900],
  },
  badgeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#6c757d',
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
    gap: 6,
  },
});
