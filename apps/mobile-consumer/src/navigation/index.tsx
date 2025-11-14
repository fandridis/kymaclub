import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NewsScreen } from './screens/NewsScreen';
import { ExploreScreen } from './screens/ExploreScreen';
import { BookingsScreen } from './screens/BookingsScreen';
import { MessagesScreen } from './screens/MessagesScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { NotFoundScreen } from './screens/NotFoundScreen';
import { ClassDetailsModalScreen } from './screens/ClassDetailsModalScreen';
import { BookingTicketModalScreen } from './screens/BookingTicketModalScreen';
import { VenueDetailsScreen } from './screens/VenueDetailsScreen';
import { VenueClassInstancesScreen } from './screens/VenueClassInstancesScreen';
import { ExploreFiltersModalScreen } from './screens/ExploreFiltersModalScreen';
import { SettingsNotificationsPreferenceScreen } from './screens/SettingsNotificationsPreferenceScreen';
import { SettingsProfileScreen } from './screens/SettingsProfileScreen';
import { SettingsNotificationsScreen } from './screens/SettingsNotificationsScreen';
import { SettingsSubscriptionScreen } from './screens/SettingsSubscriptionScreen';
import { SettingsAccountScreen } from './screens/SettingsAccountScreen';
import { SettingsCreditsScreen } from './screens/SettingsCreditsScreen';
import { LanguageSelectionScreen } from './screens/LanguageSelectionScreen';
import { SubscriptionScreen } from './screens/SubscriptionScreen';
import { SuperpowersScreen } from './screens/SuperpowersScreen';
import { BuyCreditsScreen } from './screens/BuyCreditsScreen';
import { LandingScreen } from '../features/core/screens/landing-screen';
import { CreateAccountModalScreen } from '../features/core/screens/create-account-modal-screen';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { LocationObject } from 'expo-location';
import { SignInModalScreen } from '../features/core/screens/sign-in-modal-screen';
import { PaymentSuccessScreen } from './screens/PaymentSuccessScreen';
import { PaymentCancelScreen } from './screens/PaymentCancelScreen';
import { ConversationScreen } from './screens/ConversationScreen';
import OnboardingWizard from '../components/OnboardingWizard';

const RootStack = createNativeStackNavigator<RootStackParamList>();

// Root navigator with modal presentation - all screens always available
export function RootNavigator() {
  const { user } = useCurrentUser();

  const getIntialRouteName = () => {
    if (!user) {
      return 'Landing';
    }

    if (!user.hasConsumerOnboarded) {
      return 'Onboarding';
    }

    return 'News';
  }

  return (
    <RootStack.Navigator
      initialRouteName={getIntialRouteName()}
      screenOptions={{
        headerShown: false,
      }}
    >
      {/* Auth screens */}
      <RootStack.Screen
        name="Landing"
        component={LandingScreen}
        options={{
          animation: 'fade',
        }}
      />
      <RootStack.Screen name="Onboarding" component={OnboardingWizard} />

      {/* Main app screens */}
      <RootStack.Screen
        name="News"
        component={NewsScreen}
        options={{
          animation: 'fade',
        }}
      />
      <RootStack.Screen
        name="Explore"
        component={ExploreScreen}
        options={{
          animation: 'slide_from_right',
          headerShown: false,
        }}
      />
      <RootStack.Screen
        name="Bookings"
        component={BookingsScreen}
        options={{
          animation: 'slide_from_right',
          headerShown: false,
        }}
      />
      <RootStack.Screen
        name="Messages"
        component={MessagesScreen}
        options={{
          animation: 'slide_from_right',
          headerShown: false,
        }}
      />
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
        name="ClassDetailsModal"
        component={ClassDetailsModalScreen}
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
        name="LanguageSelection"
        component={LanguageSelectionScreen}
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
      <RootStack.Screen
        name="Conversation"
        component={ConversationScreen}
        options={{
          animation: 'slide_from_right',
          headerShown: false,
        }}
      />

      {/* Modal screens */}
      <RootStack.Group
        screenOptions={{
          presentation: 'modal',
          animation: 'slide_from_bottom',
          gestureEnabled: true,
          gestureDirection: 'vertical',
        }}
      >
        <RootStack.Screen
          name="BookingTicketModal"
          component={BookingTicketModalScreen}
          options={{
            headerShown: false,
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
        <RootStack.Screen
          name="VenueClassInstancesModal"
          component={VenueClassInstancesScreen}
          options={{
            presentation: 'modal',
            animation: 'slide_from_bottom',
            headerShown: false,
          }}
        />
        <RootStack.Screen
          name="ExploreFiltersModal"
          component={ExploreFiltersModalScreen}
          options={{
            headerShown: false,
          }}
        />
      </RootStack.Group>
    </RootStack.Navigator>
  );
}

// Type definitions
export type RootStackParamList = {
  // Main app screens
  News: undefined;
  Explore: undefined;
  Bookings: undefined;
  Messages: undefined;
  Settings: undefined;
  Profile: { user: string };
  VenueDetailsScreen: { venueId: string };
  VenueClassInstancesModal: { venueId: string; venueName: string };
  ExploreFiltersModal: undefined;
  ClassDetailsModal: {
    classInstance?: import('@repo/api/convex/_generated/dataModel').Doc<"classInstances">;
    classInstanceId?: import('@repo/api/convex/_generated/dataModel').Id<"classInstances">;
  };
  SettingsProfile: undefined;
  SettingsNotifications: undefined;
  SettingsSubscription: undefined;
  SettingsAccount: undefined;
  LanguageSelection: undefined;
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
  Conversation: {
    threadId: string;
    venueName: string;
    venueImage?: string;
  };
  // Auth screens
  Landing: undefined;
  Onboarding: undefined;
  // Modal screens
  BookingTicketModal: {
    booking: import('@repo/api/convex/_generated/dataModel').Doc<"bookings">;
  };
  SignInModal: undefined;
  CreateAccountModal: {
    waitlistData?: {
      userLocation: LocationObject | null;
      serviceAreaCheck: any;
    };
  };
};

export type RootStackParamListWithNestedTabs = {
  News: undefined;
  Explore: undefined;
  Bookings: undefined;
  Messages: undefined;
  Settings: undefined;
  Profile: { user: string };
  VenueDetailsScreen: { venueId: string };
  VenueClassInstancesModal: { venueId: string; venueName: string };
  ExploreFiltersModal: undefined;
  ClassDetailsModal: {
    classInstance?: import('../hooks/use-class-instances').ClassInstance;
    classInstanceId?: import('@repo/api/convex/_generated/dataModel').Id<"classInstances">;
  };
  ProfileSettings: undefined;
  SettingsNotifications: undefined;
  SettingsSubscription: undefined;
  SettingsAccount: undefined;
  LanguageSelection: undefined;
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
  Conversation: {
    threadId: string;
    venueName: string;
    venueImage?: string;
  };
  // Auth screens
  Landing: undefined;
  Onboarding: undefined;
  // Modal screens
  BookingTicketModal: {
    booking: import('@repo/api/convex/_generated/dataModel').Doc<"bookings">;
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

