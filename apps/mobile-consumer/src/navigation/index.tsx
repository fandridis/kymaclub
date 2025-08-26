import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { NavigatorScreenParams } from '@react-navigation/native';
import { NewsScreen } from './screens/NewsScreen';
import { ExploreScreen } from './screens/ExploreScreen';
import { ScanScreen } from './screens/ScanScreen';
import { BookingsScreen } from './screens/BookingsScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { NotFoundScreen } from './screens/NotFoundScreen';
import { QRScannerScreen } from './screens/QRScannerScreen';
import { ClassDetailsModalScreen } from './screens/ClassDetailsModalScreen';
import { VenueDetailsScreen } from './screens/VenueDetailsScreen';
import { SettingsNotificationsPreferenceScreen } from './screens/SettingsNotificationsPreferenceScreen';
import { SettingsProfileScreen } from './screens/SettingsProfileScreen';
import { SettingsNotificationsScreen } from './screens/SettingsNotificationsScreen';
import { SettingsSubscriptionScreen } from './screens/SettingsSubscriptionScreen';
import { SettingsAccountScreen } from './screens/SettingsAccountScreen';
import { SettingsCreditsScreen } from './screens/SettingsCreditsScreen';
import { SubscriptionScreen } from './screens/SubscriptionScreen';
import { SuperpowersScreen } from './screens/SuperpowersScreen';
import { BuyCreditsScreen } from './screens/BuyCreditsScreen';
import { LandingScreen } from '../features/core/screens/landing-screen';
import { CreateAccountModalScreen } from '../features/core/screens/create-account-modal-screen';
import { SearchIcon, NewspaperIcon, ScanQrCodeIcon, TicketIcon, UserCogIcon } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';
import { useTypedTranslation } from '../i18n/typed';
import { useAuth } from '../stores/auth-store';
import { LocationObject } from 'expo-location';
import { SignInModalScreen } from '../features/core/screens/sign-in-modal-screen';
import { PaymentSuccessScreen } from './screens/PaymentSuccessScreen';
import { PaymentCancelScreen } from './screens/PaymentCancelScreen';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../theme';

const Tab = createBottomTabNavigator();
const RootStack = createNativeStackNavigator();

// Your existing CenterScanIcon component stays the same...
const CenterScanIcon = ({ color, size, focused }: { color: string, size: number, focused: boolean }) => {
  return (
    <View style={[
      styles.centerIconContainer,
      focused && styles.centerIconContainerActive
    ]}>
      <ScanQrCodeIcon color="white" size={size + 2} strokeWidth={2} />
    </View>
  );
};

// Your existing HomeTabs component stays the same...
function HomeTabs() {
  const { t } = useTypedTranslation();
  const navigation = useNavigation();


  return (
    <>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarShowLabel: true,
          tabBarIconStyle: {
            marginTop: 6,
          },
          tabBarStyle: {
            position: 'absolute',
            marginHorizontal: 20,
            bottom: 24,
            left: 20,
            right: 20,
            borderRadius: 40,
            height: 62,
            backgroundColor: 'white',

            borderTopWidth: 0,
            elevation: 10,
            shadowColor: '#000',
            shadowOffset: {
              width: 0,
              height: 4,
            },
            shadowOpacity: 0.15,
            shadowRadius: 8,
          },
          tabBarBadgeStyle: {
            backgroundColor: 'tomato',
            color: 'white',
          },
          tabBarActiveTintColor: theme.colors.emerald[600],
          tabBarInactiveTintColor: theme.colors.zinc[500],
          // tabBarBackground: () => (
          //   <BlurView intensity={30} style={styles.blurContainer} />
          // ),
          animation: 'shift',
        }}
      >
        <Tab.Screen
          name="News"
          component={NewsScreen}
          options={{
            title: t('navigation.home'),
            tabBarLabel: 'Home',
            tabBarIcon: ({ color }) => (
              <NewspaperIcon color={color} size={26} />
            ),
          }}
        />
        <Tab.Screen
          name="Explore"
          component={ExploreScreen}
          options={{
            title: t('navigation.explore'),
            tabBarLabel: 'Explore',
            tabBarIcon: ({ color }) => (
              <SearchIcon color={color} size={26} />
            ),
          }}
        />
        <Tab.Screen
          name="Scan"
          component={ScanScreen}
          options={{
            title: t('navigation.scan'),
            tabBarLabel: () => null,
            tabBarIcon: ({ color, size, focused }) => (
              <CenterScanIcon color={color} size={size + 4} focused={focused} />
            ),
          }}
          listeners={{
            tabPress: (e) => {
              e.preventDefault();
              navigation.navigate('QRScannerModal' as never);
            },
          }}
        />
        <Tab.Screen
          name="Bookings"
          component={BookingsScreen}
          options={{
            title: t('navigation.bookings'),
            tabBarLabel: 'Bookings',
            tabBarIcon: ({ color }) => (
              <TicketIcon color={color} size={26} />
            ),
            tabBarBadge: 3,
          }}
        />
        <Tab.Screen
          name="Settings"
          component={SettingsScreen}
          options={{
            title: t('navigation.settings'),
            tabBarLabel: 'Profile',
            tabBarIcon: ({ color }) => (
              <UserCogIcon color={color} size={26} />
            ),
          }}
        />
      </Tab.Navigator>

    </>
  );
}

// Root navigator with modal presentation
export function RootNavigator() {
  const { user } = useAuth();
  const isAuthenticated = !!user;

  return (
    <RootStack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      {isAuthenticated ? (
        <>
          <RootStack.Screen name="Home" component={HomeTabs} />
          <RootStack.Screen
            name="Settings"
            component={SettingsScreen}
            options={{
              animation: 'slide_from_right',
            }}
          />
          <RootStack.Screen
            name="VenueDetailsScreen"
            component={VenueDetailsScreen}
            options={{
              animation: 'slide_from_right',
            }}
          />
          <RootStack.Screen
            name="SettingsProfile"
            component={SettingsProfileScreen}
            options={{
              title: 'Profile Settings',
              animation: 'slide_from_right',
              headerShown: false,
            }}
          />
          <RootStack.Screen
            name="SettingsNotifications"
            component={SettingsNotificationsScreen}
            options={{
              animation: 'slide_from_right',
              headerShown: false,
            }}
          />
          <RootStack.Screen
            name="SettingsSubscription"
            component={SettingsSubscriptionScreen}
            options={{
              title: 'Subscription Settings',
              animation: 'slide_from_right',
              headerShown: false,
            }}
          />
          <RootStack.Screen
            name="SettingsAccount"
            component={SettingsAccountScreen}
            options={{
              animation: 'slide_from_right',
              headerShown: false,
            }}
          />
          <RootStack.Screen
            name="SettingsCredits"
            component={SettingsCreditsScreen}
            options={{
              title: 'Credits & Subscription',
              animation: 'slide_from_right',
              headerShown: false,
            }}
          />
          <RootStack.Screen
            name="Subscription"
            component={SubscriptionScreen}
            options={{
              animation: 'slide_from_right',
              headerShown: false,
            }}
          />
          <RootStack.Screen
            name="Superpowers"
            component={SuperpowersScreen}
            options={{
              title: 'Superpowers',
              animation: 'slide_from_right',
              headerShown: false,
            }}
          />
          <RootStack.Screen
            name="BuyCredits"
            component={BuyCreditsScreen}
            options={{
              animation: 'slide_from_right',
              headerShown: false,
            }}
          />
          <RootStack.Screen
            name="SettingsNotificationsPreference"
            component={SettingsNotificationsPreferenceScreen}
            options={{
              title: 'Notification Settings',
              animation: 'slide_from_right',
              headerShown: false,
            }}
          />
          <RootStack.Screen name="NotFound" component={NotFoundScreen} />

          {/* Payment result screens */}
          <RootStack.Screen
            name="PaymentSuccess"
            component={PaymentSuccessScreen}
            options={{
              title: 'Payment Successful',
              animation: 'slide_from_right',
              headerShown: false,
            }}
          />
          <RootStack.Screen
            name="PaymentCancel"
            component={PaymentCancelScreen}
            options={{
              title: 'Payment Cancelled',
              animation: 'slide_from_right',
              headerShown: false,
            }}
          />
        </>
      ) : (
        <>
          <RootStack.Screen
            name="Landing"
            component={LandingScreen}
            options={{
              animation: 'fade',
            }}
          />
        </>
      )}

      <RootStack.Group
        screenOptions={{
          presentation: 'modal',
          animation: 'slide_from_bottom',
          gestureEnabled: true,
          gestureDirection: 'vertical',
        }}
      >
        <RootStack.Screen
          name="QRScannerModal"
          component={QRScannerScreen}
          options={{
            headerShown: false,
            animation: 'slide_from_bottom',
          }}

        />
        <RootStack.Screen
          name="ClassDetailsModal"
          component={ClassDetailsModalScreen}
          options={{
            title: 'Class Details',
            animation: 'slide_from_bottom',
          }}
        />
        <RootStack.Screen
          name="SignInModal"
          component={SignInModalScreen}
          options={{
            title: 'Sign In',
          }}
        />
        <RootStack.Screen
          name="CreateAccountModal"
          component={CreateAccountModalScreen}
          options={{
            title: 'Create Account',
          }}
        />
      </RootStack.Group>
    </RootStack.Navigator>
  );
}

// Type definitions
export type RootStackParamList = {
  // Main app screens
  Home: NavigatorScreenParams<TabParamList> | undefined;
  Settings: undefined;
  Profile: { user: string };
  VenueDetailsScreen: { venueId: string };
  SettingsProfile: undefined;
  SettingsNotifications: undefined;
  SettingsSubscription: undefined;
  SettingsAccount: undefined;
  SettingsCredits: undefined;
  Subscription: undefined;
  Superpowers: undefined;
  BuyCredits: undefined;
  SettingsNotificationsPreference: {
    notificationType: {
      key: string;
      title: string;
      description: string;
    };
  };
  NotFound: undefined;
  // Payment result screens
  PaymentSuccess: {
    session_id: string;
    type: 'subscription' | 'purchase';
  };
  PaymentCancel: {
    type: 'subscription' | 'purchase';
  };
  // Auth screens
  Landing: undefined;
  // Modal screens
  QRScannerModal: undefined;
  ClassDetailsModal: {
    classInstance?: import('@repo/api/convex/_generated/dataModel').Doc<"classInstances">;
    classInstanceId?: import('@repo/api/convex/_generated/dataModel').Id<"classInstances">;
  };
  SignInModal: undefined;
  CreateAccountModal: {
    waitlistData?: {
      userLocation: LocationObject | null;
      serviceAreaCheck: any;
    };
  };
};

export type TabParamList = {
  News: undefined;
  Explore: undefined;
  Scan: undefined;
  Bookings: undefined;
  Settings: undefined;
};

export type RootStackParamListWithNestedTabs = {
  Home: NavigatorScreenParams<TabParamList> | undefined;
  Settings: undefined;
  Profile: { user: string };
  VenueDetailsScreen: { venueId: string };
  ProfileSettings: undefined;
  SettingsNotifications: undefined;
  SettingsSubscription: undefined;
  SettingsAccount: undefined;
  SettingsCredits: undefined;
  Subscription: undefined;
  Superpowers: undefined;
  BuyCredits: undefined;
  SettingsNotificationsPreference: {
    notificationType: {
      key: string;
      title: string;
      description: string;
    };
  };
  NotFound: undefined;
  // Auth screens
  Landing: undefined;
  // Modal screens
  QRScannerModal: undefined;
  ClassDetailsModal: {
    classInstance?: import('../hooks/use-class-instances').ClassInstance;
    classInstanceId?: import('@repo/api/convex/_generated/dataModel').Id<"classInstances">;
  };
  SignInModal: undefined;
  CreateAccountModal: {
    waitlistData?: {
      userLocation: LocationObject | null;
      serviceAreaCheck: any;
    };
  };
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList { }
  }
}

const styles = StyleSheet.create({
  blurContainer: {
    flex: 1,
    borderRadius: 40,
    textAlign: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  centerIconContainer: {
    width: 62,
    height: 62,
    borderRadius: 40,
    backgroundColor: '#ff4747',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  centerIconContainerActive: {
    // backgroundColor: '#000000',
  },
});