# KymaClub Mobile Consumer App

React Native mobile app built with Expo for consumers to discover and book fitness classes.

## 🚀 Quick Start

### Prerequisites

- Node.js >= 18
- pnpm (package manager)
- Expo CLI (`npm install -g expo-cli`)
- EAS CLI (`npm install -g eas-cli`)
- iOS Simulator (for macOS) or Android Studio (for Android development)

### Installation

```bash
# Install dependencies (from repository root)
pnpm install

# Start development server with Expo Go
cd apps/mobile-consumer
pnpm start
```

## 🔧 Configuration

### Environment Variables Setup

**CRITICAL**: The app requires Convex backend URLs to function. Without these, the app will hang on the splash screen in TestFlight.

**👉 See [SETUP.md](./SETUP.md) for complete step-by-step instructions.**

#### Quick Setup (Recommended - EAS Environment Variables)

```bash
cd apps/mobile-consumer

# Run eas env:create and follow instructions
eas env:create

# You'll be prompted to enter:
# - Variable name: EXPO_PUBLIC_CONVEX_URL
# - Variable value: https://your-project.convex.cloud
# Then repeat for EXPO_PUBLIC_CONVEX_SITE_URL

# Alternatively, set directly with command-line flags:
# eas env:create --name EXPO_PUBLIC_CONVEX_URL --value "https://your-project.convex.cloud"
# eas env:create --name EXPO_PUBLIC_CONVEX_SITE_URL --value "https://your-project.convex.site"

# Verify your environment variables
eas env:list

# Build for TestFlight
eas build --profile preview --platform ios
```

#### For Local Development

Create a `.env` file in `apps/mobile-consumer/`:

```bash
EXPO_PUBLIC_CONVEX_URL=https://your-project.convex.cloud
EXPO_PUBLIC_CONVEX_SITE_URL=https://your-project.convex.site
```

## 🏗️ Building & Deployment

### Development Build

Development builds include the Expo Dev Client for faster iteration:

```bash
# Start development server
pnpm start

# Build and run on device
pnpm ios
# or
pnpm android
```

### Preview Build (TestFlight Internal Testing)

```bash
# Build for iOS TestFlight
eas build --profile preview --platform ios

# After build completes, submit to TestFlight
eas submit --platform ios
```

### Production Build

```bash
# Build for production
eas build --profile production --platform ios
eas build --profile production --platform android

# Submit to App Store / Play Store
eas submit --platform ios
eas submit --platform android
```

## 🐛 Troubleshooting

### App Stuck on Splash Screen

**Symptom**: App loads fine in development but hangs on splash screen in TestFlight.

**Cause**: Missing environment variables (`EXPO_PUBLIC_CONVEX_URL` not configured in EAS build).

**Solution**:
1. Check `eas.json` has environment variables configured for your build profile
2. Verify the Convex URL is correct and accessible
3. Rebuild with `eas build --profile preview --platform ios`
4. Check logs in EAS dashboard for any build errors

**Debug in production**:
- The app now has a 15-second timeout that will show a connection error screen
- You can tap "Retry" to attempt reconnection
- Check console logs for error messages about missing Convex URL

### Connection Failed Error

If you see "⚠️ Connection Failed" after the timeout:
1. Check your internet connection
2. Verify Convex backend is running and accessible
3. Check environment variables are correctly set in EAS
4. Try rebuilding the app with correct configuration

### Local Development Issues

If the app doesn't work in local development:
1. Ensure `.env` file exists with correct Convex URLs
2. Restart the Metro bundler: `pnpm start --clear`
3. Clear cache: `rm -rf node_modules/.cache`
4. Reinstall dependencies: `pnpm install`

## 📱 Testing

### Manual Testing

Use Maestro for automated UI testing:

```bash
# Install Maestro
curl -Ls "https://get.maestro.mobile.dev" | bash

# Run tests
maestro test maestro-tests/logged-in-flow.yaml
maestro test maestro-tests/logged-out-flow.yaml
```

## 🔑 Key Features

- **Authentication**: GitHub OAuth, Email OTP, Phone OTP
- **Class Discovery**: Browse classes by location, category, and business
- **Real-time Booking**: Instant booking confirmation with Convex subscriptions
- **Credit System**: Purchase credits and manage subscription
- **QR Scanner**: Quick check-in to classes
- **Push Notifications**: Booking confirmations, class reminders, credit expiration
- **Multi-language**: English, Greek, Lithuanian support

## 📚 Tech Stack

- **React Native 0.81.4** + **React 19**
- **Expo SDK 54**
- **React Navigation** (stack + bottom tabs)
- **Convex** for real-time backend
- **Zustand** for state management
- **FlashList** for performant lists
- **TypeScript 5.9**

## 🔗 Related Documentation

- [Main Repository README](../../README.md)
- [Backend API Documentation](../../packages/api/README.md)
- [Business Rules](../../packages/api/docs/BUSINESS_RULES.md)
- [Expo Documentation](https://docs.expo.dev/)
- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)

## 🆘 Support

For issues related to:
- **Build failures**: Check EAS dashboard logs
- **Backend connection**: Verify Convex configuration
- **App crashes**: Check error logs in Expo Go or EAS
- **Feature requests**: Create an issue in the repository

---

**Last Updated**: October 2025
