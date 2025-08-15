// navigation/index.tsx
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { News } from './screens/News';
import { Explore } from './screens/Explore';
import { Scan } from './screens/Scan';
import { Bookings } from './screens/Bookings';
import { Profile } from './screens/Profile';
import { Settings } from './screens/Settings';
import { NotFound } from './screens/NotFound';
import { QRScannerScreen } from './screens/QRScannerScreen';
import { ClassDetailsModal } from './screens/ClassDetailsModal';
import { VenueDetailsScreen } from './screens/VenueDetailsScreen';
// Auth screens
import { LandingScreen } from '../features/core/screens/landing-screen';
import { CreateAccountModalScreen } from '../features/core/screens/create-account-modal-screen';

import { SearchIcon, NewspaperIcon, ScanQrCodeIcon, SettingsIcon, TicketIcon } from 'lucide-react-native';
import { StyleSheet, View, Alert } from 'react-native';
import { useTypedTranslation } from '../i18n/typed';
import { useAuth } from '../stores/auth-store';
import { LocationObject } from 'expo-location';
import { SignInModalScreen } from '../features/core/screens/sign-in-modal-screen';
import React from 'react';
import { useNavigation } from '@react-navigation/native';

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
            height: 60,

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
          tabBarActiveTintColor: '#ff4747',
          tabBarInactiveTintColor: '#8E8E93',
          tabBarBackground: () => (
            <BlurView intensity={30} style={styles.blurContainer} />
          ),
          animation: 'shift',
        }}
      >
        <Tab.Screen
          name="News"
          component={News}
          options={{
            title: t('navigation.home'),
            tabBarLabel: 'Home',
            tabBarIcon: ({ color }) => (
              <NewspaperIcon color={color} size={20} />
            ),
          }}
        />
        <Tab.Screen
          name="Explore"
          component={Explore}
          options={{
            title: t('navigation.explore'),
            tabBarLabel: 'Explore',
            tabBarIcon: ({ color }) => (
              <SearchIcon color={color} size={20} />
            ),
          }}
        />
        <Tab.Screen
          name="Scan"
          component={Scan}
          options={{
            title: t('navigation.scan'),
            tabBarLabel: () => null,
            tabBarIcon: ({ color, size, focused }) => (
              <CenterScanIcon color={color} size={size} focused={focused} />
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
          component={Bookings}
          options={{
            title: t('navigation.bookings'),
            tabBarLabel: 'Bookings',
            tabBarIcon: ({ color }) => (
              <TicketIcon color={color} size={20} />
            ),
            tabBarBadge: 3,
          }}
        />
        <Tab.Screen
          name="Settings"
          component={Settings}
          options={{
            title: t('navigation.settings'),
            tabBarLabel: 'Account',
            tabBarIcon: ({ color }) => (
              <SettingsIcon color={color} size={20} />
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
          <RootStack.Screen name="HomeTabs" component={HomeTabs} />
          <RootStack.Screen
            name="Settings"
            component={Settings}
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
          <RootStack.Screen name="NotFound" component={NotFound} />
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
          component={ClassDetailsModal}
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
  HomeTabs: undefined;
  Settings: undefined;
  Profile: { user: string };
  VenueDetailsScreen: { venueId: string };
  NotFound: undefined;
  // Auth screens
  Landing: undefined;
  // Modal screens
  QRScannerModal: undefined;
  ClassDetailsModal: { classInstance: import('../hooks/use-class-instances').ClassInstance };
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
  HomeTabs: { screen?: keyof TabParamList };
  Settings: undefined;
  Profile: { user: string };
  VenueDetailsScreen: { venueId: string };
  NotFound: undefined;
  // Auth screens
  Landing: undefined;
  // Modal screens
  QRScannerModal: undefined;
  ClassDetailsModal: { classInstance: import('../hooks/use-class-instances').ClassInstance };
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
    width: 56,
    height: 56,
    borderRadius: 40,
    backgroundColor: '#ff4747',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -12,
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