import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NewsScreen } from './screens/NewsScreen';
import { ExploreScreen } from './screens/ExploreScreen';
import { BookingsScreen } from './screens/BookingsScreen';
import { MessagesScreen } from './screens/MessagesScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { NotFoundScreen } from './screens/NotFoundScreen';
import { ClassDetailsModalScreen } from './screens/ClassDetailsModalScreen';
import { BookingTicketModalScreen } from './screens/BookingTicketModalScreen';
import { QuestionnaireModalScreen } from './screens/QuestionnaireModalScreen';
import { VenueDetailsScreen } from './screens/VenueDetailsScreen';
import { VenueClassInstancesScreen } from './screens/VenueClassInstancesScreen';
import { ExploreFiltersModalScreen } from './screens/ExploreFiltersModalScreen';
import { SettingsNotificationsPreferenceScreen } from './screens/SettingsNotificationsPreferenceScreen';
import { SettingsNotificationsScreen } from './screens/SettingsNotificationsScreen';
import { SettingsSubscriptionScreen } from './screens/SettingsSubscriptionScreen';
import { SettingsAccountScreen } from './screens/SettingsAccountScreen';
import { LanguageSelectionScreen } from './screens/LanguageSelectionScreen';
import { CitySelectionScreen } from './screens/CitySelectionScreen';
import { SubscriptionScreen } from './screens/SubscriptionScreen';
import { SuperpowersScreen } from './screens/SuperpowersScreen';
import { BuyCreditsScreen } from './screens/BuyCreditsScreen';
import { LandingScreen } from '../features/core/screens/landing-screen';
import { CreateAccountModalScreen } from '../features/core/screens/create-account-modal-screen';
import { LocationObject } from 'expo-location';
import { SignInModalScreen } from '../features/core/screens/sign-in-modal-screen';
import { PaymentSuccessScreen } from './screens/PaymentSuccessScreen';
import { PaymentCancelScreen } from './screens/PaymentCancelScreen';
import { ConversationScreen } from './screens/ConversationScreen';
import { TournamentScreen } from './screens/TournamentScreen';
import OnboardingWizard from '../components/OnboardingWizard';
import { useCurrentUser } from '../hooks/useCurrentUser';

const RootStack = createNativeStackNavigator<RootStackParamList>();

/**
 * Root navigator with conditional screen rendering based on authentication state.
 * 
 * Uses React Navigation's dynamic API with conditional rendering.
 * 
 * Auth states:
 * 1. Unauthenticated: Shows Landing, SignInModal, CreateAccountModal
 * 2. Needs Onboarding: Shows Onboarding
 * 3. Fully Authenticated: Shows all app screens
 * 
 * The linking configuration in App.tsx handles deep links - React Navigation 7
 * will automatically retry unhandled deep links when screens become available
 * after authentication state changes.
 */
export function RootNavigator() {
  const { user, isLoading } = useCurrentUser();

  // Determine auth state
  const isAuthenticated = !!user;
  const needsOnboarding = isAuthenticated && !user.hasConsumerOnboarded;
  const isFullyAuthenticated = isAuthenticated && user.hasConsumerOnboarded;

  // Don't render navigator while loading to avoid flash
  if (isLoading) {
    return null;
  }

  return (
    <RootStack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      {/* Unauthenticated screens */}
      {!isAuthenticated && (
        <>
          <RootStack.Screen
            name="Landing"
            component={LandingScreen}
            options={{
              animation: 'fade',
            }}
          />
          <RootStack.Screen
            name="SignInModal"
            component={SignInModalScreen}
            options={{
              presentation: 'modal',
              animation: 'slide_from_bottom',
              gestureEnabled: true,
              gestureDirection: 'vertical',
            }}
          />
          <RootStack.Screen
            name="CreateAccountModal"
            component={CreateAccountModalScreen}
            options={{
              presentation: 'modal',
              animation: 'slide_from_bottom',
              gestureEnabled: true,
              gestureDirection: 'vertical',
            }}
          />
        </>
      )}

      {/* Onboarding screen */}
      {needsOnboarding && (
        <RootStack.Screen name="Onboarding" component={OnboardingWizard} />
      )}

      {/* Fully authenticated screens */}
      {isFullyAuthenticated && (
        <>
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
            name="CitySelection"
            component={CitySelectionScreen}
            options={{
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

          {/* Modal screens for authenticated users */}
          <RootStack.Screen
            name="BookingTicketModal"
            component={BookingTicketModalScreen}
            options={{
              headerShown: false,
              presentation: 'modal',
              animation: 'slide_from_bottom',
              gestureEnabled: true,
              gestureDirection: 'vertical',
            }}
          />
          <RootStack.Screen
            name="VenueClassInstancesModal"
            component={VenueClassInstancesScreen}
            options={{
              presentation: 'modal',
              animation: 'slide_from_bottom',
              headerShown: false,
              gestureEnabled: true,
              gestureDirection: 'vertical',
            }}
          />
          <RootStack.Screen
            name="ExploreFiltersModal"
            component={ExploreFiltersModalScreen}
            options={{
              headerShown: false,
              presentation: 'modal',
              animation: 'slide_from_bottom',
              gestureEnabled: true,
              gestureDirection: 'vertical',
            }}
          />
          <RootStack.Screen
            name="QuestionnaireModal"
            component={QuestionnaireModalScreen}
            options={{
              headerShown: false,
              presentation: 'modal',
              animation: 'slide_from_bottom',
              gestureEnabled: true,
              gestureDirection: 'vertical',
            }}
          />
          <RootStack.Screen
            name="Tournament"
            component={TournamentScreen}
            options={{
              headerShown: false,
              presentation: 'modal',
              animation: 'slide_from_bottom',
              gestureEnabled: true,
              gestureDirection: 'vertical',
            }}
          />
        </>
      )}
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
  VenueDetailsScreen: { venueId: string };
  VenueClassInstancesModal: { venueId: string; venueName: string; templateId?: string };
  ExploreFiltersModal: undefined;
  ClassDetailsModal: {
    classInstance?: import('@repo/api/convex/_generated/dataModel').Doc<"classInstances">;
    classInstanceId?: import('@repo/api/convex/_generated/dataModel').Id<"classInstances">;
  };
  SettingsNotifications: undefined;
  SettingsSubscription: undefined;
  SettingsAccount: undefined;
  LanguageSelection: undefined;
  CitySelection: undefined;
  SettingsCredits: undefined;
  Subscription: undefined;
  Superpowers: undefined;
  BuyCredits: undefined;
  SettingsNotificationsPreference: {
    notificationType: {
      keys: readonly string[];
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
  QuestionnaireModal: {
    questions: import('@repo/api/types/questionnaire').Question[];
    basePrice: number;
    className: string;
    classInstanceId: import('@repo/api/convex/_generated/dataModel').Id<"classInstances">;
  };
  Tournament: {
    widgetId: string;
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
  VenueDetailsScreen: { venueId: string };
  VenueClassInstancesModal: { venueId: string; venueName: string; templateId?: string };
  ExploreFiltersModal: undefined;
  ClassDetailsModal: {
    classInstance?: import('../hooks/use-class-instances').ClassInstance;
    classInstanceId?: import('@repo/api/convex/_generated/dataModel').Id<"classInstances">;
  };
  SettingsNotifications: undefined;
  SettingsSubscription: undefined;
  SettingsAccount: undefined;
  LanguageSelection: undefined;
  CitySelection: undefined;
  SettingsCredits: undefined;
  Subscription: undefined;
  Superpowers: undefined;
  BuyCredits: undefined;
  SettingsNotificationsPreference: {
    notificationType: {
      keys: readonly string[];
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
