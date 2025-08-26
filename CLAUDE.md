# CLAUDE.md

This file provides comprehensive guidance to Claude Code (claude.ai/code) when working with code in this repository, including complete codebase structure and development patterns.

## Project Overview

This is a Turborepo monorepo using pnpm workspaces for a comprehensive class/venue booking platform. The system enables businesses to manage venues, create class templates, schedule instances, and handle customer bookings with real-time updates and multi-tenant architecture.

## Complete Codebase Structure

### Root Directory

- **`package.json`**: Root package configuration for Turborepo monorepo. Tech stack: Turborepo, PNPM, TypeScript, React 19.
- **`CLAUDE.md`**: This comprehensive project documentation and development guidance.
- **`turbo.json`**: Turborepo pipeline configuration defining build, lint, dev, and type-check tasks.
- **`pnpm-workspace.yaml`**: PNPM workspace configuration for monorepo package management.
- **`README.md`**: Main project documentation and getting started guide.

### Applications (`apps/`)

Contains all standalone applications for different user types and use cases.

#### **`apps/web-business/`** - Business Dashboard
The primary web application for business owners and staff to manage their booking operations.

**Tech Stack**: React 19, Vite, TanStack Router, Tailwind CSS 4.x, shadcn/ui, Radix UI, TypeScript 5.8, Cloudflare Workers

**Key Files:**
- **`package.json`**: Dependencies including FullCalendar, React Hook Form, Zod, Zustand, date-fns.
- **`vite.config.ts`**: Vite configuration with Cloudflare Workers integration and React SWC.
- **`wrangler.jsonc`**: Cloudflare Workers deployment configuration.
- **`playwright.config.ts`**: Playwright E2E testing configuration with multi-browser support.

**Source Code (`src/`):**
- **`main.tsx`**: Application entry point with providers and router setup.
- **`routeTree.gen.ts`**: Auto-generated TanStack Router route tree from file-based routing.

**Components (`src/components/`):**
- **`auth/`**: Authentication components including OAuth, OTP forms, and sign-in methods.
  - **`sign-in-with-github.tsx`**: GitHub OAuth integration. Exports: `SignInWithGitHub`.
  - **`sign-in-otp-form.tsx`**: Email/phone OTP verification. Exports: `SignInOTPForm`.
  - **`code-input.tsx`**: Accessible OTP code input. Exports: `CodeInput`.

- **`layout/`**: Application layout and navigation components.
  - **`app-layout.tsx`**: Main application shell with sidebar and header. Exports: `AppLayout`.
  - **`app-sidebar.tsx`**: Responsive sidebar navigation. Exports: `AppSidebar`.
  - **`app-sidebar-data.ts`**: Navigation structure and menu configuration. Exports: `sidebarData`.
  - **`header.tsx`**: Application header with user controls. Exports: `Header`.

- **`stores/`**: Client-side state management.
  - **`auth.ts`**: Zustand store for authentication state. Exports: `useAuthStore`, `useAuth`, `useCurrentUser`.

- **`ui/`**: shadcn/ui component library with Radix UI primitives.
  - **`button.tsx`**: Versatile button component with variants. Exports: `Button`.
  - **`form.tsx`**: React Hook Form integration with validation. Exports: `Form`, `FormField`, `FormItem`.

**Features (`src/features/`)** - Domain-specific feature modules:

- **`dashboard/`**: Business intelligence dashboard with analytics and onboarding.
  - **`components/dashboard-page.tsx`**: Main dashboard interface with analytics. Exports: `DashboardPage`.
  - **`components/upcoming-classes.tsx`**: Upcoming classes preview widget. Exports: `UpcomingClasses`.

- **`bookings/`**: Booking management and customer interaction features.
  - **`components/class-bookings-dialog.tsx`**: Dialog for managing class bookings. Exports: `ClassBookingsDialog`.

- **`calendar/`**: FullCalendar integration for class scheduling management.
  - **`components/calendar-page.tsx`**: Main calendar with drag-drop. Exports: `CalendarPage`.
  - **`components/calendar-event-card.tsx`**: Calendar event display component. Exports: `CalendarEventCard`.
  - **`components/edit-class-instance-dialog.tsx`**: Dialog for editing class instances. Exports: `EditClassInstanceDialog`.
  - **`components/delete-event-dialog.tsx`**: Dialog for deleting calendar events. Exports: `DeleteEventDialog`.
  - **`components/create-instance-from-template-dialog.tsx`**: Dialog for creating instances from templates. Exports: `CreateInstanceFromTemplateDialog`.
  - **`components/confirm-update-multiple-instances-dialog.tsx`**: Confirmation dialog for bulk instance updates. Exports: `ConfirmUpdateInstancesDialog`.
  - **`components/confirm-delete-multiple-instances-dialog.tsx`**: Confirmation dialog for bulk instance deletions. Exports: `ConfirmDeleteInstancesDialog`.
  - **`components/confirm-time-update-dialog.tsx`**: Time update confirmation dialog. Exports: `ConfirmTimeUpdateDialog`.
  - **`hooks/useClassInstances.tsx`**: Class instance data fetching. Exports: `useClassInstances`.
  - **`hooks/useClassTemplates.tsx`**: Class template data fetching. Exports: `useClassTemplates`.
  - **`hooks/use-calendar-event-handler.tsx`**: Calendar event interaction logic. Exports: `useCalendarEventHandler`.
  - **`hooks/use-calendar-resize.tsx`**: Calendar resize handling. Exports: `useCalendarResize`.
  - **`hooks/use-double-click.tsx`**: Double-click event handling. Exports: `useDoubleClick`.
  - **`utils/duration.ts`**: Time duration utilities. Exports: `formatDuration`.

- **`venues/`**: Venue/location management for businesses.
  - **`components/venues-list.tsx`**: Venue listing with CRUD. Exports: `VenuesList`.
  - **`components/venue-card.tsx`**: Individual venue display card. Exports: `VenueCard`.
  - **`components/create-venue-dialog.tsx`**: Dialog for creating new venues. Exports: `CreateVenueDialog`.
  - **`components/delete-venue-dialog.tsx`**: Venue deletion confirmation dialog. Exports: `DeleteVenueDialog`.
  - **`hooks/use-venues.tsx`**: Venue data management. Exports: `useVenues`.

- **`templates/`**: Class template management for recurring class types.
  - **`components/templates-page.tsx`**: Template management interface. Exports: `TemplatesPage`.
  - **`components/template-card.tsx`**: Individual template display card. Exports: `TemplateCard`.
  - **`components/create-template-dialog.tsx`**: Dialog for creating new templates. Exports: `CreateTemplateDialog`.

- **`settings/`**: Application settings and configuration management.
  - **`components/settings-page.tsx`**: Main settings page with tabbed interface. Exports: `SettingsPage`.
  - **`components/venues-tab.tsx`**: Venues management tab in settings. Exports: `VenuesTab`.
  - **`components/notifications-tab.tsx`**: Notifications configuration tab. Exports: `NotificationsTab`.
  - **`components/account-tab.tsx`**: Account and invoicing settings tab. Exports: `AccountTab`.
  - **`components/business-details-tab.tsx`**: Business details configuration tab. Exports: `BusinessDetailsTab`.

**Routes (`src/routes/`)** - File-based routing with TanStack Router:
- **`__root.tsx`**: Root layout with providers and error boundaries.
- **`_app-layout.tsx`**: Protected app shell requiring authentication.
- **`_app-layout/dashboard.tsx`**: Business dashboard with onboarding and analytics.
- **`_app-layout/calendar.tsx`**: Class scheduling and calendar management.
- **`_app-layout/better-calendar.tsx`**: Placeholder route for improved calendar (in development).
- **`_app-layout/bookings.tsx`**: Bookings management interface (in development).
- **`_app-layout/settings.tsx`**: Application settings and configuration.
- **`_app-layout/templates.tsx`**: Class template management interface.

**Utilities (`src/lib/`):**
- **`timezone-utils.ts`**: Timezone-aware date handling. Exports: `dbTimestampToBusinessDate`, `businessDateToDbTimestamp`.
- **`i18n.ts`**: Internationalization setup for English, Greek, Lithuanian. Exports: `i18n`.

**Hooks (`src/hooks/`):**
- **`useCompressedImageUpload.ts`**: Image upload with compression. Exports: `useCompressedImageUpload`, `UseCompressedImageUploadOptions`, `SaveHandler`.
- **`use-mobile.ts`**: Mobile device detection hook. Exports: `useMobile`.
- **`use-redirect-guard.ts`**: Navigation redirect protection. Exports: `useRedirectGuard`.

**Testing (`tests/`):**
- **`onboarding.spec.ts`**: Playwright E2E tests for user onboarding flow.
- **`helpers.ts`**: Test utilities and shared setup functions.

#### **`apps/web-consumer/`** - Consumer Booking App
Consumer-facing booking application for customers to discover and book classes.

**Tech Stack**: React 19, Vite, TanStack Router, Tailwind CSS, shadcn/ui, Cloudflare Workers
- **`src/features/booking/`**: Customer booking flows and class discovery.
- **`routes/`**: Customer-focused routing with public and authenticated sections.

#### **`apps/web-landing/`** - Marketing Landing Page
Marketing landing page for the booking platform.

**Tech Stack**: React Router, Cloudflare Workers
- **`app/routes/home.tsx`**: Main landing page with marketing content.
- **`workers/app.ts`**: Cloudflare Workers entry point.

#### **`apps/mobile-consumer/`** - Mobile App
React Native mobile application for iOS and Android consumers.

**Tech Stack**: React Native, Expo, TypeScript, React Navigation
- **`src/App.tsx`**: Mobile app root component with navigation.
- **`src/components/qr-scanner/`**: QR code scanning functionality with modals and controls.
- **`src/components/OnboardingWizard.tsx`**: User onboarding flow component. Exports: `OnboardingWizard`.
- **`src/components/language-switcher.tsx`**: Language selection component. Exports: `LanguageSwitcher`.
- **`src/components/BookingCard.tsx`**: Individual booking display with cancellation. Exports: `BookingCard`.
- **`src/components/ClassCard.tsx`**: Class instance card with booking actions. Exports: `ClassCard`.
- **`src/components/BusinessCard.tsx`**: Business discovery card with categories. Exports: `BusinessCard`.
- **`src/components/MapView.tsx`**: Interactive map for business and class discovery. Exports: `MapView`.
- **`src/components/ClassesList.tsx`**: Filterable class listing component. Exports: `ClassesList`.
- **`src/components/FilterBar.tsx`**: Class and business filtering interface. Exports: `FilterBar`.
- **`src/components/DateFilterBar.tsx`**: Date-based filtering for classes. Exports: `DateFilterBar`.
- **`src/navigation/`**: React Navigation setup with screen routing.
  - **`screens/Home.tsx`**: Main home screen with class discovery and bookings.
  - **`screens/Bookings.tsx`**: Complete booking management with cancellation support. Exports: booking list, cancellation handlers.
  - **`screens/ClassDetailsModal.tsx`**: Detailed class view with booking actions. Exports: class booking interface.
  - **`screens/Map.tsx`**: Interactive map screen for business and venue discovery.
  - **`screens/Settings.tsx`**: User settings and preferences management.
  - **`screens/News.tsx`**: Updates and announcements feed.
  - **`screens/BuyCreditsScreen.tsx`**: One-time credit purchase interface with pack selection (5, 10, 20, 30, 50 credits).
  - **`screens/SubscriptionScreen.tsx`**: Dynamic subscription management with slider (5-150 credits) and tiered pricing.
  - **`screens/PaymentSuccessScreen.tsx`**: Post-payment confirmation with deep-link handling.
  - **`screens/PaymentCancelScreen.tsx`**: Payment cancellation handling and recovery options.
  - **`screens/SettingsSubscriptionScreen.tsx`**: Subscription management with cancel/reactivate options.
- **`src/features/core/`**: Core application features including authentication, location gating, and user registration.
  - **`components/auth-guard.tsx`**: Authentication protection component. Exports: `AuthGuard`.
  - **`components/auth-sync.tsx`**: Authentication state synchronization. Exports: `AuthSync`.
  - **`components/location-gate.tsx`**: Location-based access control. Exports: `LocationGate`.
  - **`components/sign-in-form.tsx`**: Mobile sign-in form. Exports: `SignInForm`.
  - **`components/sign-in-tester-form.tsx`**: Testing form for sign-in functionality. Exports: `SignInTesterForm`.
  - **`components/register-form.tsx`**: User registration form. Exports: `RegisterForm`.
  - **`components/waitlist-form.tsx`**: Waitlist signup form. Exports: `WaitlistForm`.
  - **`screens/landing-screen.tsx`**: Main landing screen. Exports: `LandingScreen`.
  - **`screens/sign-in-modal-screen.tsx`**: Sign-in modal screen. Exports: `SignInModalScreen`.
  - **`screens/create-account-modal-screen.tsx`**: Account creation modal. Exports: `CreateAccountModalScreen`.
- **`src/features/explore/`**: Business and class discovery features.
  - **`components/BusinessesSection.tsx`**: Business listing with proper category display. Exports: `BusinessesSection`.
  - **`components/ClassesSection.tsx`**: Class discovery interface. Exports: `ClassesSection`.
  - **`components/ExploreHeader.tsx`**: Explore page header component. Exports: `ExploreHeader`.
  - **`components/ExploreScreen.tsx`**: Main explore interface. Exports: `ExploreScreen`.
  - **`hooks/useBusinesses.ts`**: Business data fetching hook. Exports: `useBusinesses`.
- **`src/features/bookings/`**: Complete booking management system with real-time updates.
- **`src/features/map/`**: Map and location features with business discovery.
- **`src/stores/auth-store.ts`**: Authentication state management. Exports: auth store utilities.
- **`maestro-tests/`**: Maestro test automation for mobile flows.

### Packages (`packages/`)

Shared libraries, utilities, and configurations used across all applications.

#### **`packages/api/`** - Convex Backend API
Convex backend API providing real-time database and serverless functions with service-layer architecture.

**Tech Stack**: Convex, TypeScript, Vitest, @convex-dev/auth

**Core Files:**
- **`setup.mjs`**: Automated development environment setup script.
- **`vitest.config.mts`**: Vitest testing configuration for backend tests.

**Convex Backend (`convex/`):**
- **`schema.ts`**: Complete database schema with multi-tenant architecture. Key entities: users, businesses, venues, classTemplates, classInstances, bookings, customers, subscriptions, creditTransactions.
- **`auth.config.ts`**: Authentication configuration with GitHub OAuth and email/OTP.
- **`http.ts`**: HTTP endpoints for webhooks and external integrations including Stripe webhook processing.
- **`utils.ts`**: Core authentication utilities including `getAuthenticatedUserOrThrow`.

**API Layer Structure:**
- **`mutations/`**: Convex mutation endpoints with argument validation that delegate to services
  - **`core.ts`**: Business and user profile mutations
  - **`venues.ts`**: Venue management mutations
  - **`classTemplates.ts`**: Class template mutations
  - **`classInstances.ts`**: Class instance mutations
  - **`bookings.ts`**: Booking management mutations
  - **`credits.ts`**: Credit system mutations
  - **`payments.ts`**: Payment processing mutations
  - **`uploads.ts`**: File upload mutations
  - **`notifications.ts`**: Notification mutations

- **`queries/`**: Convex query endpoints that delegate to services
  - **`core.ts`**: User and business queries
  - **`venues.ts`**: Venue data queries
  - **`classTemplates.ts`**: Template queries
  - **`classInstances.ts`**: Instance queries
  - **`bookings.ts`**: Booking queries
  - **`credits.ts`**: Credit and transaction queries
  - **`payments.ts`**: Payment and subscription queries
  - **`uploads.ts`**: Upload queries
  - **`notifications.ts`**: Notification queries

- **`actions/`**: External integrations and complex operations
  - **`payments.ts`**: Stripe integration actions
  - **`email.ts`**: Email service actions
  - **`venue.ts`**: External venue operations

**Service Layer Architecture (`services/`):**
- **`coreService.ts`**: Core business operations including business creation and user management. Exports: `createBusinessWithVenue`, `updateBusinessDetails`, `updateCurrentUserProfile`.
- **`venueService.ts`**: Venue management operations including CRUD and image handling.
- **`classTemplateService.ts`**: Class template operations with validation and business rules.
- **`classInstanceService.ts`**: Individual class instance management and calendar integration.
- **`bookingService.ts`**: Complete booking management with pagination and cancellation. Exports: `getCurrentUserBookings`, `cancelBooking`, `getBookingHistory`.
- **`creditService.ts`**: Sophisticated credit management system. Exports: `addCredits`, `spendCredits`, `getUserBalance`, `getTransactionHistory`.
- **`paymentsService.ts`**: Complete Stripe integration service. Exports: `createSubscription`, `updateSubscription`, `cancelSubscription`, `handleStripeWebhook`, `createOneTimePayment`.
- **`uploadService.ts`**: File upload and image management service.
- **`userService.ts`**: User profile and account management.
- **`notificationService.ts`**: Notification routing and delivery management.
- **`emailService.ts`**: Email service integration and template management.

**Business Logic Layer (`operations/`):**
- **`business.ts`**: Pure business operations for business entity management. Exports: `prepareCreateBusiness`, `createDefaultBusiness`.
- **`classTemplate.ts`**: Class template business logic and operations.
- **`classInstance.ts`**: Class instance scheduling and management operations.
- **`classDiscount.ts`**: Discount calculation and application logic.
- **`venue.ts`**: Venue operations and category management logic.
- **`pricing.ts`**: Dynamic pricing calculations and tiered pricing rules.
- **`payments.ts`**: Payment pricing operations and validation. Exports: `calculateSubscriptionPricing`, `calculateOneTimePricing`, `validateCreditAmount`.
- **`notifications.ts`**: Notification routing and deep-link generation logic.

**Business Rules Layer (`rules/`):**
- **`business.ts`**: Business-level rule validation. Exports: `canOnlyCreateBusinessOnce`.
- **`classTemplate.ts`**: Template business rule enforcement.
- **`venue.ts`**: Venue business rule validation.
- **`booking.ts`**: Booking business rules and constraints.
- **`core.ts`**: Core system business rules.

**Validation Layer (`validations/`):**
- **`core.ts`**: Core validation functions returning ValidationResult. Exports: `validateBusinessName`, `validateEmail`, `validateStreet`.
- **`class.ts`**: Class-related validation functions.
- **`venue.ts`**: Venue validation functions. Exports: `validateName`, `validateDescription`.
- **`credit.ts`**: Credit system validation functions.

**Type Definitions (`types/`):**
- **`booking.ts`**: Comprehensive booking types including `BookingWithDetails`. Exports: booking status enums, cancellation policies.
- **`credit.ts`**: Credit system types. Exports: `CreditTransactionType`, `CreditTransactionReason`.
- **`classDiscount.ts`**: Discount system type definitions.
- **`business.ts`**: Business entity types and configuration.
- **`businessInvitation.ts`**: Team invitation system types.
- **`systemSettings.ts`**: Global configuration management types.
- **`instructor.ts`**: Instructor profile and specialties types.
- **`classTemplate.ts`**: Class template types and recurrence patterns.
- **`classInstance.ts`**: Class instance types and scheduling.
- **`venue.ts`**: Venue types and category definitions.
- **`user.ts`**: User profile and role types.
- **`customer.ts`**: Customer profile types.
- **`notification.ts`**: Notification system types.
- **`core.ts`**: Core system types including ValidationResult.

**Utility Layer (`utils/`):**
- **`core.ts`**: Core utility functions. Exports: `throwIfError`.
- **`errorCodes.ts`**: Centralized error code constants. Exports: `ERROR_CODES`.
- **`deep-linking.ts`**: Deep-linking utilities for mobile apps. Exports: `generateDeepLink`, `parseDeepLink`.
- **`pricing.ts`**: Pricing calculation utilities.
- **`classDiscount.ts`**: Discount calculation utilities.
- **`timeGeneration.ts`**: Time and scheduling utilities.
- **`reconciliation.ts`**: Data reconciliation utilities.

**Generated Files (`convex/_generated/`):**
- **`api.d.ts`**: Auto-generated TypeScript API definitions.
- **`dataModel.d.ts`**: Generated database schema types.

#### **`packages/ui/`** - Shared Component Library
Shared React component library with consistent design system.

**Tech Stack**: React 19, TypeScript, Tailwind CSS
- **`src/button.tsx`**: Reusable button component. Exports: `Button`.
- **`src/card.tsx`**: Card container components. Exports: `Card`, `CardContent`, `CardHeader`.
- **`src/code.tsx`**: Code display component. Exports: `Code`.

#### **`packages/utils/`** - Shared Utilities
Shared utility functions and constants across the monorepo.

- **`src/constants.ts`**: Venue category definitions and utilities. Exports: `VENUE_CATEGORIES`, `VENUE_CATEGORY_DISPLAY_NAMES`, `getVenueCategoryDisplay`, `getVenueCategoryOptions`, `isValidVenueCategory`, `VenueCategory`.
- **`src/crypto-utils.ts`**: Cryptographic utilities. Exports: crypto helpers.
- **`src/i18n-typed.ts`**: Type-safe internationalization utilities. Exports: i18n types.
- **`src/types.ts`**: Common TypeScript type definitions. Exports: shared types.
- **`src/deep-linking.ts`**: Deep-linking utilities for mobile apps. Exports: `generateDeepLink`, `parseDeepLink`, `DEEP_LINK_SCHEME`.

#### **`packages/eslint-config/`** - ESLint Configurations
- **`base.js`**: Base ESLint configuration for all environments.
- **`react-internal.js`**: React-specific ESLint rules.
- **`vite.js`**: Vite-specific ESLint configuration.

#### **`packages/typescript-config/`** - TypeScript Configurations
- **`base.json`**: Base TypeScript configuration with strict mode.
- **`react-library.json`**: React library-specific TypeScript settings.
- **`vite.json`**: Vite project TypeScript configuration.

## Common Commands

### Development
- `pnpm dev` - Start all apps in development mode
- `pnpm dev --filter=web-business` - Start only the business app
- `pnpm dev --filter=web-consumer` - Start only the consumer app
- `cd packages/api && pnpm dev` - Start Convex backend with dashboard

### Building
- `pnpm build` - Build all apps and packages
- `pnpm build --filter=web-business` - Build only the business app
- `pnpm build --filter=web-consumer` - Build only the consumer app

### Code Quality
- `pnpm lint` - Run ESLint on all packages
- `pnpm check-types` - Run TypeScript type checking
- `pnpm format` - Format code with Prettier
- `cd packages/api && npx convex typecheck` - Run Convex-specific type checking

### Deployment
- `cd apps/web-business && pnpm deploy` - Deploy business app to Cloudflare Workers
- `cd apps/web-consumer && pnpm deploy` - Deploy consumer app to Cloudflare Workers
- `cd apps/web-business && pnpm cf-typegen` - Generate Cloudflare types for business app
- `cd apps/web-consumer && pnpm cf-typegen` - Generate Cloudflare types for consumer app
- `cd packages/api && npx convex deploy` - Deploy Convex backend

### Testing
- **Backend**: Comprehensive Vitest unit and integration tests in `packages/api`
  - **Unit Tests**: `packages/api/operations/*.test.ts` for pure business logic testing
    - **`payments.test.ts`**: Payment pricing calculations and validation logic
    - **`business.test.ts`**: Business entity operations and validation
    - **`classTemplate.test.ts`**: Template creation and validation logic
    - **`venue.test.ts`**: Venue operations and category management
  - **Integration Tests**: `packages/api/integrationTests/` with complete workflow testing
    - **`payment.integration.test.ts`**: End-to-end payment workflows with Stripe integration
    - **`booking.integration.test.ts`**: End-to-end booking workflows with cancellation and refunds
    - **`credit.integration.test.ts`**: Credit system testing with transaction validation
    - **`classInstance.integration.test.ts`**: Class scheduling and instance management tests
    - **`classTemplate.integration.test.ts`**: Template creation and management tests
    - **`venue.integration.test.ts`**: Venue operations and category management tests
    - **`upload.integration.test.ts`**: File upload and image management testing
    - **`helpers.ts`**: Test utilities and shared setup functions for integration testing
- **Frontend**: Playwright E2E tests for critical user journeys in `apps/web-business/tests`
- **Mobile**: Maestro test automation for mobile consumer app workflows in `apps/mobile-consumer/maestro-tests`
- **Testing Strategy**: Multi-layer approach - unit tests for operations, integration tests for workflows, E2E tests for user journeys
- When implementing features, verify functionality through manual testing and appropriate test level

## Architecture Overview

### Backend (Convex)
- Real-time database with serverless functions
- Authentication via @convex-dev/auth with GitHub OAuth and email/OTP
- Development environment includes automatic setup via `setup.mjs` and dashboard opening
- Comprehensive business management schema including:
  - Multi-tenant business system with user roles (owner/admin/user)
  - Class templates with recurrence rules (rrule) and timezone handling
  - Dynamic class instance generation from templates
  - Advanced credit system with double-entry ledger and expiration handling
  - Booking system with waitlists, cancellation policies, and real-time updates
  - Venue/location management with category system and image storage
  - Customer management with emergency contacts and waivers
  - Business payouts and transaction fee processing
  - Upload management with automatic image compression and cleanup
- API functions organized by type: `/convex/mutations/`, `/convex/queries/`, `/convex/actions/` with service layer orchestration
- Schema in `packages/api/convex/schema.ts` with audit fields (`createdAt`, `createdBy`, `updatedAt`, `updatedBy`) and soft deletes (`deleted`, `deletedAt`, `deletedBy`)
- Follow Convex best practices with service-layer architecture pattern

### Frontend Architecture
- **Business App**: React 19 + Vite + TanStack Router with Cloudflare Workers deployment
  - Full calendar integration with FullCalendar
  - Complex form handling with React Hook Form + Zod validation
  - Zustand for auth state management
  - shadcn/ui components with Radix UI primitives
  - i18n support (English, Greek, Lithuanian)
  - Features: calendar management, venue creation, class scheduling, booking management
- **Consumer App**: Similar tech stack focused on booking interface
- **Landing Page**: React Router + Cloudflare Workers for marketing site

### Key Technologies
- **Frontend**: React 19, Vite, TanStack Router, Tailwind CSS 4.x, shadcn/ui, Radix UI
- **Backend**: Convex, @convex-dev/auth, date-fns/tz for timezone handling, rrule for recurrence
- **Payments**: Stripe (API version 2025-02-24.acacia) for subscriptions and one-time payments, EUR currency only
- **Mobile**: React Native, Expo, React Navigation, Deep-linking with custom scheme
- **Deployment**: Cloudflare Workers with wrangler
- **Monorepo**: Turborepo with pnpm workspaces
- **Code Quality**: ESLint 9, TypeScript 5.8, Prettier

### Data Model Highlights
- Multi-tenant with `businessId` on all entities
- Class system: `classTemplates` → `classInstances` (generated from templates)
- Booking flow: `users` → `bookings` → `classInstances` (customer table deprecated in favor of direct user credits)
- Credit System: Double-entry ledger with `creditLedger`, `creditTransactions`, and `businessPayouts` tables
- Subscription System: `subscriptions` table with Stripe integration, `subscriptionEvents` for audit trail
- Scheduling: Uses rrule for recurrence, timezone-aware with date-fns-tz
- Venue Management: Categorized venues with `primaryCategory` field and image storage support
- Pricing: Dynamic pricing rules, credit system with expiration, discount templates
- Payment Processing: Complete Stripe integration with webhook handling and idempotency
- Image Storage: Support for multiple images per venue/template with automatic cleanup
- Audit trail: All entities have created/updated fields and soft delete support

## Development Workflow

1. Install dependencies: `pnpm install`
2. Start Convex backend: `cd packages/api && pnpm dev` (runs setup, starts dev server, opens dashboard)
3. Start frontend apps: `pnpm dev` (all apps) or `pnpm dev --filter=web-business`
4. Make changes to relevant packages
5. Run type checking: `pnpm check-types`
6. Run linting: `pnpm lint`
7. Format code: `pnpm format`
8. Build for production: `pnpm build`

### Package Manager
- This project uses pnpm with workspaces
- Always use `pnpm` instead of npm or yarn
- Package manager is enforced via `"packageManager": "pnpm@9.0.0"` in root package.json

## Important Notes

### Convex Development
- Always use the new function syntax with explicit `args` and `returns` validators
- Use `internalQuery`, `internalMutation`, `internalAction` for private functions
- Database queries should use indexes defined in schema, avoid `.filter()`
- Follow the **Service-Layer Architecture Pattern** for all new API endpoints:
  - **Mutations**: Define argument schemas and delegate to services (`convex/mutations/`)
  - **Queries**: Define query schemas and delegate to services (`convex/queries/`)  
  - **Services**: Orchestrate business logic, call operations and rules (`services/`)
  - **Operations**: Pure business logic operations and transformations (`operations/`)
  - **Rules**: Business rule validation that throws ConvexError (`rules/`)
  - **Validations**: Input validation returning ValidationResult (`validations/`)
  - Use centralized `ERROR_CODES` from `utils/errorCodes.ts` for consistent error handling
- Type safety: Export TypeScript types using `Infer<typeof argSchema>` pattern

### Frontend Development
- Use TanStack Router for routing (file-based routing in `/routes/`)
- Forms use React Hook Form + Zod validation (**Important**: Do NOT use explicit generic types with `useForm<T>()`, let TypeScript infer types from Zod resolver to avoid control type conflicts)
- UI components follow shadcn/ui patterns with Radix UI primitives
- Internationalization files in `/public/locales/`
- Auth state managed with Zustand in `/src/components/stores/auth.ts`

### Deployment
- All frontend apps deploy to Cloudflare Workers
- Use `wrangler.json`/`wrangler.jsonc` for deployment configuration
- Assets configured for single-page application routing

### Timezone Handling
- **Company timezone is the source of truth** - all events displayed in business timezone regardless of user location
- Database stores UTC timestamps, convert for display using utilities in `/src/lib/timezone-utils.ts`
- Key functions: `dbTimestampToBusinessDate()`, `businessDateToDbTimestamp()`, `convertUtcToTimezone()`, `convertTimezoneToUtc()`
- FullCalendar displays times in business timezone without timezone property
- Always use timezone-aware utilities when handling dates/times

#### Mobile App Timezone Policy
- **Greece-Only Timezone Display**: All mobile consumer apps display times exclusively in `Europe/Athens` timezone
- **Global Consistency**: Users viewing from London, New York, or anywhere else see Greek business hours
- **Date-fns v4 Implementation**: Uses `format(date, pattern, { in: tz('Europe/Athens') })` for consistent timezone display
- **No User Preference**: Timezone is not configurable - always shows Greek local time

### Service-Layer Architecture 
- Business logic orchestrated through dedicated service layer (`services/`)
- Pure operations separated into testable functions (`operations/`)
- Business rules enforced through validation layer (`rules/`)
- Input validation handled separately from business logic (`validations/`)
- Clear separation between API layer (mutations/queries) and business logic
- Services coordinate between operations, rules, and validations for complex workflows

## Calendar and Event Handling
- Calendar uses FullCalendar with drag-drop, resize, and real-time updates via Convex subscriptions
- Events transformed via `transformClassInstancesToCalendarEvents()` in calendar-page.tsx
- Colors stored in database `color` field but must be included in query responses (common issue)
- Event handlers use confirmation dialogs for multi-instance updates with pattern matching
- Calendar supports bulk operations (edit/delete similar instances by time pattern and day)
- Mobile-responsive with different views (2-day mobile, 7-day desktop)

## Color System  
- Class templates and instances support optional color field for visual organization
- Color picker uses predefined COLOR_OPTIONS in edit dialogs (Blue, Green, Yellow, Red, Purple, Orange)
- **Critical**: Ensure database queries include `color: instance.color` in response objects
- Colors fallback to '#3B82F6' (blue) if not specified
- Colors applied to both backgroundColor and borderColor in FullCalendar events

## Service-Layer Architecture Pattern

The codebase follows a service-layer architecture that provides clear separation of concerns and improved maintainability. **All new API endpoints must follow this pattern**:

### Architecture Layers:

```
API Layer (convex/)
├── mutations/           # Argument schemas & thin wrappers that delegate to services
├── queries/             # Query schemas & thin wrappers that delegate to services  
├── actions/             # External integrations and complex operations
└── utils.ts            # Authentication utilities

Service Layer (services/)
├── coreService.ts       # Business operations orchestration
├── venueService.ts      # Venue management operations
├── bookingService.ts    # Booking workflow orchestration
└── ...                 # Other domain services

Business Logic (operations/)
├── business.ts         # Pure business operations and transformations
├── payments.ts         # Payment calculations and pricing logic
├── venue.ts            # Venue business logic
└── ...                 # Other domain operations

Validation Layers:
├── rules/              # Business rule validation (throws ConvexError)
├── validations/        # Input validation (returns ValidationResult)
├── types/              # TypeScript type definitions
└── utils/              # Utility functions and error codes
```

### Key Principles:

#### 1. **API Layer Pattern**
```typescript
// convex/mutations/core.ts - Thin wrapper with argument validation
export const createBusinessWithVenueArgs = v.object({
  business: v.object({ name: v.string(), ... }),
  venue: v.object({ name: v.string(), ... })
});

export const createBusinessWithVenue = mutationWithTriggers({
  args: createBusinessWithVenueArgs,
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUserOrThrow(ctx);
    return coreService.createBusinessWithVenue({ ctx, args, user });
  }
});
```

#### 2. **Service Layer Pattern**
```typescript
// services/coreService.ts - Business logic orchestration
export const coreService = {
  createBusinessWithVenue: async ({ ctx, args, user }) => {
    canOnlyCreateBusinessOnce(user); // Rule validation
    const cleanArgs = prepareCreateBusiness(args); // Operation
    
    const businessId = await ctx.db.insert("businesses", {
      ...createDefaultBusiness(user._id),
      ...cleanArgs.business,
    });
    
    return { createdBusinessId: businessId };
  }
};
```

#### 3. **Operations Layer Pattern**
```typescript
// operations/business.ts - Pure business logic
export const prepareCreateBusiness = (args: CreateBusinessWithVenueArgs) => {
  const cleanBusiness = {
    business: {
      name: throwIfError(coreValidations.validateBusinessName(args.business.name), 'name'),
      email: throwIfError(coreValidations.validateEmail(args.business.email), 'email'),
      // ... other validations
    }
  };
  return cleanBusiness;
};
```

#### 4. **Rules Layer Pattern**
```typescript
// rules/business.ts - Business rule validation
export const canOnlyCreateBusinessOnce = (user: Doc<"users">) => {
  if (user.businessId) {
    throw new ConvexError({
      message: "User already belongs to a business",
      code: ERROR_CODES.USER_ALREADY_ASSOCIATED_WITH_BUSINESS
    });
  }
};
```

#### 5. **Validation Layer Pattern**
```typescript
// validations/core.ts - Input validation
export const validateBusinessName = (name: string): ValidationResult<string> => {
  const trimmed = name.trim();
  if (!trimmed) {
    return { success: false, error: "Business name is required" };
  }
  if (trimmed.length > 100) {
    return { success: false, error: "Business name cannot exceed 100 characters" };
  }
  return { success: true, value: trimmed };
};
```

### Error Handling:
- Use centralized `ERROR_CODES` from `utils/errorCodes.ts`
- Rules layer throws `ConvexError` with structured error codes
- Validation layer returns `ValidationResult<T>` objects
- Operations use `throwIfError()` utility to convert ValidationResult to errors

This architecture ensures clear separation of concerns, improved testability, and consistent error handling throughout the API.

## Key Architecture Patterns

### Service-Layer Architecture
All API endpoints follow a consistent layered pattern:
- **API Layer** (`convex/mutations/`, `convex/queries/`): Argument schemas and thin wrapper functions that delegate to services
- **Service Layer** (`services/`): Business logic orchestration and workflow management
- **Operations Layer** (`operations/`): Pure business logic operations and data transformations
- **Rules Layer** (`rules/`): Business rule validation that throws ConvexError
- **Validation Layer** (`validations/`): Input validation returning ValidationResult
- **Types Layer** (`types/`): TypeScript type definitions
- **Utils Layer** (`utils/`): Utility functions and centralized error codes

### Multi-Tenant Data Model
- All entities include `businessId` for proper tenant isolation
- Comprehensive audit trail with `createdAt`, `createdBy`, `updatedAt`, `updatedBy`
- Soft delete support with `deleted`, `deletedAt`, `deletedBy` fields
- Role-based access control with business-level permissions

### Real-Time Architecture
- Convex provides real-time subscriptions for live updates
- Calendar components receive live class instance changes
- Booking status updates propagate immediately across clients
- Dashboard metrics update in real-time for business intelligence

### File-Type Based Organization
- Backend organized by function type (mutations, queries, services, operations, rules, validations)
- Clear separation between API layer, service layer, and business logic
- Type definitions centralized in dedicated types folder
- Utilities and shared functions organized by purpose
- Frontend organized by feature (dashboard, calendar, venues, templates) with co-located components

### Timezone Management
- Business timezone is the source of truth for all scheduling
- UTC timestamps stored in database with timezone conversion utilities
- `timezone-utils.ts` provides conversion functions between business and database time
- FullCalendar displays events in business timezone regardless of user location

## Development Best Practices

### Testing Strategy
- **Backend**: Comprehensive Vitest unit and integration tests for all business logic
- **Frontend**: Playwright E2E tests for critical user journeys (no component tests)
- **Manual Testing**: Feature verification through development workflow
- **Integration Testing**: End-to-end user workflow validation

### Code Quality Standards
- TypeScript strict mode enabled across all packages
- ESLint 9 with custom configurations per environment
- Prettier for consistent code formatting
- Centralized error handling with structured error codes
- Service-layer architecture for maintainable and testable API endpoints
- Comprehensive testing strategy with unit tests for operations and integration tests for workflows

### Performance Considerations
- Real-time subscriptions optimized for calendar views
- Proper indexing strategies in Convex database schema
- Code splitting via TanStack Router for frontend performance
- Mock data systems for development and testing

## Advanced Credit System

The platform implements a sophisticated double-entry accounting system for credit management:

### Credit Ledger Architecture
- **Double-Entry Ledger**: All transactions recorded in `creditLedger` table with balancing entries
- **Transaction Safety**: Idempotency keys prevent duplicate transactions via `creditTransactions` table
- **Account Types**: Support for `customer`, `business`, `system`, and `payment_processor` accounts
- **Credit Expiration**: VIP users get 5-month expiration, regular users get 3-month expiration
- **Transaction Fees**: Configurable fee structure with 20% default system cut

### Credit Operations
- **Purchase Flow**: `recordCreditPurchase()` handles credit purchases with proper ledger entries
- **Booking Flow**: `recordBookingLedgerEntries()` manages booking payments and business earnings
- **Reconciliation**: `reconcileUserCredits()` ensures user balance consistency
- **Business Payouts**: Automated payout processing with `businessPayouts` table tracking

### Payment Safety
- **Credits After Payment**: All credit allocations happen only after payment confirmation
- **Webhook-Based**: Most allocations via Stripe webhooks (only fire after successful payment)
- **Status Checks**: Immediate operations verify payment/subscription status before allocating
- **No Pre-allocation**: Never give credits before payment succeeds (except intentional admin gifts/refunds)

### Key Features
- **Real-time Balance Updates**: User and business credit balances updated atomically
- **Audit Trail**: Complete transaction history with external references
- **Fee Management**: Dynamic transaction fee calculation based on business settings
- **Credit Value Tracking**: Each credit purchase includes value (€2.00 per credit base)

## Complete Stripe Payment System

The platform features a comprehensive Stripe integration for payments and subscriptions:

### Subscription Management
- **Dynamic Subscriptions**: 5-150 credits/month with slider interface
- **Tiered Pricing**: 
  - 5-44 credits: €2.00/credit (no discount)
  - 45-84 credits: €1.95/credit (2.5% discount)
  - 85-124 credits: €1.90/credit (5% discount)
  - 125-150 credits: €1.80/credit (10% discount)
- **Simplified Updates**: Changes take effect at next billing cycle (no immediate charges/credits)
- **Smart Reactivation**:
  - Not expired: Re-enable without charge, optional credit amount change for next billing
  - Expired: Create new subscription with immediate payment and credits

### One-Time Purchases
- **Credit Packs**: 5-50 credits with predefined options
- **Fixed Pricing**: €2.30/credit base with pack-based discounts
- **Instant Delivery**: Credits available immediately upon successful payment via webhook
- **Mobile Optimized**: Dedicated purchase screens with pack selection (5, 10, 20, 30, 50 credits)
- **Safe Allocation**: Credits only allocated after `checkout.session.completed` webhook

### Webhook Processing
- **Event Handling**: Complete Stripe webhook integration for all payment events
- **Subscription Events**: `customer.subscription.created`, `.updated`, `.deleted`
- **Payment Events**: `checkout.session.completed`, `payment_intent.succeeded`
- **Error Recovery**: Automatic retry and error handling for failed webhooks
- **Audit Trail**: `subscriptionEvents` table tracks all subscription changes

### Payment Architecture
- **Customer Management**: Automatic Stripe customer creation with deduplication
- **Session Creation**: Secure checkout sessions with metadata tracking
- **Currency**: EUR (€) for all transactions
- **Test Mode**: Dedicated test credit purchase endpoints for development

## Venue Category System

A comprehensive venue categorization system replaces auto-generated business types:

### Category Management
- **Structured Categories**: 12 predefined venue categories (yoga_studio, fitness_center, etc.)
- **Display Utilities**: `getVenueCategoryDisplay()` for consistent category naming
- **Validation**: `isValidVenueCategory()` for type-safe category validation
- **Form Integration**: `getVenueCategoryOptions()` for dropdown menus

### Implementation Details
- **Database Field**: `primaryCategory` required field on all venues
- **Import Structure**: Categories imported from `@repo/utils/constants` (not root package)
- **Frontend Integration**: Category selection in venue creation and onboarding flows
- **Mobile Display**: BusinessesSection uses category field instead of auto-generation

### Migration Benefits
- **Consistency**: Eliminates hardcoded business type generation from services/amenities
- **Maintainability**: Single source of truth for venue categories
- **Flexibility**: Easy to add new categories without code changes
- **Type Safety**: Full TypeScript support for category validation

## New Features and Enhancements

### Image Upload and Management System
A comprehensive image management system has been added to support venue and class template images:

#### Frontend Components:
- **Image Compression**: `useCompressedImageUpload` hook provides automatic image compression with configurable options
- **Upload Configuration**: Supports pre-compression size limits (default 5MB), quality settings (0.9 default), and dimension constraints (1400px max)
- **Progress Tracking**: Real-time upload status with loading indicators and error handling
- **Integration**: Seamless integration with venue and template forms

#### Backend Implementation:
- **Upload Endpoints**: `/convex/uploads/mutations.ts` provides secure upload URL generation
- **Image Association**: Dedicated endpoints for associating images with venues (`addVenueImage`, `removeVenueImage`) and templates (`addTemplateImage`, `removeTemplateImage`)
- **Storage Management**: Automatic cleanup when removing images from templates (deletes from storage)
- **Schema Updates**: Both `venues` and `classTemplates` tables now include `imageStorageIds` arrays for multiple image support

#### Key Features:
- **Browser-based Compression**: Uses `browser-image-compression` library for client-side optimization
- **Validation**: File type validation, size limits, and error messaging with Sonner toast notifications
- **Security**: Authentication-based uploads with proper business-level access control
- **Storage Integration**: Full Convex file storage integration with automatic cleanup

### Enhanced Calendar System
The calendar system has been significantly expanded with advanced interaction capabilities:

#### Advanced Dialog Components:
- **Bulk Operations**: Confirmation dialogs for updating and deleting multiple similar instances
- **Pattern Matching**: Time-pattern and day-of-week based instance matching for bulk operations
- **Event Editing**: Comprehensive edit dialog with override capabilities for individual instances
- **Template Integration**: Create instances directly from templates with customization options

#### Interactive Features:
- **Event Handlers**: Advanced drag-drop, resize, and double-click handling
- **Mobile Optimization**: Responsive calendar with different views for mobile (2-day) and desktop (7-day)
- **Real-time Updates**: Live synchronization of calendar events across all connected clients
- **Color System**: Enhanced color support with template-level color inheritance and overrides

### Settings and Configuration Management
A new comprehensive settings system has been implemented:

#### Tabbed Interface:
- **Venues Tab**: Integrated venue management within settings
- **Notifications Tab**: Notification preferences and configuration
- **Account Tab**: Billing, invoicing, and account management
- **Business Details Tab**: Core business information management

#### Features:
- **URL State Management**: Settings tabs persist in browser URL using `nuqs` for bookmarking
- **Responsive Design**: Mobile-optimized settings interface
- **Modular Architecture**: Each settings area is a separate component for maintainability

### Mobile App Enhancements
The mobile consumer app has been significantly enhanced with comprehensive authentication and onboarding:

#### Authentication System:
- **Multi-modal Auth**: Support for multiple sign-in methods with proper form handling
- **Location Gating**: Geographic access control for location-based services
- **Waitlist Integration**: Waitlist signup for users in non-served areas
- **Registration Flow**: Complete user registration with validation

#### Enhanced Components:
- **Onboarding Wizard**: Step-by-step user onboarding with progress tracking
- **QR Scanner**: Advanced QR code scanning with modal interfaces and permission handling
- **Language Support**: Dynamic language switching with i18n support
- **Modal Screens**: Dedicated modal screens for sign-in and account creation flows

#### Testing Infrastructure:
- **Maestro Integration**: Automated mobile testing with Maestro for critical user flows
- **Test Coverage**: Comprehensive test scenarios for logged-in and logged-out user flows

### Database Schema Enhancements
The database schema has been expanded with comprehensive business management capabilities:

#### New Tables Added:
- **Subscriptions**: Complete subscription lifecycle with Stripe integration
  - Fields: `userId`, `stripeSubscriptionId`, `status`, `currentPeriodEnd`, `creditsPerMonth`
  - Statuses: `active`, `canceled`, `past_due`, `incomplete`
- **Subscription Events**: Audit trail for all subscription changes
  - Tracks: creation, updates, cancellations, reactivations
- **Credit Transactions**: Enhanced with purchase types and Stripe references
  - Purchase types: `user_buy`, `subscription_renewal`, `gift`, `refund`
  - Includes `stripePaymentIntentId` for payment tracking
- **Business Invitations**: Complete invitation system for team member onboarding
- **Onboarding Progress**: Step-by-step progress tracking for different user types
- **System Settings**: Global configuration management with key-value storage
- **Discount Templates**: Flexible discount system with business-specific applications
- **Business Discounts**: Junction table for discount assignment and management
- **Class Types**: Categorization system for different class offerings
- **Instructors**: Dedicated instructor management with specialties and bio information
- **Pricing Rules**: Dynamic pricing system with time-based and occupancy-based rules

#### Enhanced Existing Tables:
- **Venues**: Added comprehensive address, social media, amenities, and services fields
- **Class Templates**: Enhanced with booking windows, waitlist support, and image storage
- **Class Instances**: Pattern matching fields (`timePattern`, `dayOfWeek`) for efficient bulk operations
- **Customers**: Complete customer profiles with emergency contacts, medical notes, and preferences
- **Bookings**: Advanced booking system with waitlist positions, pricing snapshots, and multiple status states

### Image Storage Integration
All venue and template entities now support multiple images:
- **Storage IDs**: Arrays of Convex storage IDs for flexible image management
- **Automatic Cleanup**: Images are automatically deleted from storage when removed from templates
- **Access Control**: Image operations respect business-level permissions and user authentication
- **Compression Pipeline**: Client-side compression before upload reduces bandwidth and storage costs

## Latest Features and Enhancements (August 2025)

### Simplified Subscription System
The subscription system has been refactored for clarity and reliability:

#### Subscription Updates:
- **No Immediate Charges**: Updates take effect at next billing cycle only
- **No Proration**: Removed complex proration logic to avoid confusion
- **Clear Messaging**: Users know exactly when changes take effect

#### Subscription Reactivation:
- **Not Expired**: Re-enable without charge, can change amount for next billing
- **Expired**: Create new subscription with immediate payment and credits
- **Safe Payment**: Credits only allocated after successful payment (`payment_behavior: 'error_if_incomplete'`)

#### Pricing Display:
- **Accurate Pricing**: All prices shown with `.toFixed(2)` for exact amounts (€97.50, not €98)
- **EUR Only**: Consistent EUR currency throughout the system
- **Clear Tiers**: 5-44 (€2.00), 45-84 (€1.95), 85-124 (€1.90), 125-150 (€1.80) per credit

### Complete Booking System Implementation
A comprehensive booking management system has been implemented across the platform:

#### Consumer Mobile App Booking Management:
- **Complete Booking Interface**: `apps/mobile-consumer/src/navigation/screens/Bookings.tsx` provides full booking management
- **Booking Cards**: Interactive booking cards with real-time cancellation windows and refund calculations
- **Cancellation System**: Smart cancellation with automatic refund calculation based on cancellation policies
- **Date Grouping**: Bookings grouped by date (Today, Tomorrow, specific dates) for better organization
- **Real-time Updates**: Live booking status updates and cancellation window calculations

#### Advanced Credit and Discount System:
- **Credit Service**: `packages/api/services/creditService.ts` handles all credit operations (add, spend, balance, history)
- **Booking Service**: `packages/api/services/bookingService.ts` manages booking lifecycle with pagination and cancellation
- **Discount Integration**: Automatic best discount calculation during booking flow
- **Refund Processing**: Intelligent refund calculation based on cancellation timing and policies
- **Payment Safety**: Credits only allocated after payment confirmation via webhooks

#### Enhanced Class Discovery:
- **Class Cards**: Rich class display cards with booking actions and availability information
- **Business Cards**: Business discovery with proper category display and venue information
- **Filter Systems**: Advanced filtering by date, location, class type, and business category
- **Map Integration**: Interactive map for discovering classes and businesses by location

### Comprehensive Testing Infrastructure
- **Integration Testing**: Complete test coverage for booking, credit, and class management workflows
- **Booking Tests**: End-to-end testing of booking creation, cancellation, and refund processes
- **Credit Tests**: Transaction validation, balance reconciliation, and error handling
- **Class Tests**: Template and instance management with scheduling validation

### Mobile App Feature Completeness:
- **Authentication Flow**: Complete sign-in, registration, and location gating system
- **Booking Management**: Full booking lifecycle from discovery to cancellation
- **Payment Integration**: Complete Stripe payment flows with dedicated screens
- **Credit Management**: Real-time balance display with expiration warnings
- **Subscription Management**: View, cancel, and reactivate subscriptions in-app
- **Deep-Linking**: Custom `kymaclub://` scheme for navigation from notifications
- **QR Scanner**: Advanced QR code scanning for quick class check-ins
- **Timezone Consistency**: All times displayed in Europe/Athens timezone for consistency

## Deep-Linking System

The mobile app implements a comprehensive deep-linking architecture:

### URL Scheme
- **Custom Scheme**: `kymaclub://` for app-specific links
- **Web Fallback**: `https://kymaclub.gr` for universal links

### Supported Routes
- **Class Details**: `kymaclub://class/:classId` - Opens specific class view
- **Venue Details**: `kymaclub://venue/:venueId` - Opens venue information
- **Booking Details**: `kymaclub://booking/:bookingId` - Opens booking management
- **Payment Success**: `kymaclub://payment/success` - Post-payment confirmation
- **Payment Cancel**: `kymaclub://payment/cancel` - Payment cancellation handling
- **Subscription Management**: `kymaclub://subscription` - Opens subscription settings

### Integration Points
- **Push Notifications**: Deep links embedded in notification payloads
- **Stripe Redirects**: Return URLs for payment success/failure
- **Email Links**: Direct navigation to specific app screens
- **QR Codes**: Encoded deep links for quick actions

### Implementation
- **URL Parsing**: `parseDeepLink()` utility for route extraction
- **Link Generation**: `generateDeepLink()` for creating typed links
- **Navigation Handler**: Automatic routing to appropriate screens

### Service Layer Architecture:
- **Modular Services**: Each domain (booking, credit, class, venue) has dedicated service modules
- **Type Safety**: Comprehensive TypeScript types for all booking and credit operations
- **Error Handling**: Structured error codes and user-friendly error messages
- **Business Logic**: Pure business logic separated from database operations

# important-instruction-reminders
Do what has been asked; nothing more, nothing less.
NEVER create files unless they're absolutely necessary for achieving your goal.
ALWAYS prefer editing an existing file to creating a new one.
NEVER proactively create documentation files (*.md) or README files. Only create documentation files if explicitly requested by the User.