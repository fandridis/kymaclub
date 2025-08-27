# 🌐 Web Consumer App - START HERE

**Before working on this consumer booking app, AI agents must read this guide for essential context.**

## 🚀 Quick Start

This is the **React web application** where customers discover classes, make bookings, and manage their accounts. Built for mobile-first responsive design with desktop support.

## 🛠 Tech Stack & Key Libraries

### **Core Framework**
- **React 19** + **TypeScript 5.8** - Latest stable versions with strict typing
- **Vite 7.0** - Lightning-fast development and building
- **Cloudflare Workers** - Edge deployment with global performance

### **Routing & State**
- **@tanstack/react-router** - Type-safe file-based routing with devtools
- **URL-based state** - Shareable links for class discovery and booking flows

### **Backend Integration**
- **Convex 1.23** - Real-time backend with live subscriptions  
- **@convex-dev/auth** - Authentication with multiple sign-in options
- **@repo/api** + **@repo/utils** - Shared backend types and utilities

### **UI Framework & Components**
- **Tailwind CSS 4.x** - Utility-first styling optimized for mobile
- **shadcn/ui** subset - Essential components for consumer interface
- **Radix UI Primitives** - Accessible, touch-friendly components
- **next-themes** - Light/dark theme support
- **vaul** - Native mobile drawer components

### **Essential UI Libraries**  
- **lucide-react** - Consistent icon system
- **sonner** - Toast notifications for booking confirmations
- **cmdk** - Search and command components
- **class-variance-authority** - Component styling variants

### **Internationalization**
- **i18next** + **react-i18next** - Multi-language support
- **i18next-browser-languagedetector** - Automatic language detection
- **i18next-http-backend** - Dynamic translation loading

### **Development & Deployment**
- **ESLint 9** + **TypeScript ESLint** - Code quality
- **Wrangler 4.24** - Cloudflare Workers deployment

## 📁 Folder Structure

```
src/
├── main.tsx                   # App entry point with providers
├── routeTree.gen.ts          # Auto-generated TanStack Router routes
├── components/               # Reusable consumer UI components
│   ├── ui/                  # shadcn/ui component library subset
│   ├── booking/             # Booking-related components
│   ├── class/               # Class discovery and display
│   └── auth/                # Customer authentication
├── features/                 # Consumer-specific features
│   ├── discover/            # Class and business discovery
│   ├── booking/             # Booking workflow and management
│   ├── profile/             # Customer profile and settings
│   └── auth/                # Authentication flows
├── routes/                   # File-based routing structure
│   ├── __root.tsx          # Root layout with error boundaries
│   ├── index.tsx           # Landing/discover page
│   ├── classes/            # Class-related routes
│   ├── bookings/           # Booking management routes
│   └── profile/            # Customer profile routes
├── hooks/                    # Custom React hooks
├── lib/                     # Utility libraries  
└── styles/                  # Global styles and theme
```

## 🎯 Key Features & User Flows

### **Class Discovery**
- **Browse classes** - Filter by date, location, category, business
- **Search functionality** - Find classes by name, instructor, or type
- **Business profiles** - Discover venues and their offerings
- **Map integration** - Location-based class discovery (future feature)

### **Booking Management**
- **Real-time booking** - Instant confirmation with live availability
- **Booking history** - View past and upcoming bookings
- **Cancellation system** - Cancel bookings within policy windows
- **Waitlist joining** - Join waitlists for full classes

### **Authentication & Profile**
- **Multiple sign-in options** - Email, phone, social authentication
- **Customer profile** - Manage personal information and preferences
- **Booking preferences** - Set default filters and notification settings
- **Credit management** - View balance, purchase history (if implemented)

### **Responsive Design**
- **Mobile-first** - Optimized touch interactions and layouts
- **Progressive Web App** features - Fast loading and offline capabilities
- **Cross-device sync** - Seamless experience across mobile and desktop

## 🏗️ Architecture Patterns

### **Real-time Updates**
Consumer app uses **Convex subscriptions** for live booking availability:
```typescript
const classes = useQuery(api.classes.getAvailableClasses, { 
  date: selectedDate,
  location: userLocation 
});
// Automatically updates when availability changes
```

### **Mobile-First Design**
- **Touch-optimized** components with proper touch targets
- **Drawer interfaces** using vaul for mobile-native interactions
- **Responsive breakpoints** with mobile, tablet, and desktop layouts
- **Fast loading** with code splitting and lazy loading

### **State Management**
- **Server state**: Convex subscriptions for real-time class data
- **URL state**: Route-based state for shareable discovery links
- **Local state**: Component-level state for UI interactions
- **Minimal client state**: Focus on server-driven data

## 🌍 Customer Experience Priorities

### **Performance First**
- **Sub-second loading** with Cloudflare edge deployment
- **Optimistic UI updates** for booking confirmations  
- **Progressive enhancement** with JavaScript for enhanced experience
- **Image optimization** for class and venue photos

### **Accessibility & Usability**
- **Keyboard navigation** support throughout the app
- **Screen reader optimization** with proper ARIA labels
- **High contrast** color schemes for visibility
- **Large touch targets** for mobile interaction

### **Discovery & Conversion**
- **Intuitive navigation** with clear paths to booking
- **Social proof** through reviews and popularity indicators
- **Urgency indicators** showing limited availability
- **Seamless checkout** with minimal friction

## 🔗 Integration Points

### **Backend Connection**
- **Real-time subscriptions** for class availability and booking status
- **Authentication** via @convex-dev/auth with consumer-friendly flows
- **Shared types** from @repo/api for data consistency
- **Booking operations** with proper error handling and retry logic

### **Payment Integration**
- **Redirect-based payments** via Stripe (if credits not implemented)
- **Payment status tracking** with success/failure handling
- **Credit balance display** if credit system is implemented

### **Notification System**
- **Booking confirmations** via toast notifications
- **Email confirmations** for successful bookings (backend-triggered)
- **Push notifications** for class reminders (future mobile PWA feature)

## 🚨 Critical Patterns for AI Agents

### **1. Mobile-First Development**
Always design for mobile first, then enhance for desktop. Touch targets should be minimum 44px.

### **2. Real-time Data Handling**  
Use Convex subscriptions for class availability. Handle loading states and network errors gracefully.

### **3. Booking Flow Optimization**
Minimize steps in booking flow. Implement optimistic updates and clear error recovery.

### **4. Accessibility Standards**
Follow WCAG 2.1 AA guidelines. Test with keyboard navigation and screen readers.

### **5. Performance Monitoring**
Monitor Core Web Vitals. Implement lazy loading for images and non-critical components.

## 📋 Common Development Tasks

### **Adding Discovery Features**
1. Check existing discovery patterns in `features/discover/`
2. Use real-time subscriptions for live data
3. Implement proper loading and empty states
4. Add responsive design for all screen sizes

### **Enhancing Booking Flow**
1. Follow existing booking patterns in `features/booking/`
2. Implement optimistic UI updates
3. Add proper error handling and retry logic
4. Test across different device sizes and orientations

### **Creating Consumer Components**
1. Use mobile-first design principles
2. Follow shadcn/ui patterns for consistency
3. Implement touch-friendly interactions
4. Add proper loading and error states

### **Implementing Search & Filters**
1. Use URL state for shareable discovery links
2. Implement debounced search with real-time results
3. Add filter persistence across sessions
4. Optimize for mobile filter interfaces

## 🧪 Testing & Quality

### **Development Commands**
```bash
# Development
pnpm dev                    # Start dev server with HMR
pnpm build                  # Build for production
pnpm preview               # Preview production build

# Quality
pnpm lint                   # Run ESLint checks

# Deployment  
pnpm deploy                # Build and deploy to Cloudflare Workers
pnpm cf-typegen            # Generate Cloudflare types
```

### **Testing Strategy**
- **Manual testing** across devices and browsers
- **Performance testing** with Lighthouse and Core Web Vitals
- **Accessibility testing** with keyboard navigation and screen readers
- **Cross-browser compatibility** testing

## 🎨 Styling & User Experience

### **Design System**
- **Consistent spacing** using Tailwind's spacing scale
- **Color system** with semantic color variables  
- **Typography** optimized for mobile readability
- **Component variants** for different contexts and states

### **Mobile Optimization**
- **Touch-friendly** buttons and interactive elements
- **Readable typography** with appropriate line heights
- **Optimized images** with responsive loading
- **Fast animations** that don't hinder usability

## 🌐 Internationalization

### **Multi-language Support**
- **Automatic detection** of user's preferred language
- **Dynamic loading** of translation files
- **RTL support** consideration for future languages
- **Cultural adaptation** beyond just text translation

### **Localization Features**
- **Date formatting** based on user locale
- **Number formatting** for prices and quantities
- **Currency display** appropriate to user's region
- **Time zone handling** for class scheduling

## 📱 Progressive Web App Features

### **Performance Optimizations**
- **Code splitting** by route and feature
- **Lazy loading** for images and non-critical components
- **Service worker** caching for static assets
- **Critical CSS** inlining for fast first paint

### **Mobile Experience**
- **Add to home screen** capability
- **Offline functionality** for viewing booked classes
- **Push notifications** for class reminders (future)
- **Native app-like** navigation and interactions

---

## 🔗 Related Documentation

- **`packages/api/START_HERE.md`** - Essential business rules, booking policies, and backend architecture
- **`packages/api/operations/`** - Backend business logic with customer-facing implications
- **Root `CLAUDE.md`** - Project architecture and AI agent workflow

**Remember**: This is the customer-facing application where user experience directly impacts bookings and revenue. Prioritize performance, accessibility, and conversion optimization. Always test on actual mobile devices and across different network conditions.