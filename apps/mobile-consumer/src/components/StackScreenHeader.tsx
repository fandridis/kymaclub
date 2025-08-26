import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { ChevronLeftIcon } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../theme';

interface StackScreenHeaderProps {
  title?: string;
  renderRightSide?: () => React.ReactNode;
  onBackPress?: () => void;
}

export function StackScreenHeader({ title, renderRightSide, onBackPress }: StackScreenHeaderProps) {
  const navigation = useNavigation();

  const handleBackPress = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      try {
        if (navigation.canGoBack()) {
          navigation.goBack();
        } else {
          navigation.navigate('Home' as never);
        }
      } catch (error) {
        console.error('Navigation error:', error);
        navigation.navigate('Home' as never);
      }
    }
  };

  return (
    <View style={styles.headerContainer}>
      <TouchableOpacity
        onPress={handleBackPress}
        style={styles.backButton}
        activeOpacity={0.7}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <ChevronLeftIcon size={24} color="#111827" />
      </TouchableOpacity>

      {title && (
        <Text style={styles.headerTitle} numberOfLines={1}>
          {title}
        </Text>
      )}

      <View style={styles.rightSide}>
        {renderRightSide ? renderRightSide() : <View style={styles.rightSpacer} />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    // height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 0,
    backgroundColor: theme.colors.zinc[50],
  },
  backButton: {
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    marginLeft: -8,
    borderRadius: 20,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginHorizontal: 16,
  },
  rightSide: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minWidth: 40,
  },
  rightSpacer: {
    width: 32,
  },
});