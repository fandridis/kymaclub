# AI Agents

Read these sections before starting any task:

- Mobile Consumer App — see section below
- Web Business Dashboard — see section below
- Backend API — see section below

Quick checklist for agents:
- Understand business rules
- Use real-time patterns: Convex subscriptions for live data; avoid stale reads.
- Payment safety: never allocate credits before webhook-confirmed payments.
- Timezone: display times in business/Greece timezone as documented.
- Follow repo commands: install/build/lint/test using pnpm and Turbo.

# 📱 Mobile Consumer App

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
- **One-time purchases** - Credit packs (10, 25, 50, 100, 150, 200, 300, 500 credits) with Stripe
- **Subscription management** - Dynamic monthly subscriptions (5-500 credits) with 5-tier discounts
- **Payment handling** - Stripe integration with success/cancel screens
- **Credit value** - 1 credit = 50 cents spending value, purchase prices include business markup

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
Read Backend for credit policies, booking rules, and pricing logic before implementing features.

### **2. Timezone Consistency**
Use Greece timezone (`Europe/Athens`) for all time displays. Never use device local time.

### **3. Real-time Data**
All booking-related data uses Convex subscriptions for live updates. Check existing patterns in `hooks/` folder.

### **4. Payment Safety**
Credits are allocated only after payment confirmation. Never pre-allocate credits.

### **5. Navigation Patterns**
Use React Navigation with deep-linking support. Check existing screen patterns in `navigation/screens/`.

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

**Remember**: This is a customer-facing app where user experience and reliability are critical. Always test payment flows, booking flows, and authentication thoroughly.

# 💼 Web Business Dashboard

**Before working on this business management app, AI agents must read this guide for essential context.**

## 🚀 Quick Start

This is the **React web dashboard** where business owners and staff manage venues, create class templates, schedule instances, and handle customer bookings. Built for desktop-first with mobile responsiveness.

## 🛠 Tech Stack & Key Libraries

### **Core Framework**
- **React 19** + **TypeScript 5.8** - Latest stable versions with strict typing
- **Vite 7.0** - Lightning-fast development and building
- **Cloudflare Workers** - Edge deployment with `wrangler`

### **Routing & State**
- **@tanstack/react-router** - Type-safe file-based routing with devtools
- **Zustand 5.0** - Lightweight state management (primarily auth)
- **nuqs 2.4** - URL state management for settings tabs and filters

### **Backend Integration**
- **Convex 1.23** - Real-time backend with live subscriptions
- **@convex-dev/auth** - Authentication with GitHub OAuth + email OTP
- **@repo/api** + **@repo/utils** - Shared backend types and utilities

### **UI Framework & Components**
- **Tailwind CSS 4.x** - Utility-first styling with latest features
- **shadcn/ui** - High-quality component library built on Radix UI
- **Radix UI Primitives** - Accessible, unstyled components (14+ components)
- **next-themes** - Light/dark theme support
- **class-variance-authority** - Component variant management

### **Forms & Validation**
- **React Hook Form 7.60** - High-performance forms with minimal re-renders
- **@hookform/resolvers** + **Zod 4.0** - Schema validation and TypeScript integration
- **input-otp** - Accessible OTP input component

### **Calendar & Scheduling**
- **FullCalendar 6.1** - Advanced calendar with drag-drop, resize, and real-time updates
- **@date-fns/tz** + **date-fns 4.1** - Timezone-aware date handling
- **react-day-picker** - Date selection components

### **UI Enhancement Libraries**
- **lucide-react** - Consistent, beautiful icon system (500+ icons)
- **sonner** - Elegant toast notifications
- **vaul** - Native-feeling drawers for mobile
- **cmdk** - Command palette and search components

### **Development & Deployment**
- **@playwright/test** - End-to-end testing for critical workflows
- **ESLint 9** + **TypeScript ESLint 8** - Code quality and consistency
- **Wrangler 4.24** - Cloudflare Workers deployment tooling

## 📁 Folder Structure

```
src/
├── main.tsx                    # App entry point with providers
├── routeTree.gen.ts           # Auto-generated TanStack Router routes
├── components/                 # Reusable UI components
│   ├── auth/                  # Authentication components
│   │   ├── sign-in-with-github.tsx    # GitHub OAuth integration
│   │   ├── sign-in-otp-form.tsx       # Email/phone OTP verification
│   │   └── code-input.tsx             # Accessible OTP input
│   ├── layout/                # Application shell components
│   │   ├── app-layout.tsx     # Main layout with sidebar/header
│   │   ├── app-sidebar.tsx    # Responsive navigation sidebar
│   │   └── header.tsx         # Application header with user controls
│   ├── stores/                # Client state management
│   │   └── auth.ts            # Zustand auth store
│   └── ui/                    # shadcn/ui component library
├── features/                  # Domain-specific feature modules
│   ├── dashboard/             # Business analytics and onboarding
│   ├── calendar/              # FullCalendar class scheduling
│   ├── bookings/              # Customer booking management
│   ├── earnings/              # Revenue dashboard and hooks
│   ├── venues/                # Venue/location management
│   ├── templates/             # Class template management
│   └── settings/              # Application configuration
├── routes/                    # File-based routing structure
│   ├── __root.tsx            # Root layout with error boundaries
│   ├── _app-layout.tsx       # Protected app shell
│   └── _app-layout/          # Protected app routes
│       ├── dashboard.tsx      # Business dashboard
│       ├── calendar.tsx       # Class scheduling calendar
│       ├── bookings.tsx       # Booking management
│       ├── earnings.tsx       # Revenue dashboard with CSV export
│       ├── settings.tsx       # Settings with tabbed interface
│       └── templates.tsx      # Class template management
├── hooks/                     # Custom React hooks
├── lib/                       # Utility libraries
│   ├── timezone-utils.ts     # Business timezone conversions
│   └── i18n.ts              # Internationalization (EN, EL, LT)
└── styles/                    # Global styles and Tailwind config
```

## 🎯 Key Features & Pages

### **Authentication & Onboarding**
- **GitHub OAuth** + **Email OTP** - Multiple sign-in options
- **Business onboarding** - Step-by-step setup wizard
- **Role management** - Owner/admin/staff permissions
- **Account authorization** - Invitation-only sign-up for business accounts

### **Dashboard & Analytics**
- **Business overview** - Key metrics and upcoming classes
- **Onboarding progress** - Guided setup for new businesses
- **Quick actions** - Jump to common tasks (create venue, schedule class)

### **Calendar Management** 🗓️
- **FullCalendar integration** - Drag-drop scheduling with real-time updates
- **Multi-view support** - Month, week, day views with mobile responsiveness
- **Event interactions** - Click, drag, resize, and double-click handling
- **Bulk operations** - Edit/delete multiple similar instances
- **Color coding** - Visual organization with customizable colors
- **Pattern matching** - Find similar events by time pattern and day

### **Venue Management** 🏢
- **CRUD operations** - Create, read, update, delete venues
- **Image management** - Multiple photos with compression and storage
- **Address validation** - Complete address with optional geocoding
- **Category system** - Predefined venue types (yoga studio, fitness center, etc.)
- **Capacity management** - Set venue-specific capacity limits

### **Class Template System** 📋
- **Template creation** - Define reusable class structures
- **Instance generation** - Create single or recurring class instances
- **Field inheritance** - Instance values override template defaults
- **Image support** - Template images with storage management
- **Validation** - Comprehensive business rule validation

### **Earnings & Revenue Dashboard** 💰
- **Real-time earnings** - Monthly breakdown with gross and net revenue
- **20% system cut** - Automatic calculation of platform fee and business earnings
- **CSV export** - Download earnings data for invoicing and accounting
- **Booking details** - Complete list of completed bookings with revenue impact
- **Custom hook pattern** - `useEarnings` with convex-helpers caching

### **Settings Management** ⚙️
- **Tabbed interface** - Organized settings with URL state management
- **Business details** - Core business information and branding
- **Venue management** - Integrated venue CRUD operations
- **Notifications** - Configure notification preferences
- **Account settings** - Billing, invoicing, and user management

## 🏗️ Architecture Patterns

### **Real-time Updates**
All calendar events, bookings, and business data use **Convex subscriptions** for live updates:
```typescript
const instances = useQuery(api.classes.instances.getInstances, { businessId });
// Automatically updates when backend data changes
```

### **Form Management**
**React Hook Form + Zod** pattern for all forms (avoid explicit generic types):
```typescript
const form = useForm({
  resolver: zodResolver(createVenueSchema), // Let TypeScript infer types
  defaultValues: { name: "", email: "" }
});
```

### **Component Architecture**
- **Feature-based organization** - Components grouped by business domain
- **shadcn/ui patterns** - Consistent styling and behavior
- **Composition over inheritance** - Flexible, reusable components

### **State Management**
- **Server state**: Convex subscriptions for real-time backend data
- **Client state**: Zustand for authentication and app-level state
- **URL state**: nuqs for settings tabs, filters, and shareable state

## 🌍 Business Rules & Timezone Handling

### **Business Timezone Policy**
- **Source of truth**: Business timezone for all scheduling and display
- **UTC storage**: Database stores UTC timestamps, converts for display
- **Utilities**: `timezone-utils.ts` handles conversions
- **No user timezone**: All users see business local time regardless of location

### **Calendar Behavior**
- **FullCalendar config**: Displays in business timezone without timezone property
- **Event transformations**: `transformClassInstancesToCalendarEvents()` handles data conversion
- **Real-time sync**: Calendar updates immediately when backend data changes

## 🔗 Integration Points

### **Backend Connection**
- **Convex subscriptions** for live data (calendar, bookings, venues)
- **Authentication** via @convex-dev/auth with GitHub/email flows
- **Shared types** from @repo/api for end-to-end type safety
- **Business rules** implemented in backend operations layer

### **Deployment**
- **Cloudflare Workers** for edge deployment with global performance
- **Static assets** with proper SPA routing configuration
- **Environment management** via Wrangler and Cloudflare dashboard

### **Image Management**
- **Client compression** via `browser-image-compression` before upload
- **Convex file storage** with automatic cleanup on deletion
- **Multiple images** per venue/template with responsive display

## 🚨 Critical Patterns for AI Agents

### **1. Use Established Form Patterns**
- **React Hook Form + Zod** - Never use explicit generic types
- **Field validation** with proper error attribution
- **Loading states** and optimistic updates

### **2. Follow Calendar Integration Patterns**
- **Check existing calendar components** for drag-drop, resize, and event handling
- **Use business timezone** for all time calculations
- **Include color field** in database queries (common oversight)

### **3. Maintain Real-time Consistency**
- **Use Convex subscriptions** for all business data
- **Handle loading states** properly
- **Implement optimistic updates** where appropriate

### **4. Component Development**
- **Check existing patterns** in feature directories before creating new components
- **Use shadcn/ui conventions** for styling and behavior
- **Follow accessibility patterns** from Radix UI primitives

## 📋 Common Development Tasks

### **Adding a New Page**
1. Create route file in `routes/_app-layout/` 
2. Add navigation link in `app-sidebar-data.ts`
3. Create feature directory if needed
4. Follow existing layout and authentication patterns

### **Adding Calendar Features**
1. Check existing calendar components in `features/calendar/`
2. Use FullCalendar event handling patterns
3. Implement confirmation dialogs for bulk operations
4. Ensure real-time updates via Convex subscriptions

### **Creating Forms**
1. Use React Hook Form + Zod resolver pattern
2. Check existing form components for validation patterns
3. Add proper loading and error states
4. Use shadcn/ui form components for consistency

### **Managing Business Data**
1. Use appropriate backend operations from `@repo/api`
2. Implement proper error handling with toast notifications
3. Add optimistic updates for better UX
4. Follow multi-tenant patterns with `businessId`

## 🧪 Testing & Quality

### **E2E Testing**
- **Playwright** tests for critical user journeys
- **Focus on business workflows** - onboarding, calendar, booking management
- **Located in** `tests/` directory with helpers and utilities

### **Development Commands**
```bash
# Development
pnpm dev                    # Start dev server with HMR
pnpm build                  # Build for production

# Testing
pnpm test                   # Run Playwright E2E tests
pnpm test:ui               # Run tests with UI mode
pnpm test:report           # Show test report

# Deployment
pnpm deploy                # Build and deploy to Cloudflare Workers
pnpm cf-typegen            # Generate Cloudflare types
```

### **Code Quality**
- **ESLint 9** with React and TypeScript rules
- **Strict TypeScript** configuration
- **Consistent formatting** via Prettier (automatically applied)

## 🎨 Styling & Theme

### **Tailwind CSS 4.x**
- **Latest features** including CSS-in-JS support
- **Custom configuration** in tailwind config
- **Consistent spacing** and color schemes

### **shadcn/ui Integration**
- **High-quality components** built on Radix UI
- **Theme system** with light/dark mode support
- **Customizable** via CSS custom properties
- **Accessible** by default with keyboard navigation

## 📱 Mobile Responsiveness

- **Desktop-first** design with mobile breakpoints
- **Responsive calendar** - Different views for mobile (2-day) vs desktop (7-day)
- **Touch-friendly** interactions with proper touch targets
- **Drawer components** (vaul) for mobile-optimized modals

---

**Remember**: This is the primary business management interface. Focus on reliability, data consistency, and user experience. Always test calendar operations, form submissions, and real-time updates thoroughly.

# 🔧 Backend API

**Before working on the backend, AI agents must read this guide for complete business context and technical architecture.**

## 🚀 Quick Start

This is the **Convex backend API** providing real-time database and serverless functions for the booking platform. Contains all business logic, payment processing, and data management with comprehensive business rules documentation.

## 🛠 Tech Stack & Key Libraries

### **Core Backend**  
- **Convex 1.23** - Real-time database with serverless functions  
- **@convex-dev/auth 0.0.81** - Authentication with GitHub OAuth + email/phone OTP  
- **TypeScript 5.8** - Strict typing throughout backend operations  
- **Vitest** - Comprehensive unit and integration testing framework

### **Payment Integration**  
- **Stripe API 2025-02-24.acacia** - Payment processing for subscriptions and one-time purchases  
- **EUR/USD currency handling** - EUR for subscriptions, USD for one-time purchases  
- **Webhook processing** - Secure payment confirmation workflows  
- **Idempotency keys** - Transaction safety and duplicate prevention

### **Date & Time Management**  
- **date-fns 4.1** + **@date-fns/tz** - Timezone-aware date calculations  
- **Business timezone priority** - All scheduling based on business local time  
- **rrule support** - Recurring class scheduling with exception handling

### **Validation & Safety**  
- **Zod validation** - Schema validation throughout API layers  
- **Centralized error codes** - Consistent error handling with field attribution  
- **Double-entry ledger** - Financial transaction safety with audit trails

## 📁 Backend Folder Structure

```
packages/api/
├── convex/                    # Convex backend functions
│   ├── schema.ts             # Complete database schema
│   ├── auth.config.ts        # Authentication configuration
│   ├── http.ts               # HTTP endpoints and webhooks
│   ├── classes/              # Class management domain
│   │   ├── templates/        # Class template operations
│   │   └── instances/        # Class instance operations
│   ├── venues/               # Venue management
│   ├── bookings/             # Booking system
│   ├── credits/              # Credit system with double-entry ledger
│   ├── uploads/              # File upload and image management
│   └── core/                 # Core business operations
├── operations/               # Pure business logic (COMPREHENSIVE JSDOC)
│   ├── pricing.ts           # Dynamic pricing with discount hierarchy
│   ├── classInstance.ts     # Class scheduling operations
│   ├── payments.ts          # Stripe integration and credit pricing
│   ├── venue.ts             # Venue management operations
│   ├── business.ts          # Business entity operations
│   └── notifications.ts     # Notification routing and deep-links
├── services/                 # Service layer integrating operations
│   ├── bookingService.ts    # Complete booking management
│   ├── creditService.ts     # Credit system with expiration
│   ├── paymentsService.ts   # Stripe integration service
│   └── [other services]     # Domain-specific service layers
├── validations/              # Field validation with error attribution
│   ├── class.ts             # Class-related field validation
│   ├── venue.ts             # Venue field validation
│   └── core.ts              # Common validation utilities
├── types/                    # TypeScript type definitions
│   ├── booking.ts           # Booking system types
│   ├── credit.ts            # Credit system types
│   └── payments.ts          # Payment processing types
├── utils/                    # Utility functions and helpers
├── integrationTests/         # End-to-end workflow testing
└── [domain].test.ts         # Unit tests for operations
```

---

# Business Rules Reference

Complete reference of all business rules, constraints, and operational logic within the booking platform. Each rule includes direct code references, test coverage, and business rationale.

## Table of Contents

1. Pricing System
2. Class Scheduling
3. Credit System
4. Booking System
5. Data Integrity
6. Earnings & Revenue System
7. Template Management
8. Venue Management
9. Validation Rules

---

## Pricing System

### PR-001: Dynamic Discount Hierarchy
- **Rule**: Early bird discount (10%) takes precedence over low capacity discount (5%). Discounts are mutually exclusive.
- **Code**: `operations/pricing.ts:45-57` (calculateDiscount function)
- **Tests**: `operations/pricing.test.ts:133-149` (prioritize early bird over capacity discount)
- **Rationale**: Time-based discounts more valuable for customer acquisition and booking predictability
- **Logic**: 
  - Early bird: >48 hours advance = 10% discount
  - Low capacity: <50% utilization = 5% discount
  - Early bird wins if both conditions met

### PR-002: Base Price Selection Chain
- **Rule**: `instance.price → template.price → default(1000 cents)` priority chain
- **Code**: `operations/pricing.ts:15` 
- **Tests**: `operations/pricing.test.ts:19-80` (Base Price Selection tests)
- **Edge Case**: Zero credits (0) is falsy in JavaScript, falls back to template/default
- **Safety**: Minimum final price is 0 (never negative), tested in `pricing.test.ts:225-238`
- **Example**: Instance with 0 price + template with 500 cents = 500 cents base price
- **Conversion**: 1000 cents = 20 credits at 50 cents per credit ratio

### PR-003: Pricing Calculation Safety
- **Rule**: All pricing calculations must handle floating point arithmetic safely
- **Code**: `operations/pricing.ts:20-21` (discountAmount calculation)
- **Tests**: `operations/pricing.test.ts:275-290` (floating point arithmetic test)
- **Safety**: Tests use `toBeCloseTo()` for floating point comparisons
- **Business Impact**: Prevents pricing discrepancies that could cause financial losses

### PR-004: Past Class Pricing
- **Rule**: Past classes can still receive capacity discounts (no early bird discount)
- **Code**: `operations/pricing.ts:42-47` (hoursUntilClass calculation)
- **Tests**: `operations/pricing.test.ts:153-166` (past class times test)
- **Rationale**: Allows last-minute bookings for partially filled past classes
- **Business Context**: Helps fill classes that have already started but have availability

---

## Class Scheduling

### CS-001: Time Update Business Rule (ADR-001)
- **Rule**: Cannot update `endTime` without providing `startTime` in the same operation
- **Code**: `operations/classInstance.ts:34-44` (prepareUpdateInstance validation)
- **Tests**: `operations/classInstance.test.ts:60-68` (endTime without startTime test)
- **Rationale**: Prevents calendar display corruption and invalid time ranges
- **Error**: Throws ConvexError with ERROR_CODES.VALIDATION_ERROR
- **Alternative Considered**: Auto-calculate startTime from duration, rejected due to complexity

### CS-002: Conditional Time Validation (ADR-002)
- **Rule**: Time validation only occurs when both startTime AND endTime provided together
- **Code**: `operations/classInstance.ts:54-62` (conditional validation logic)
- **Tests**: `operations/classInstance.test.ts:71-96` (time validation tests)
- **Rationale**: Allows partial updates while ensuring complete updates are validated
- **Safety**: Prevents blocking partial updates that are otherwise valid

### CS-003: Instance Generation from Template (ADR-005)
- **Rule**: `endTime = startTime + (template.duration * 60 * 1000)` - calculated, never manually set
- **Code**: `operations/classInstance.ts:135` (endTime calculation)
- **Tests**: `operations/classInstance.test.ts:181-194` (endTime calculation test)
- **Rationale**: Eliminates user error in time entry and ensures consistency
- **Time Pattern**: Auto-generated as "HH:mm-HH:mm" format for calendar display

### CS-004: Day of Week Calculation
- **Rule**: `dayOfWeek` calculated using `getDay()` (0=Sunday, 1=Monday, etc.)
- **Code**: `operations/classInstance.ts:148` (dayOfWeek calculation)
- **Tests**: `operations/classInstance.test.ts:267-279` (dayOfWeek test)
- **Usage**: Used for bulk operations and pattern matching in calendar
- **Example**: Monday 2024-01-08 → dayOfWeek = 1

### CS-005: Multiple Instance Validation
- **Rule**: Bulk instance creation limited to 100 instances maximum
- **Code**: `validations/class.ts:129-131` (validateCount function)
- **Tests**: `validations/class.test.ts` (count validation tests)
- **Rationale**: Prevents system overload and accidental mass creation
- **Error Handling**: Returns structured validation error with clear message

---

## Credit System

### CR-001: Credit Expiration Rules
- **Rule**: VIP users get 5-month expiration, regular users get 3-month expiration
- **Code**: `convex/credits/expiration.ts` (expiration logic)
- **Tests**: `integrationTests/credit.integration.test.ts` (expiration tests)
- **Business Rule**: Encourages VIP membership while preventing indefinite credit accumulation
- **Safety**: Expiration warnings sent via notifications before credits expire

### CR-002: Double-Entry Ledger System
- **Rule**: All credit transactions use double-entry bookkeeping with balancing entries
- **Code**: `convex/credits/mutationHelpers.ts` (recordCreditPurchase, recordBookingLedgerEntries)
- **Tests**: `integrationTests/credit.integration.test.ts` (ledger entry tests)
- **Account Types**: customer, business, system, payment_processor
- **Integrity**: Every credit movement has equal and opposite ledger entries

### CR-003: Transaction Fee Structure
- **Rule**: 20% system cut on all transactions, configurable per business
- **Code**: `convex/credits/domain/utils.ts` (calculateTransactionFee)
- **Tests**: `integrationTests/credit.integration.test.ts` (fee calculation tests)
- **Business Model**: Platform revenue through transaction fees
- **Calculation**: `businessEarnings = credits * (1 - feePercentage)`

### CR-004: Credit Allocation Safety
- **Rule**: Credits only allocated AFTER successful payment confirmation
- **Code**: `services/paymentsService.ts` (webhook processing)
- **Tests**: `integrationTests/payment.integration.test.ts` (payment safety tests)
- **Safety**: No pre-allocation, prevents loss from failed payments
- **Webhook Dependency**: Uses Stripe `checkout.session.completed` event

### CR-005: Credit Conversion Ratio (ADR-009)
- **Rule**: 1 credit = 1 euro spending value (CREDITS_TO_CENTS_RATIO = 100)
- **Code**: `packages/utils/src/credits.ts:10` (CREDITS_TO_CENTS_RATIO constant)
- **Tests**: All payment tests use this ratio for consistency
- **Business Logic**: Businesses set prices in euros which directly map to credits (15 euro class = 15 credits)
- **Example**: Customer pays €1.10 to buy 1 credit worth 1 euro when booking
- **Rationale**: Simpler 1:1 euro-to-credit ratio for easier business and consumer understanding

### CR-006: Subscription Pricing Tiers (ADR-010)
- **Rule**: Tiered discount structure: 5% (20,30), 7% (50,70), 10% (100,200)
- **Code**: `operations/payments.ts` and `packages/utils/src/credits.ts` (calculateSubscriptionPricing)
- **Tests**: `operations/payments.test.ts` (subscription pricing tests)
- **Base Price**: €1.10 per credit before discounts
- **Business Logic**: All subscriptions get baseline 5% discount, scaling to 10% for larger plans
- **Allowed amounts**: 20, 30, 50, 70, 100, 200 credits per month
- **Minimum**: 20 credits (prevents administrative overhead)
- **Maximum**: 200 credits per month (supports regular users)

### CR-007: One-Time Credit Packs (ADR-011)
- **Rule**: 8 predefined packs: 10, 20, 40, 60, 80, 100, 150, 200 credits
- **Code**: `operations/payments.ts` (CREDIT_PACKS constant)
- **Tests**: `operations/payments.test.ts` (one-time pricing tests)
- **Base Price**: €1.10 per credit with discount tiers (0%, 3%, 5%, 7%)
- **Minimum**: 10 credits (prevents micro-transactions)
- **Maximum**: 200 credits (reasonable one-time purchase limit)

---

## Booking System

### BK-001: Booking Capacity Management
- **Rule**: `bookedCount` cannot exceed `capacity`, waitlist used for overflow
- **Code**: `services/bookingService.ts` (booking capacity checks)
- **Tests**: `integrationTests/booking.integration.test.ts` (capacity tests)
- **Business Logic**: Maintains class size limits while allowing waitlist revenue
- **Waitlist**: Automatic promotion when cancellations occur

### BK-002: Cancellation Window Rules
- **Rule**: Cancellations allowed based on `cancellationWindowHours` before class start
- **Code**: `services/bookingService.ts` (cancellation validation)
- **Tests**: `integrationTests/booking.integration.test.ts` (cancellation tests)
- **Refund Logic**: Full refund within window, no refund outside window
- **Business Rule**: Protects business revenue while maintaining customer flexibility

### BK-003: Real-time Status Updates
- **Rule**: Booking status changes propagate immediately to all connected clients
- **Code**: Convex real-time subscriptions throughout booking system
- **Tests**: Integration tests verify real-time propagation
- **Statuses**: pending, confirmed, cancelled, completed, no_show

### BL-001: Maximum Active Bookings Limit
- **Rule**: Consumers can only have 5 active bookings simultaneously to prevent overbooking and reduce book/cancel churn
- **Active Definition**: Bookings with status="pending" + future startTime + not deleted
- **Code**: `rules/booking.ts` (pure validation functions), `services/bookingService.ts:496-505` (data querying + enforcement)
- **Tests**: `rules/booking.test.ts` (unit tests with pure functions), `integrationTests/booking.limits.integration.test.ts` (e2e tests)
- **Business Logic**: Prevents consumers from hoarding bookings and creating poor experiences for other users
- **Error**: `MAX_ACTIVE_BOOKINGS_EXCEEDED` with clear messaging about limit and cancellation options
- **Architecture**: Pure functions in rules/ receive data from services/, no context dependencies
- **UX Impact**: Customers see immediate confirmation and status changes

---

## Data Integrity

### DI-001: Historical Snapshot Strategy (ADR-006)
- **Rule**: Template and venue snapshots captured at instance creation time
- **Code**: `operations/classInstance.ts:165-183` (snapshot creation)
- **Tests**: `operations/classInstance.test.ts:201-236` (snapshot tests)
- **Rationale**: Booking confirmations must show accurate info as it was when booked
- **Preservation**: Snapshots never change, even if templates/venues are updated

### DI-002: Template Change Propagation (ADR-003)
- **Rule**: Template changes update both instance fields AND templateSnapshot
- **Code**: `operations/classInstance.ts:74-93` (template change propagation)
- **Tests**: `operations/classInstance.test.ts:385-442` (template update tests)
- **Strategy**: Direct fields for current behavior, snapshot for historical audit
- **Selective Updates**: Only specified fields updated, others preserved

### DI-003: Venue Change Propagation (ADR-004)
- **Rule**: Venue changes ONLY update venueSnapshot, never direct instance fields
- **Code**: `operations/classInstance.ts:100-117` (venue change propagation)
- **Tests**: `operations/classInstance.test.ts:445-480` (venue update tests)
- **Rationale**: Historical integrity more important than live venue references
- **Address Merging**: Partial address updates merge with existing fields

### DI-004: Audit Trail Requirements
- **Rule**: All entities must have `createdAt`, `createdBy`, `updatedAt`, `updatedBy` fields
- **Code**: Throughout database schema and operations
- **Tests**: Audit field tests in integration test suites
- **Compliance**: Required for business auditing and debugging
- **Soft Deletes**: Use `deleted`, `deletedAt`, `deletedBy` instead of hard deletes

---

## Earnings & Revenue System

### ER-001: System Revenue Cut (ADR-012)
- **Rule**: Platform takes 20% of all completed booking revenue (80% to business)
- **Code**: `convex/queries/earnings.ts:35-52` (earnings calculation with system cut)
- **Tests**: Earnings integration tests verify 20% platform fee calculation
- **Business Logic**: Businesses receive net revenue (gross - 20%) for invoicing
- **Display**: Dashboard shows both gross earnings and net "Your Earnings"

### ER-002: Completed Bookings Revenue Only (ADR-013)
- **Rule**: Revenue calculations include only `completed` bookings, not pending/cancelled
- **Code**: `convex/queries/earnings.ts:18-23` (status filtering)
- **Tests**: Earnings tests verify only completed bookings counted
- **Rationale**: Accurate invoicing requires confirmed revenue, not potential revenue
- **Real-time Updates**: Earnings update immediately when bookings complete

### ER-003: Pricing Consistency - Cents Storage (ADR-014)
- **Rule**: All prices stored in cents for consistency (bookings, templates, instances)
- **Code**: Booking creation/update operations store `finalPrice`/`originalPrice` in cents
- **Tests**: All discount and pricing tests expect cent values (2000 cents = €20)
- **Conversion**: 1 credit = 50 cents spending value, prices display as euros (÷100)
- **Data Integrity**: Prevents floating-point precision errors in financial calculations

### ER-004: Monthly Earnings Dashboard
- **Rule**: Real-time earnings dashboard with monthly breakdown and CSV export
- **Code**: `apps/web-business/src/routes/_app-layout/earnings.tsx` (dashboard implementation)
- **Backend**: `convex/queries/earnings.ts` (monthly earnings query)
- **Features**: Gross/net revenue display, booking list, CSV export for invoicing
- **Hook Pattern**: `useEarnings` hook with convex-helpers caching

### ER-005: CSV Export for Invoicing
- **Rule**: Businesses can export earnings data as CSV for accounting/invoicing
- **Code**: `apps/web-business/src/routes/_app-layout/earnings.tsx:89-106` (CSV generation)
- **Format**: Date, Class Name, Consumer, Gross Price, System Cut, Your Earnings, Status
- **Currency**: Displays in euros (cents ÷ 100) with proper formatting
- **Business Use**: Direct integration with accounting systems and invoice generation

---

## Template Management

### TM-001: Template-Instance Relationship
- **Rule**: Templates are master records, instances are derived copies with override capability
- **Code**: `operations/classInstance.ts:123-189` (createInstanceFromTemplate)
- **Tests**: `operations/classInstance.test.ts:125-317` (template creation tests)
- **Data Flow**: Template → Instance Creation → Individual Overrides
- **Independence**: Instances can override any template field while maintaining lineage

### TM-002: Template Field Validation
- **Rule**: All template fields validate according to business constraints
- **Code**: `validations/class.ts:37-186` (template field validations)
- **Tests**: `validations/class.test.ts` (validation test suite)
- **Constraints**: Names ≤100 chars, capacity ≤100, duration ≤480 minutes, etc.
- **Error Handling**: Field-specific errors for better user experience

### TM-003: Template Image Management
- **Rule**: Templates support multiple images via `imageStorageIds` array
- **Code**: `convex/uploads/mutations.ts` (image management)
- **Tests**: `integrationTests/upload.integration.test.ts` (image tests)
- **Storage**: Convex file storage with automatic cleanup on removal
- **Limits**: No hard limit on image count, but UI typically shows 3-5 images

---

## Venue Management

### VM-001: Venue Category System
- **Rule**: All venues must have a `primaryCategory` from predefined list
- **Code**: `@repo/utils/constants.ts` (VENUE_CATEGORIES)
- **Tests**: Venue integration tests verify category validation
- **Categories**: yoga_studio, fitness_center, dance_studio, martial_arts, etc.
- **Display**: Use `getVenueCategoryDisplay()` for consistent naming

### VM-002: Venue Address Requirements
- **Rule**: Complete address required: street, city, zipCode, country, state
- **Code**: `validations/venue.ts` (address validation)
- **Tests**: `validations/venue.test.ts` (address validation tests)
- **Geocoding**: Address used for map display and location-based discovery
- **Validation**: Each field validated for presence and format

### VM-003: Multi-tenant Venue Access
- **Rule**: Venues belong to specific business, cross-business access forbidden
- **Code**: Throughout venue operations with `businessId` checks
- **Tests**: Integration tests verify business isolation
- **Security**: Prevents accidental cross-business data exposure
- **Performance**: Enables efficient business-specific queries

---

## Validation Rules

### VR-001: Time Validation Constraints
- **Rule**: Start times ≤1 year future, durations ≤8 hours, end time > start time
- **Code**: `validations/class.ts:3-35` (time validations)
- **Tests**: `validations/class.test.ts` (time validation tests)
- **Business Rules**: Prevents unrealistic scheduling and system abuse
- **Error Messages**: Specific, user-friendly error messages for each violation

### VR-002: Capacity and Credit Constraints
- **Rule**: Capacity ≤100 people, credits ≤100, waitlist capacity ≥0
- **Code**: `validations/class.ts:75-93` (capacity/credit validations)
- **Tests**: `validations/class.test.ts` (constraint tests)
- **Rationale**: Reasonable business limits prevent system abuse
- **Edge Cases**: Zero values handled appropriately (waitlist can be 0)

### VR-003: String Field Constraints
- **Rule**: Names ≤100 chars, descriptions ≤2000 chars, instructors ≤100 chars
- **Code**: `validations/class.ts:37-74` (string validations)
- **Tests**: `validations/class.test.ts` (string validation tests)
- **UX**: Limits prevent UI breaking and ensure reasonable data sizes
- **Trimming**: All string fields auto-trimmed to remove accidental whitespace

### VR-004: Array and Complex Field Rules
- **Rule**: Tags ≤10 items, selected days 0-6 range, booking windows ≤30 days
- **Code**: `validations/class.ts:67-152` (complex field validations)
- **Tests**: `validations/class.test.ts` (complex validation tests)
- **Business Logic**: Reasonable limits on complexity while maintaining flexibility
- **Deduplication**: Arrays automatically deduplicated (selectedDaysOfWeek)

---

## Error Handling Standards

### EH-001: Centralized Error Codes
- **Rule**: All errors must use `ERROR_CODES` constants, never hardcoded strings
- **Code**: `utils/errorCodes.ts` (centralized error definitions)
- **Usage**: Throughout operations and validation layers
- **Consistency**: Enables proper error handling and internationalization
- **Structure**: `ConvexError({ message, field, code })`

### EH-002: Field Attribution
- **Rule**: Validation errors must include `field` attribution for UX
- **Code**: Throughout validation functions using `throwIfError`
- **Tests**: Validation tests verify field attribution
- **Frontend**: Enables field-specific error display in forms
- **Example**: `{ message: "Name too long", field: "name", code: "VALIDATION_ERROR" }`

### EH-003: Graceful Degradation
- **Rule**: System should handle edge cases gracefully, never crash
- **Code**: Safety checks throughout operations (zero capacity, missing fields, etc.)
- **Tests**: Edge case tests in all operation test suites  
- **Philosophy**: Better to provide fallback behavior than fail completely
- **Examples**: Zero capacity → fallback to 10, missing price → use template/default

---

## Integration Points

### IP-001: Stripe Payment Integration
- **Rule**: All payment operations must be idempotent and webhook-driven
- **Code**: `services/paymentsService.ts`, `convex/http.ts`
- **Tests**: `integrationTests/payment.integration.test.ts`
- **Safety**: Credits allocated only after payment confirmation
- **Webhooks**: `checkout.session.completed`, subscription events

### IP-002: Real-time Synchronization
- **Rule**: All booking-related changes must propagate in real-time via Convex
- **Code**: Convex subscriptions throughout frontend components
- **Tests**: Integration tests verify real-time updates
- **UX**: Customers see immediate booking confirmations and updates
- **Performance**: Optimized subscriptions prevent unnecessary re-renders

### IP-003: Mobile Deep-Linking
- **Rule**: All mobile navigation must support deep-linking with `kymaclub://` scheme
- **Code**: `@repo/utils/deep-linking.ts`
- **Tests**: Mobile app navigation tests
- **Scheme**: `kymaclub://class/:id`, `kymaclub://booking/:id`, etc.
- **Fallback**: Web URLs for unsupported environments

---

## Performance Considerations

### PC-001: Database Query Optimization
- **Rule**: Use indexes defined in schema, avoid `.filter()` on large datasets
- **Code**: `convex/schema.ts` (index definitions)
- **Best Practice**: Structure queries to use indexes effectively
- **Monitoring**: Query performance monitored via Convex dashboard

### PC-002: Batch Operations
- **Rule**: Multiple related updates should be batched for efficiency
- **Code**: Template/venue change propagation functions
- **Example**: `prepareInstanceUpdatesFromTemplateChanges` batches multiple updates
- **Performance**: Reduces database round-trips and improves consistency

### PC-003: Real-time Subscription Optimization
- **Rule**: Subscriptions should be as specific as possible to prevent over-fetching
- **Code**: Throughout frontend hook implementations
- **Balance**: Real-time updates vs. network efficiency
- **Best Practice**: Subscribe to specific business/user data, not global changes

---

---

## Business Account Authorization System

### AUTH-001: Invitation-Only Business Account Creation
- **Rule**: New business account creation requires authorization in the `authorizedBusinessEmails` table
- **Code**: `convex/auth.ts:37-82` (afterUserCreatedOrUpdated callback), `queries/core.ts:49-81` (isEmailAuthorizedForBusiness)
- **Frontend**: `components/auth/sign-in-with-email-code.tsx` (submit-time authorization check)
- **Tests**: `integrationTests/auth.integration.test.ts` (authorization tests)
- **Rationale**: Business accounts are created manually by administrators with in-person onboarding
- **Logic**: 
  - Existing users (returning users) can always sign in
  - New users must have their email in the `authorizedBusinessEmails` table
  - Unauthorized account creation attempts are blocked and the user is soft-deleted
- **Admin Tool**: `mutations/core.ts:authorizeBusinessEmail` - Admin-only mutation to add authorized emails

### AUTH-002: Whitelist Implementation
- **Storage**: Uses dedicated `authorizedBusinessEmails` table (no businessId required)
- **Query**: `api.queries.core.isEmailAuthorizedForBusiness` checks user existence and whitelist
- **Safety**: Backend callback in `afterUserCreatedOrUpdated` provides server-side enforcement
- **UX**: Frontend shows alert if email not authorized and disables submit button

---

This business rules reference serves as the authoritative guide for understanding all operational logic within the booking platform. AI agents should reference this document first when working with business-critical operations, then drill down to specific code references for implementation details.

For questions about any business rule, always check:
1. This document for business context
2. Referenced code files for implementation
3. Test files for expected behavior and edge cases
4. ADR comments in code for architectural decisions

Last updated: 2024-08-27

# Repository Guidelines

## Project Structure & Modules
- Monorepo managed by `pnpm` + Turborepo.
- Apps live in `apps/*` (e.g., `apps/web-business`, `apps/web-landing`, `apps/mobile-consumer`).
- Shared packages in `packages/*` (e.g., `@repo/api`, `@repo/ui`, `@repo/utils`, `@repo/eslint-config`).
- Docs and misc in `docs/` and `QOL/`.
- Typical sources: `src/`; tests alongside sources or in `tests/`.

## Build, Test, and Dev
- Install: `pnpm i` (run at repo root).
- Dev all: `pnpm dev` (runs `turbo run dev`).
- Build all: `pnpm build` (Turborepo graph-aware build).
- Lint all: `pnpm lint` (shared ESLint configs).
- Type check: `pnpm check-types`.
- Format: `pnpm format` (Prettier on `ts/tsx/md`).
- Filtered runs (examples):
  - `pnpm -w --filter @repo/web-business dev`
  - `pnpm -w --filter @repo/api dev` (Convex dev server)
  - `pnpm -w --filter @repo/web-landing deploy` (Cloudflare via Wrangler)

## Coding Style & Naming
- Language: TypeScript across apps and packages.
- Lint: `@repo/eslint-config` (ESLint flat config), Prettier 3.
- Indentation: 2 spaces; max 100–120 cols; semicolons on.
- Names: `camelCase` functions/vars, `PascalCase` React components, `kebab-case` files/dirs, `SCREAMING_SNAKE_CASE` constants.
- React: no `React` import for JSX; prefer functional components and hooks.

## Testing Guidelines
- Unit: Vitest in `packages/@repo/api` (`pnpm -w --filter @repo/api test`, `test:coverage`).
- E2E/UI: Playwright in `apps/web-business` (`test`, `test:ui`, `test:report`).
- File names: `*.test.ts` or `*.spec.ts(x)` near code.
- Aim for meaningful coverage on core logic; add tests for bug fixes.

## Commits & Pull Requests
- Commits: concise, imperative summary (e.g., "Fix booking dialog state"). Reference issues (`#123`) when applicable.
- PRs: clear description, scope limited, link issues, include screenshots for UI changes, and note env/ops impacts. Ensure `lint`, type-checks, and tests pass.

## Security & Config
- Node >= 18 (see root `package.json`), package manager: `pnpm@9`.
- Env: use per-app `.env.local`/`.env` (never commit secrets). Turborepo caches consider `.env*`.
- Deploy: Cloudflare Workers via `wrangler` in web apps; Convex via `convex` in `@repo/api`.

## Architecture Notes
- `apps/*` are deployable frontends/clients. `packages/*` are shared libraries and backend API definitions.
- Prefer importing internal modules via workspace aliases (e.g., `@repo/utils`, `@repo/ui`).

## API Package Patterns (packages/api)
- Tech: Convex backend with TypeScript. Keep Convex layer thin; push logic to services/rules.
- Structure:
  - `convex/`: `schema.ts`, `queries/*`, `mutations/*`, `actions/*`, `http.ts`, `triggers/`, `utils.ts`, `_generated/*`.
  - `services/*`: Domain logic (accept `{ ctx, args, user }`), enforce auth/tenancy, throw `ConvexError` with `ERROR_CODES`.
  - `operations/*`: Orchestration across entities/services. Never passed ctx and/or do database operations.
  - `rules/*`: Pure business rules (booking limits, cancellation, etc.). Never passed ctx and/or do database operations.
  - `validations/*`: Input validation helpers; return typed `ValidationResult`.
  - `types/*`: Domain types consumed by apps.
  - `utils/*`, `emails/*`, `integrationTests/*`. Never passed ctx and/or do database operations.
- New feature flow:
  1) Model: add/adjust domain `types/*` and Convex `schema.ts` (collections, fields, indexes). Prefer compound indexes and use `withIndex` over `.filter`.
  2) Rules/validation: encode constraints in `rules/*` and `validations/*` (pure, testable).
  3) Services: implement business operations; keep side effects here (writes, external calls). Log via `utils/logger` and use `ERROR_CODES`.
  4) Convex glue: add `queries/* | mutations/* | actions/*` with `v.object(...)` args; get user via `getAuthenticatedUserOrThrow`; delegate to services/operations; use `mutationWithTriggers` when needed.
  5) Tests: unit-test rules/utils; add service/operation tests and `integrationTests/*` (see `convex/test.setup.ts`).
  6) Expose: export reusable `operations/*` and `types/*` in `package.json` `exports` if apps import them.
- Naming: `camelCase` functions, `kebab-case` files; export `Args` via `Infer<typeof args>` (see bookings example). Use `deleted` soft-delete flags consistently.
- Security & tenancy: always scope by `businessId`/`user._id`; never leak across tenants; validate ownership on read/update.

## Agent-Specific Instructions

Role: Senior fullstack product engineer for a multi-tenant SaaS booking platform. Own features end-to-end with strong product sense and domain rule design.

Core Competencies
- Frontend: React 19, TanStack Router, Zustand, RHF+Zod, Tailwind/shadcn, accessibility, responsive UI.
- Backend: Convex (queries/mutations/actions), real-time patterns, TypeScript-first APIs, Cloudflare Workers.
- Domain: Scheduling, pricing, credits, bookings, RBAC, waitlists, audit trails, timezone-aware recurrence.
- Architecture: DDD, vertical slices, event-driven workflows, CQRS.
- Quality & Ops: Vitest, Playwright, observability, CI/CD, caching.

How You Work
- Clarify goals and constraints; align with business impact.
- Design end-to-end flows (UI, API, schema, rules).
- Implement strongly typed, testable TypeScript; design Convex schemas/indexes.
- Build accessible components; encode rules as composable domain services.
- Handle edge cases (concurrency, retries, timezones, conflicts); document and ship.
- Iterate quickly with feedback.

Philosophy: Production-grade, maintainable, and business-aligned; separate UI/business/persistence; prioritize performance, security, and UX; favor type safety and meaningful tests.
