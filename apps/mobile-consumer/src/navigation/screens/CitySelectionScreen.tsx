import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useMutation } from 'convex/react';
import { CheckIcon } from 'lucide-react-native';
import { api } from '@repo/api/convex/_generated/api';
import { StackScreenHeader } from '../../components/StackScreenHeader';
import { SettingsGroup } from '../../components/Settings';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import { useTypedTranslation } from '../../i18n/typed';
import { theme } from '../../theme';
import { useCityOptions } from '../../hooks/use-city-options';

export function CitySelectionScreen() {
  const navigation = useNavigation();
  const { t } = useTypedTranslation();
  const { user } = useCurrentUser();
  const cityOptions = useCityOptions();
  const [selectedCity, setSelectedCity] = useState<string>(user?.activeCitySlug || cityOptions[0]?.value || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateCityMutation = useMutation(api.mutations.core.updateUserCity);

  const handleSave = async () => {
    if (!selectedCity) {
      Alert.alert(t('common.error'), t('settings.city.errorSelectCity'));
      return;
    }

    try {
      setIsSubmitting(true);
      await updateCityMutation({ city: selectedCity });
      navigation.goBack();
    } catch (error) {
      console.error('Failed to update city:', error);
      Alert.alert(t('common.error'), t('settings.city.errorUpdateFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StackScreenHeader title={t('settings.city.selectCity')} />
      <View style={styles.content}>
        <View style={styles.headerSection}>
          <Text style={styles.subtitle}>
            {t('settings.city.description')}
          </Text>
        </View>

        <SettingsGroup>
          {cityOptions.map((option) => {
            const isSelected = selectedCity === option.value;
            return (
              <TouchableOpacity
                key={option.value}
                onPress={() => setSelectedCity(option.value)}
                style={[
                  styles.cityOption,
                  isSelected && styles.selectedCityOption,
                ]}
              >
                <View style={styles.cityInfo}>
                  <Text
                    style={[
                      styles.cityName,
                      isSelected && styles.selectedCityName,
                    ]}
                  >
                    {option.label}
                  </Text>
                </View>
                {isSelected && (
                  <View style={styles.checkContainer}>
                    <CheckIcon
                      size={20}
                      color={theme.colors.emerald[600]}
                    />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </SettingsGroup>

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
            <Text style={styles.saveButtonText}>{t('common.save')}</Text>
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
  },
  headerSection: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.lg,
  },
  subtitle: {
    fontSize: theme.fontSize.base,
    color: theme.colors.zinc[600],
    lineHeight: theme.fontSize.base * 1.4,
  },
  cityOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.zinc[100],
  },
  selectedCityOption: {
    backgroundColor: theme.colors.emerald[50],
  },
  cityInfo: {
    flex: 1,
  },
  cityName: {
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.zinc[900],
  },
  selectedCityName: {
    color: theme.colors.emerald[700],
  },
  checkContainer: {
    marginLeft: theme.spacing.md,
  },
  saveButton: {
    backgroundColor: theme.colors.emerald[600],
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 'auto',
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
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

