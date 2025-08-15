import { Text } from '@react-navigation/elements';
import { RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { StyleSheet, View } from 'react-native';

type RootStackParamList = {
  HomeTabs: undefined;
  Profile: { user: string };
  NotFound: undefined;
};

type Props = {
  route: RouteProp<RootStackParamList, 'Profile'>;
  navigation: NativeStackNavigationProp<RootStackParamList, 'Profile'>;
};

export function Profile({ route }: Props) {
  return (
    <View style={styles.container}>
      <Text>{route.params.user}'s Profile</Text>
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
