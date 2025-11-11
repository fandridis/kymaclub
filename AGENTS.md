# AI Agents - Quick Start Guide

## Quick Checklist

Before starting any task:
- Understand business rules (see `.cursor/rules/business-rules.mdc`)
- Use real-time patterns: Convex subscriptions for live data; avoid stale reads
- Payment safety: never allocate credits before webhook-confirmed payments
- Timezone: display times in business/Greece timezone (`Europe/Athens`)
- Follow repo commands: install/build/lint/test using pnpm and Turbo

After building a plan and executing changes:
- **Check AGENTS.md**: Review this file to determine if it needs updates based on the changes made. Update it if:
  - New patterns, conventions, or best practices were established
  - Repository structure changed significantly
  - New critical rules or guidelines emerged
  - Folder structures or file organization changed
  - New common commands or workflows were introduced

## Repository Structure

**Monorepo**: Managed by `pnpm` + Turborepo

**Apps** (deployable frontends):
- `apps/mobile-consumer/` - React Native consumer app (iOS/Android) with Expo
- `apps/web-business/` - React web dashboard for business management
- `apps/web-consumer/` - React web consumer app
- `apps/web-landing/` - React-router framework-mode landing page (marketing)

**Packages** (shared libraries):
- `packages/api/` - Convex backend API with TypeScript
- `packages/utils/` - Shared utility functions and constants
- `packages/ui/` - Shared UI components
- `packages/eslint-config/` - Shared ESLint configurations
- `packages/typescript-config/` - Shared TypeScript configurations

**Common Commands**:
```bash
pnpm i              # Install dependencies (run at repo root)
pnpm dev            # Start all dev servers (runs turbo run dev)
pnpm build          # Build all packages (Turborepo graph-aware)
pnpm lint           # Lint all packages
pnpm test           # Run tests
pnpm check-types    # Type check all packages
pnpm format         # Format code with Prettier

# Filtered runs:
pnpm -w --filter @repo/web-business dev
pnpm -w --filter @repo/api dev        # Convex dev server
pnpm -w --filter @repo/web-landing deploy
```

## Folder Structures

### apps/mobile-consumer/src/

```
src/
├── App.tsx                      # Root app component with providers
├── components/                  # Reusable UI components
│   ├── AppTabs.tsx             # Bottom tab navigation
│   ├── BookingCard.tsx          # Individual booking with cancellation
│   ├── ClassCard.tsx            # Class display with booking actions
│   ├── ClassesList.tsx          # Filterable class listing
│   ├── CreditsBadge.tsx         # Credit balance display
│   ├── DateFilterBar.tsx        # Date-based filtering
│   ├── FilterBar.tsx            # Class/business filtering
│   ├── OnboardingWizard.tsx     # User onboarding flow
│   ├── VenueCard.tsx            # Venue display component
│   ├── news/                    # News components
│   └── qr-scanner/              # QR code scanning module
├── features/                    # Domain-specific features
│   ├── core/                    # Authentication & location gating
│   │   ├── components/          # Auth components (sign-in, register, waitlist)
│   │   └── screens/             # Auth screens (landing, sign-in modal)
│   ├── explore/                 # Business and class discovery
│   │   ├── components/          # Explore components
│   │   └── hooks/               # Explore hooks
│   └── map/                     # Map-based class discovery
├── navigation/                  # Navigation structure
│   ├── index.tsx                # Root navigation with auth guard
│   └── screens/                 # All screen components
│       ├── HomeScreen.tsx       # Main home with bookings/classes
│       ├── ExploreScreen.tsx    # Business and class discovery
│       ├── BookingsScreen.tsx   # Complete booking management
│       ├── MapScreen.tsx        # Interactive map for discovery
│       ├── BuyCreditsScreen.tsx # One-time credit purchases
│       ├── SubscriptionScreen.tsx # Dynamic subscription management
│       ├── PaymentSuccessScreen.tsx # Post-payment confirmation
│       ├── ProfileScreen.tsx    # User profile
│       └── SettingsScreen.tsx   # Settings and preferences
├── stores/                      # State management
│   ├── auth-store.ts            # Authentication state with Zustand
│   └── explore-filters-store.ts # Explore filters state
├── hooks/                       # Custom React hooks
│   ├── use-class-instances.ts   # Class instances hook
│   ├── use-venues.ts            # Venues hook
│   └── useBusinessReviews.ts    # Reviews hook
├── i18n/                        # Internationalization setup
├── locales/                     # Translation files (en/el/lt)
├── utils/                       # Utility functions
│   ├── cancellationUtils.ts     # Cancellation logic
│   ├── location.ts              # Location utilities
│   └── storage.ts               # Storage utilities
└── theme.ts                     # Theme configuration
```

### apps/web-business/src/

```
src/
├── main.tsx                     # App entry point with providers
├── routeTree.gen.ts            # Auto-generated TanStack Router routes
├── components/                  # Reusable UI components
│   ├── auth/                    # Authentication components
│   │   ├── sign-in-with-github.tsx    # GitHub OAuth integration
│   │   ├── sign-in-otp-form.tsx       # Email/phone OTP verification
│   │   └── code-input.tsx             # Accessible OTP input
│   ├── layout/                  # Application shell components
│   │   ├── app-layout.tsx      # Main layout with sidebar/header
│   │   ├── app-sidebar.tsx     # Responsive navigation sidebar
│   │   └── header.tsx          # Application header with user controls
│   ├── stores/                 # Client state management
│   │   └── auth.ts             # Zustand auth store
│   └── ui/                     # shadcn/ui component library
├── features/                    # Domain-specific feature modules
│   ├── dashboard/               # Business analytics and onboarding
│   │   ├── components/         # Dashboard components
│   │   └── hooks/               # Dashboard hooks
│   ├── calendar/                # FullCalendar class scheduling
│   │   ├── components/         # Calendar components
│   │   ├── hooks/               # Calendar hooks
│   │   └── utils/                # Calendar utilities
│   ├── bookings/               # Customer booking management
│   │   ├── components/          # Booking components
│   │   └── hooks/               # Booking hooks
│   ├── earnings/               # Revenue dashboard and hooks
│   ├── venues/                 # Venue/location management
│   ├── templates/               # Class template management
│   └── settings/                # Application configuration
├── routes/                      # File-based routing structure
│   ├── __root.tsx              # Root layout with error boundaries
│   ├── _app-layout.tsx         # Protected app shell
│   └── _app-layout/            # Protected app routes
│       ├── dashboard.tsx       # Business dashboard
│       ├── calendar.tsx         # Class scheduling calendar
│       ├── bookings.tsx         # Booking management
│       ├── earnings.tsx         # Revenue dashboard with CSV export
│       ├── settings.tsx         # Settings with tabbed interface
│       └── templates.tsx        # Class template management
├── hooks/                       # Custom React hooks
├── lib/                         # Utility libraries
│   ├── timezone-utils.ts        # Business timezone conversions
│   └── i18n.ts                  # Internationalization (EN, EL, LT)
└── utils/                       # Utility functions
```

### apps/web-consumer/src/

```
src/
├── main.tsx                     # App entry point
├── routeTree.gen.ts            # Auto-generated TanStack Router routes
├── components/                  # Reusable UI components
│   ├── auth/                    # Authentication components
│   │   ├── sign-in-with-github.tsx
│   │   ├── sign-in-otp-form.tsx
│   │   └── code-input.tsx
│   ├── sign-in-dialog.tsx       # Sign-in dialog
│   └── ui/                      # shadcn/ui component library
├── features/                    # Domain-specific features
│   └── booking/                 # Booking feature
│       ├── components/          # Booking components
│       ├── hooks/               # Booking hooks
│       └── pages/               # Booking pages
├── routes/                      # File-based routing
│   ├── __root.tsx              # Root layout
│   ├── _auth.tsx               # Auth layout
│   ├── _auth.dashboard.tsx     # Auth dashboard
│   ├── index.tsx               # Home page
│   ├── sign-in.tsx             # Sign-in page
│   └── about.tsx               # About page
├── hooks/                       # Custom React hooks
├── lib/                         # Utility libraries
│   ├── i18n.ts                  # Internationalization
│   └── utils.ts                 # Utilities
└── index.css                    # Global styles
```

### apps/web-landing/app/

```
app/
├── root.tsx                     # Root component
├── entry.server.tsx            # Server entry point
├── routes.ts                   # Route configuration
├── routes/                     # Remix routes
│   ├── home.tsx                # Home page
│   ├── aboutUs.tsx             # About page
│   ├── howItWorks.tsx          # How it works page
│   ├── partners.tsx            # Partners page
│   ├── careers.tsx             # Careers page
│   └── api/                    # API routes
│       ├── createNotionPageToDB.ts
│       └── createNotionPageToPartnerDB.ts
├── components/                 # Components
│   ├── elements/               # Page elements
│   │   ├── navbar.tsx         # Navigation bar
│   │   ├── footer.tsx          # Footer
│   │   ├── followUsSection.tsx
│   │   ├── foundingMemberSection.tsx
│   │   └── waitingListSection.tsx
│   ├── layout.tsx              # Layout component
│   └── ui/                     # shadcn/ui components
├── contexts/                   # React contexts
│   └── LanguageContext.tsx     # Language context
├── locales/                    # Translation files (en/el)
├── lib/                        # Utility libraries
│   └── utils.ts                # Utilities
├── styles/                     # Global styles
│   └── globals.css
└── analytics/                  # Analytics
    └── AnalyticsProvider.tsx
```

### packages/api/

```
packages/api/
├── convex/                     # Convex backend functions
│   ├── schema.ts               # Complete database schema
│   ├── auth.config.ts          # Authentication configuration
│   ├── auth.ts                 # Auth callbacks
│   ├── http.ts                 # HTTP endpoints and webhooks
│   ├── queries/                # Query functions
│   │   ├── bookings.ts         # Booking queries
│   │   ├── classInstances.ts   # Class instance queries
│   │   ├── classTemplates.ts  # Template queries
│   │   ├── venues.ts           # Venue queries
│   │   ├── credits.ts          # Credit queries
│   │   ├── earnings.ts        # Earnings queries
│   │   └── core.ts             # Core queries
│   ├── mutations/              # Mutation functions
│   │   ├── bookings.ts         # Booking mutations
│   │   ├── classInstances.ts   # Instance mutations
│   │   ├── classTemplates.ts   # Template mutations
│   │   ├── venues.ts           # Venue mutations
│   │   ├── credits.ts          # Credit mutations
│   │   └── payments.ts         # Payment mutations
│   ├── actions/                # Action functions (external APIs)
│   │   ├── payments.ts         # Stripe integration
│   │   └── email.ts             # Email sending
│   ├── triggers/               # Database triggers
│   └── utils.ts                # Convex utilities
├── operations/                 # Pure business logic
│   ├── pricing.ts              # Dynamic pricing with discount hierarchy
│   ├── classInstance.ts        # Class scheduling operations
│   ├── payments.ts             # Stripe integration and credit pricing
│   ├── venue.ts                # Venue management operations
│   └── business.ts              # Business entity operations
├── services/                   # Service layer integrating operations
│   ├── bookingService.ts       # Complete booking management
│   ├── creditService.ts        # Credit system with expiration
│   ├── paymentsService.ts      # Stripe integration service
│   ├── venueService.ts         # Venue management service
│   └── classInstanceService.ts # Class instance service
├── rules/                      # Pure business rules
│   ├── booking.ts              # Booking rules (limits, cancellation)
│   ├── classInstance.ts        # Class instance rules
│   └── venue.ts                # Venue rules
├── validations/                # Input validation helpers
│   ├── class.ts                # Class-related field validation
│   ├── venue.ts                # Venue field validation
│   └── core.ts                 # Common validation utilities
├── types/                      # TypeScript type definitions
│   ├── booking.ts              # Booking system types
│   ├── credit.ts               # Credit system types
│   ├── classInstance.ts        # Class instance types
│   ├── classTemplate.ts        # Template types
│   └── venue.ts                # Venue types
├── utils/                      # Utility functions
│   ├── errorCodes.ts           # Centralized error codes
│   ├── logger.ts               # Logging utilities
│   └── deep-linking.ts         # Deep linking utilities
└── integrationTests/          # End-to-end workflow testing
    ├── booking.integration.test.ts
    ├── credit.integration.test.ts
    └── payment.integration.test.ts
```

## Critical Patterns

**Payment Safety**: Credits allocated only AFTER payment confirmation via webhook. Never pre-allocate credits.

**Timezone Handling**: All times displayed in `Europe/Athens` timezone regardless of user location. Database stores UTC, converts for display.

**Real-time Patterns**: Use Convex subscriptions for live data. Avoid stale reads. Check existing hooks for patterns.

**Business Rules**: See `.cursor/rules/business-rules.mdc` for complete domain logic reference.

**Code Organization**:
- Pure functions in `rules/` and `operations/` (no context dependencies)
- Service layer for database operations and external calls
- Convex layer (queries/mutations/actions) stays thin, delegates to services

## Detailed Guides

Detailed guides are available in `.cursor/rules/` files and auto-load based on file context:

- **Mobile Consumer App**: `.cursor/rules/mobile-consumer.mdc` (auto-loads for `apps/mobile-consumer/**`)
- **Web Business Dashboard**: `.cursor/rules/web-business.mdc` (auto-loads for `apps/web-business/**`)
- **Backend API**: `.cursor/rules/backend-api.mdc` (auto-loads for `packages/api/**`)
- **Business Rules**: `.cursor/rules/business-rules.mdc` (requestable)
- **Quick Reference**: `.cursor/rules/quick-reference.mdc` (requestable)
- **Other guides**: See `.cursor/rules/` directory for patterns, testing, forms, etc.

These files contain detailed tech stacks, feature descriptions, component patterns, and development workflows.
