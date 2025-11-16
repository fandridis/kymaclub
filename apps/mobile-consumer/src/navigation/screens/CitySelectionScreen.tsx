import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useMutation } from 'convex/react';
import { api } from '@repo/api/convex/_generated/api';
import { StackScreenHeader } from '../../components/StackScreenHeader';
import { useUserCity } from '../../hooks/use-user-city';
import { useTypedTranslation } from '../../i18n/typed';
import { theme } from '../../theme';
import { getCityOptions } from '@repo/utils/constants';

const CITY_OPTIONS = getCityOptions();

export function CitySelectionScreen() {
  const navigation = useNavigation();
  const { t } = useTypedTranslation();
  const { city: currentCity } = useUserCity();
  const [selectedCity, setSelectedCity] = useState<string>(currentCity || CITY_OPTIONS[0]?.value || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateCityMutation = useMutation(api.mutations.core.updateUserCity);

  const handleSave = async () => {
    if (!selectedCity) {
      Alert.alert('Error', 'Please select a city');
      return;
    }

    try {
      setIsSubmitting(true);
      await updateCityMutation({ city: selectedCity });
      navigation.goBack();
    } catch (error) {
      console.error('Failed to update city:', error);
      Alert.alert('Error', 'Failed to update city. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StackScreenHeader title="Select City" />
      <View style={styles.content}>
        <Text style={styles.description}>
          Choose the city where you want to explore classes
        </Text>

        <View style={styles.citiesList}>
          {CITY_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.value}
              onPress={() => setSelectedCity(option.value)}
              style={[
                styles.cityOption,
                selectedCity === option.value && styles.cityOptionSelected,
              ]}
            >
              <Text
                style={[
                  styles.cityOptionText,
                  selectedCity === option.value && styles.cityOptionTextSelected,
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[
            styles.saveButton,
            (!selectedCity || isSubmitting) &&
              styles.saveButtonDisabled,
          ]}
          onPress={handleSave}
          disabled={
            !selectedCity || isSubmitting
          }
        >
          {isSubmitting ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.saveButtonText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.zinc[50],
  },
  content: {
    flex: 1,
    padding: 20,
  },
  description: {
    fontSize: 16,
    color: theme.colors.zinc[600],
    marginBottom: 24,
    textAlign: 'center',
  },
  citiesList: {
    gap: 12,
    marginBottom: 24,
  },
  cityOption: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: theme.colors.zinc[200],
  },
  cityOptionSelected: {
    borderColor: theme.colors.emerald[600],
    backgroundColor: theme.colors.emerald[50],
  },
  cityOptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.zinc[900],
    textAlign: 'center',
  },
  cityOptionTextSelected: {
    color: theme.colors.emerald[900],
  },
  saveButton: {
    backgroundColor: theme.colors.emerald[600],
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 'auto',
  },
  saveButtonDisabled: {
    backgroundColor: theme.colors.zinc[300],
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
});

