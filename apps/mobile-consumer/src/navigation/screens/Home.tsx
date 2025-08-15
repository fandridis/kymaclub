import { Button, Text } from '@react-navigation/elements';
import { StyleSheet, View } from 'react-native';
import { api } from "@repo/api/convex/_generated/api"
import { useQuery } from 'convex-helpers/react/cache';
import LanguageSwitcher from '../../components/language-switcher';
import { useNavigation } from '@react-navigation/native';
import { useTypedTranslation } from '../../i18n/typed';

export function Home() {
  const navigation = useNavigation();
  const { t } = useTypedTranslation();

  return (
    <View style={styles.container}>
      <Text>Home Screen</Text>
      <Text>Open up 'src/App.tsx' to start working on your app!</Text>
      <Text>{t('welcome.title')}</Text>
      <Text>{t('welcome.message', { name: 'John' })}</Text>

      <Button screen="Profile" params={{ user: 'jane' }}>
        Go to Pro!
      </Button>

      <Button onPress={() => navigation.navigate('Profile', { user: 'jane' })}>Go to Profile</Button>
      <LanguageSwitcher />
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
