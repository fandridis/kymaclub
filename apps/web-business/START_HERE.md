# 💼 Web Business Dashboard - START HERE

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
│   ├── venues/                # Venue/location management
│   ├── templates/             # Class template management
│   └── settings/              # Application configuration
├── routes/                    # File-based routing structure
│   ├── __root.tsx            # Root layout with error boundaries
│   ├── _app-layout.tsx       # Protected app shell
│   └── _app-layout/          # Protected app routes
│       ├── dashboard.tsx     # Business dashboard
│       ├── calendar.tsx      # Class scheduling calendar
│       ├── bookings.tsx      # Booking management
│       ├── settings.tsx      # Settings with tabbed interface
│       └── templates.tsx     # Class template management
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

### **1. Read Business Context First**
Always read `packages/api/START_HERE.md` before implementing features. Contains 75+ business rules with code references and complete backend architecture.

### **2. Use Established Form Patterns**
- **React Hook Form + Zod** - Never use explicit generic types
- **Field validation** with proper error attribution
- **Loading states** and optimistic updates

### **3. Follow Calendar Integration Patterns**
- **Check existing calendar components** for drag-drop, resize, and event handling
- **Use business timezone** for all time calculations
- **Include color field** in database queries (common oversight)

### **4. Maintain Real-time Consistency**
- **Use Convex subscriptions** for all business data
- **Handle loading states** properly
- **Implement optimistic updates** where appropriate

### **5. Component Development**
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

## 🔗 Related Documentation

- **`packages/api/START_HERE.md`** - Essential business rules, constraints, and backend architecture
- **`packages/api/operations/`** - Backend business logic with comprehensive JSDoc and ADRs
- **Root `CLAUDE.md`** - Project architecture and AI agent workflow

**Remember**: This is the primary business management interface. Focus on reliability, data consistency, and user experience. Always test calendar operations, form submissions, and real-time updates thoroughly.