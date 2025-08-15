import React from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { commonStyles } from './styles';

interface LoadingSpinnerProps {
  message?: string;
  visible: boolean;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  message = 'Loading...',
  visible,
}) => {
  if (!visible) return null;

  return (
    <View style={commonStyles.loadingContainer}>
      <ActivityIndicator size="large" color="#FFFFFF" />
      <Text style={commonStyles.loadingText}>{message}</Text>
    </View>
  );
};