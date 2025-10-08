// app.config.js
export default ({ config }) => ({
  ...config,
  name: "Kyma Club",
  slug: "kyma-club",
  version: "1.0.1",
  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "automatic",
  newArchEnabled: true,
  scheme: "kymaclub",
  owner: "fandridis",
  notification: {
    icon: "./assets/icon.png",
    color: "#ffffff",
  },
  ios: {
    ...config.ios,
    buildNumber: "2",
    icon: "./assets/icon.png",
    supportsTablet: true,
    bundleIdentifier: "com.kymaclub.app",
    infoPlist: {
      NSLocationWhenInUseUsageDescription:
        "This app uses your location to show your position on the map.",
      ITSAppUsesNonExemptEncryption: false,
    },
    config: {
      googleMapsApiKey: process.env.IOS_GOOGLE_MAPS_KEY,
    },
  },
  android: {
    ...config.android,
    versionCode: 2,
    icon: "./assets/icon.png",
    package: "com.kymaclub.app",
    adaptiveIcon: {
      foregroundImage: "./assets/icon.png",
      backgroundColor: "#ffffff",
    },
    permissions: [
      "android.permission.ACCESS_COARSE_LOCATION",
      "android.permission.ACCESS_FINE_LOCATION",
      "android.permission.RECORD_AUDIO",
      "android.permission.MODIFY_AUDIO_SETTINGS",
    ],
    config: {
      googleMaps: {
        apiKey: process.env.ANDROID_GOOGLE_MAPS_KEY,
      },
    },
  },
  web: {
    ...config.web,
    favicon: "./assets/favicon.png",
  },
  plugins: [
    "expo-asset",
    "expo-secure-store",
    "expo-localization",
    "expo-notifications",
    "react-native-edge-to-edge",
    [
      "expo-splash-screen",
      {
        backgroundColor: "#ffffff",
        image: "./assets/splash-icon.png",
      },
    ],
    [
      "expo-location",
      {
        locationAlwaysAndWhenInUsePermission:
          "Allow KymaClub to use your location.",
      },
    ],
    "expo-audio",
  ],
  androidStatusBar: {
    backgroundColor: "#ffffff",
  },
  extra: {
    ...config.extra,
    eas: {
      projectId: "e762b8b2-9a97-4f03-942e-d5e8585b6f08",
    },
    // 👇 Convex + site env vars injected here
    EXPO_PUBLIC_CONVEX_URL: process.env.EXPO_PUBLIC_CONVEX_URL,
    EXPO_PUBLIC_CONVEX_SITE_URL: process.env.EXPO_PUBLIC_CONVEX_SITE_URL,
  },
});
