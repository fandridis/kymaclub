import { StyleSheet, View } from 'react-native';
import { SettingsScreen } from '../../components/example-component';
import OnboardingWizard from '../../components/OnboardingWizard';

export function Updates() {
  return (
    <View style={styles.container}>
      <OnboardingWizard />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
});
