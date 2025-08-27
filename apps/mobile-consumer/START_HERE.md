# 📱 Mobile Consumer App - START HERE

**Before working on this mobile app, AI agents must read this guide for essential context.**

## 🚀 Quick Start

This is the **React Native consumer app** where customers discover classes, make bookings, and manage their credits. Built with Expo and optimized for iOS/Android.

## 🛠 Tech Stack & Key Libraries

### **Core Framework**
- **React Native 0.79.5** + **React 19** - Latest stable versions
- **Expo SDK 53** with development client
- **TypeScript 5.7.2** - Strict typing throughout

### **Navigation & State**
- **@react-navigation/native** - Stack and tab navigation
- **@react-navigation/bottom-tabs** - Main app tab structure  
- **Zustand 5.0** - Lightweight state management
- **@react-native-async-storage/async-storage** - Persistent storage

### **Backend Integration**
- **Convex 1.23** - Real-time backend connection
- **@convex-dev/auth** - Authentication with GitHub OAuth + OTP
- **@repo/api** + **@repo/utils** - Shared backend types and utilities

### **UI & UX Libraries**
- **@gorhom/bottom-sheet** - Native bottom sheet modals
- **@shopify/flash-list** - High-performance lists
- **react-native-reanimated** - Smooth animations and gestures
- **expo-image** - Advanced image handling with caching
- **lucide-react-native** - Consistent icon system

### **Device Features**
- **expo-camera** + **expo-linking** - QR scanning for quick check-ins
- **expo-location** + **react-native-maps** - Location-based class discovery
- **expo-notifications** - Push notifications with deep-links
- **react-native-mmkv** - High-performance key-value storage

### **Internationalization**
- **i18next** + **react-i18next** - Multi-language support (EN, EL, LT)
- **expo-localization** - Device locale detection

## 📁 Folder Structure

```
src/
├── App.tsx                      # Root app component with providers
├── components/                  # Reusable UI components
│   ├── BookingCard.tsx         # Individual booking with cancellation
│   ├── ClassCard.tsx           # Class display with booking actions  
│   ├── ClassesList.tsx         # Filterable class listing
│   ├── FilterBar.tsx           # Class/business filtering
│   ├── DateFilterBar.tsx       # Date-based filtering
│   ├── OnboardingWizard.tsx    # User onboarding flow
│   └── qr-scanner/             # QR code scanning module
├── features/                    # Domain-specific features
│   ├── core/                   # Authentication & location gating
│   ├── explore/                # Business and class discovery  
│   └── map/                    # Map-based class discovery
├── navigation/                  # Navigation structure
│   ├── index.tsx               # Root navigation with auth guard
│   └── screens/                # All screen components
│       ├── HomeScreen.tsx      # Main home with bookings/classes
│       ├── ExploreScreen.tsx   # Business and class discovery
│       ├── BookingsScreen.tsx  # Complete booking management
│       ├── MapScreen.tsx       # Interactive map for discovery
│       ├── BuyCreditsScreen.tsx        # One-time credit purchases
│       ├── SubscriptionScreen.tsx      # Dynamic subscription management
│       ├── PaymentSuccessScreen.tsx    # Post-payment confirmation
│       └── SettingsScreen.tsx          # Settings and preferences
├── stores/                     # State management
│   └── auth-store.ts          # Authentication state with Zustand
├── hooks/                      # Custom React hooks
├── i18n/                      # Internationalization setup
├── locales/                   # Translation files (en/el/lt)
└── utils/                     # Utility functions
```

## 🔑 Key Features & Screens

### **Authentication Flow** 
- **Location gating** - Geographic access control
- **Multiple sign-in methods** - GitHub OAuth, email OTP, phone OTP
- **Registration flow** - Complete user onboarding
- **Waitlist signup** - For users in non-served areas

### **Class Discovery**
- **Home screen** - Personal bookings + recommended classes  
- **Explore screen** - Browse all businesses and classes
- **Map screen** - Location-based discovery with interactive map
- **Filter system** - Date, category, location, and business filters

### **Booking Management**
- **Real-time booking** - Instant confirmation with Convex subscriptions
- **Cancellation system** - Smart refund calculation based on policies
- **Booking history** - Complete transaction history with details
- **Waitlist management** - Join waitlists for full classes

### **Credit & Payment System**
- **Credit balance** - Real-time balance display with expiration warnings
- **One-time purchases** - Credit packs (5, 10, 20, 30, 50 credits) with Stripe
- **Subscription management** - Dynamic monthly subscriptions (5-150 credits)
- **Payment handling** - Stripe integration with success/cancel screens

### **Advanced Features**
- **QR Scanner** - Quick class check-ins with camera integration
- **Push notifications** - Booking confirmations, class reminders, credits expiring
- **Deep-linking** - Custom `kymaclub://` scheme for navigation
- **Offline support** - Local storage with sync when connected

## 🌍 Business Rules & Policies

### **Timezone Consistency**
- **Greece-Only Display**: All times shown in `Europe/Athens` timezone regardless of user location
- **Global Consistency**: Users in London/NYC see Greek business hours for consistency
- **Implementation**: Uses `date-fns v4` with `format(date, pattern, { in: tz('Europe/Athens') })`

### **Credit System**  
- **Expiration**: VIP users (5 months), regular users (3 months)
- **Real-time balance**: Updates immediately after bookings/purchases
- **Safety**: Credits allocated only after successful payment confirmation

### **Booking Rules**
- **Cancellation windows**: Based on class `cancellationWindowHours` setting
- **Refund calculation**: Automatic refund based on timing and policies
- **Waitlist promotion**: Automatic when cancellations occur

## 🧪 Development Commands

```bash
# Start development
npm start                    # Expo development server
npm run ios                  # Run on iOS simulator
npm run android             # Run on Android emulator

# Building
npm run prebuild            # Generate native code
```

## 🔗 Integration Points

### **Backend Connection**
- **Real-time subscriptions** via Convex for live booking updates
- **Authentication** via @convex-dev/auth with GitHub/email/phone
- **Shared types** from @repo/api for type safety

### **Payment Integration**
- **Stripe checkout** for credit purchases and subscriptions  
- **Webhook-driven** credit allocation for safety
- **Deep-link returns** for payment success/cancel flows

### **Push Notifications**
- **Expo notifications** with custom `kymaclub://` deep-links
- **Booking confirmations**, class reminders, credit expiration warnings
- **Smart scheduling** based on user timezone and preferences

## 🚨 Critical Patterns for AI Agents

### **1. Always Check Business Rules First**
Read `packages/api/START_HERE.md` for credit policies, booking rules, and pricing logic before implementing features.

### **2. Timezone Consistency**
Use Greece timezone (`Europe/Athens`) for all time displays. Never use device local time.

### **3. Real-time Data**
All booking-related data uses Convex subscriptions for live updates. Check existing patterns in `hooks/` folder.

### **4. Payment Safety**
Credits are allocated only after payment confirmation. Never pre-allocate credits.

### **5. Navigation Patterns**
Use React Navigation with deep-linking support. Check existing screen patterns in `navigation/screens/`.

### **6. State Management**
Use Zustand for app state, AsyncStorage for persistence. Check `stores/auth-store.ts` for patterns.

## 📋 Common Tasks & Patterns

### **Adding a New Screen**
1. Create component in `navigation/screens/`
2. Add to navigation routes in `navigation/index.tsx` 
3. Add deep-linking route if needed
4. Follow existing auth guard patterns

### **Integrating Backend Data**
1. Check existing hooks in `hooks/` folder
2. Use Convex subscriptions for real-time data
3. Handle loading/error states consistently
4. Follow existing pagination patterns for lists

### **Handling Payments**
1. Use existing Stripe integration patterns
2. Redirect to success/cancel screens with deep-links
3. Never allocate credits before payment confirmation
4. Check existing credit purchase flows

### **Working with Maps**
1. Use `react-native-maps` with existing styles
2. Check location permissions via `expo-location`
3. Follow existing marker and region patterns
4. Handle offline scenarios gracefully

---

## 🔗 Related Documentation

- **`packages/api/START_HERE.md`** - Complete business context and backend architecture
- **`packages/api/operations/`** - Backend business logic with comprehensive JSDoc examples  
- **Root `CLAUDE.md`** - Overall project architecture and AI agent workflow

**Remember**: This is a customer-facing app where user experience and reliability are critical. Always test payment flows, booking flows, and authentication thoroughly.