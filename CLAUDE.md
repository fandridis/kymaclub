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
  - **`components/recent-activity.tsx`**: Real-time activity feed component. Exports: `RecentActivity`.
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
- **`src/navigation/`**: React Navigation setup with screen routing.
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
- **`src/features/bookings/`**: Booking-related features (structure exists).
- **`src/features/map/`**: Map and location features (structure exists).
- **`src/stores/auth-store.ts`**: Authentication state management. Exports: auth store utilities.
- **`maestro-tests/`**: Maestro test automation for mobile flows.

### Packages (`packages/`)

Shared libraries, utilities, and configurations used across all applications.

#### **`packages/api/`** - Convex Backend API
Convex backend API providing real-time database and serverless functions.

**Tech Stack**: Convex, TypeScript, Vitest, @convex-dev/auth

**Core Files:**
- **`setup.mjs`**: Automated development environment setup script.
- **`vitest.config.mts`**: Vitest testing configuration for backend tests.

**Convex Backend (`convex/`):**
- **`schema.ts`**: Complete database schema with multi-tenant architecture. Key entities: users, businesses, venues, classTemplates, classInstances, bookings, customers.
- **`auth.config.ts`**: Authentication configuration with GitHub OAuth and email/OTP.
- **`http.ts`**: HTTP endpoints for webhooks and external integrations.

**Core System (`convex/core/`):**
- **`helpers.ts`**: Common database and validation utilities. Exports: `createAuthenticatedMutation`, `throwIfError`.
- **`domain/errorCodes.ts`**: Centralized error code constants. Exports: `ERROR_CODES`.
- **`mutations.ts`**: Core business operations. Exports: `createBusiness`, `createBusinessWithVenue`, `updateBusinessSocial`, `updateBusinessDetails`, `updateCurrentUserProfile`.
- **`mutationHandlers.ts`**: Pure business logic handlers for core operations.
- **`queries.ts`**: Core data fetching operations.
- **`utils.ts`**: Core authentication and utility functions.

**Class Management (`convex/classes/`):**

- **`templates/`**: Class template management for recurring class types.
  - **`mutations.ts`**: Template CRUD operations. Exports: `createTemplate`, `updateTemplate`, `deleteTemplate`.
  - **`mutationHandlers.ts`**: Pure business logic handlers for template operations.
  - **`queries.ts`**: Template data fetching. Exports: `getTemplates`, `getTemplateById`.
  - **`domain/operations.ts`**: Template business rule validation. Exports: `prepareCreateTemplate`.
  - **`domain/validations.ts`**: Template field validation. Exports: `validateName`, `validateCapacity`.
  - **`domain/rules.ts`**: Template business rules. Exports: `areTemplatesSimilar`.

- **`instances/`**: Individual class instance management.
  - **`mutations.ts`**: Instance CRUD operations. Exports: `createInstance`, `updateInstance`.
  - **`queries.ts`**: Instance queries with calendar integration. Exports: `getInstances`.
  - **`domain/operations.ts`**: Instance generation and pattern matching. Exports: `generateInstanceTimes`.

**Venue Management (`convex/venues/`):**
- **`mutations.ts`**: Venue CRUD operations. Exports: `createVenue`, `updateVenue`.
- **`queries.ts`**: Venue data fetching. Exports: `getVenues`, `getVenueById`.
- **`domain/operations.ts`**: Venue business logic. Exports: `prepareCreateVenue`.

**Upload Management (`convex/uploads/`):**
- **`mutations.ts`**: File upload operations. Exports: `generateUploadUrl`, `addVenueImage`, `removeVenueImage`, `addTemplateImage`, `removeTemplateImage`.
- **`queries.ts`**: Upload-related queries and file access operations.
- **`uploads.integration.test.ts`**: Integration tests for upload functionality.

**Credit System (`convex/credits/`):**
- **`mutations.ts`**: Credit purchase and booking operations. Exports: `buyCreditsTest`, `bookClassTest`.
- **`mutationHelpers.ts`**: Credit ledger and transaction helpers. Exports: `recordCreditPurchase`, `recordBookingLedgerEntries`, `reconcileUserCredits`.
- **`utils.ts`**: Credit system utilities and exports.
- **`domain/idempotency.ts`**: Idempotency key generation for transaction safety.
- **`domain/utils.ts`**: Core credit calculation utilities. Exports: `calculateTransactionFee`.
- **`expiration.ts`**: Credit expiration handling logic.
- **`payouts.ts`**: Business payout processing functionality.

**Booking System (`convex/bookings/`):**
- **`mutations.ts`**: Booking operations and class reservations. Exports: `bookClassTest`.
- **`domain/`**: Booking business logic and validation rules.

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
- **Frontend**: Playwright E2E tests for critical user journeys in `apps/web-business/tests`
- **Testing Strategy**: E2E focus (not component testing) - business logic tested in backend, UI tested end-to-end
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
- API functions organized by domain: `/convex/bookings/`, `/convex/classes/`, `/convex/venues/`, etc.
- Schema in `packages/api/convex/schema.ts` with audit fields (`createdAt`, `createdBy`, `updatedAt`, `updatedBy`) and soft deletes (`deleted`, `deletedAt`, `deletedBy`)
- Follow Convex best practices from `packages/api/.cursor/rules/convex_rules.mdc`

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
- **Deployment**: Cloudflare Workers with wrangler
- **Monorepo**: Turborepo with pnpm workspaces
- **Code Quality**: ESLint 9, TypeScript 5.8, Prettier

### Data Model Highlights
- Multi-tenant with `businessId` on all entities
- Class system: `classTemplates` → `classInstances` (generated from templates)
- Booking flow: `users` → `bookings` → `classInstances` (customer table deprecated in favor of direct user credits)
- Credit System: Double-entry ledger with `creditLedger`, `creditTransactions`, and `businessPayouts` tables
- Scheduling: Uses rrule for recurrence, timezone-aware with date-fns-tz
- Venue Management: Categorized venues with `primaryCategory` field and image storage support
- Pricing: Dynamic pricing rules, credit system with expiration, discount templates
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
- Follow the **Handler-Based Architecture Pattern** for all new API endpoints:
  - **Mutations**: `mutations.ts` exports arg schemas and thin wrapper functions
  - **Handlers**: `mutationHandlers.ts` contains pure business logic functions  
  - **Validations**: `validations.ts` has field validation and authorization helpers
  - **Queries**: `queries.ts` exports arg schemas and thin wrapper functions
  - **Query Handlers**: `queryHandlers.ts` contains data fetching logic
  - Use centralized `ERROR_CODES` from `core/errorCodes.ts` for consistent error handling
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

### Domain Architecture 
- Pure business logic separated in domain-specific folders within API endpoints (e.g., `classes/templates/domain/`)
- Use cases return command objects rather than executing side effects (e.g., `prepareCreateBooking()`)
- Domain functions are pure and testable with no external dependencies
- Business rules implement complex pricing, cancellation policies, and booking validation
- Handler-based architecture separates API concerns from business logic

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

## Handler-Based Architecture Pattern

The codebase follows a sophisticated handler-based architecture for API endpoints that separates concerns and improves testability. **All new API endpoints must follow this pattern**:

### File Structure (Example: `classes/templates/`)
```
templates/
├── mutations.ts          # Argument schemas & thin mutation wrappers
├── mutationHandlers.ts   # Pure business logic handlers  
├── mutationHelpers.ts    # Reusable mutation utilities
├── queries.ts           # Argument schemas & thin query wrappers
├── queryHandlers.ts     # Data fetching logic
├── validations.ts       # Field validation & authorization
└── utils.ts            # Domain-specific utilities
```

### Key Principles:

#### 1. **Mutations Structure**
- Export argument schemas using Convex validators: `v.object({})`
- Export TypeScript types: `export type CreateArgsType = Infer<typeof createArgs>`
- Thin wrapper functions that validate auth and delegate to handlers
- Use `createAuthenticatedMutation()` helper for consistent auth handling

#### 2. **Handlers (Business Logic)**
- Pure functions that take `(args, ctx, auth)` parameters
- Contain all business logic, validation calls, and database operations
- Use structured error handling with `ConvexError` and `ERROR_CODES`
- Return consistent result objects (e.g., `{ createdTemplateId }`)

#### 3. **Validations**
- Field-specific validation functions (e.g., `validateName`, `validateCapacity`)
- Main validation functions (e.g., `validateCreateTemplate`) 
- Authorization helpers (e.g., `ensureCanUpdateTemplate`)
- **Critical**: Always use `ERROR_CODES` constants, never hardcoded strings

#### 4. **Error Handling**
- Use centralized `ERROR_CODES` from `core/errorCodes.ts`
- Structured errors: `ConvexError({ message, field, code })`
- Field-specific error attribution for better UX
- Consistent error messages across the application

#### 5. **Type Safety**
- Export argument types using `Infer<typeof schema>` pattern
- Strong typing for handler functions and parameters
- `AuthContext` interface for authenticated handlers

### Example Implementation:
```typescript
// mutations.ts - Argument schema & thin wrapper
export const createTemplateArgs = v.object({
  template: v.object({ name: v.string(), ... })  
});
export type CreateTemplateArgs = Infer<typeof createTemplateArgs>;

export const createTemplate = mutation({
  args: createTemplateArgs,
  handler: createAuthenticatedMutation(createTemplateHandler)
});

// mutationHandlers.ts - Pure business logic
export async function createTemplateHandler(
  args: CreateTemplateArgs,
  ctx: MutationCtx, 
  auth: AuthContext
) {
  const { cleanTemplate } = validateCreateTemplate(args.template);
  const templateId = await ctx.db.insert("templates", {
    ...cleanTemplate,
    businessId: auth.business._id,
    createdBy: auth.user._id,
    createdAt: Date.now(),
  });
  return { createdTemplateId: templateId };
}
```

This pattern ensures consistent error handling, better testability, and clear separation of concerns throughout the API.

## Key Architecture Patterns

### Handler-Based Architecture
All API endpoints follow a consistent pattern:
- **`mutations.ts`**: Argument schemas and thin wrapper functions  
- **`mutationHandlers.ts`**: Pure business logic handlers
- **`validations.ts`**: Field validation and authorization helpers
- **`domain/operations.ts`**: Complex business operations and rule preparation
- **`domain/rules.ts`**: Business rule validation and logic
- Centralized error handling with `ERROR_CODES` constants

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

### Feature-Based Organization
- Each major feature (dashboard, calendar, venues, templates) has its own directory
- Components, hooks, and utilities co-located within feature directories
- Domain-driven design with separate business logic modules
- Clear separation between UI components and business logic

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
- Handler-based architecture for maintainable API endpoints

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

### Key Features
- **Real-time Balance Updates**: User and business credit balances updated atomically
- **Audit Trail**: Complete transaction history with external references
- **Fee Management**: Dynamic transaction fee calculation based on business settings
- **Credit Value Tracking**: Each credit purchase includes value (€2 per credit default)

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

# important-instruction-reminders
Do what has been asked; nothing more, nothing less.
NEVER create files unless they're absolutely necessary for achieving your goal.
ALWAYS prefer editing an existing file to creating a new one.
NEVER proactively create documentation files (*.md) or README files. Only create documentation files if explicitly requested by the User.