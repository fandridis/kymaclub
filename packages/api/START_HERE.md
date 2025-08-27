# 🔧 Backend API - START HERE

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
├── START_HERE.md              # This comprehensive backend guide
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

1. [Pricing System](#pricing-system)
2. [Class Scheduling](#class-scheduling)
3. [Credit System](#credit-system)
4. [Booking System](#booking-system)
5. [Data Integrity](#data-integrity)
6. [Template Management](#template-management)
7. [Venue Management](#venue-management)
8. [Validation Rules](#validation-rules)

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
- **Rule**: 1 credit = 50 cents spending value (CREDITS_TO_CENTS_RATIO = 50)
- **Code**: `packages/utils/src/credits.ts:10` (CREDITS_TO_CENTS_RATIO constant)
- **Tests**: All payment tests use this ratio for consistency
- **Business Logic**: Spending value vs. purchase price are separate concepts
- **Example**: Customer pays $0.65 to buy 1 credit worth 50 cents when booking
- **Rationale**: Provides business markup while maintaining simple credit math

### CR-006: Subscription Pricing Tiers (ADR-010)
- **Rule**: 5-tier discount structure: 0% (5-99), 3% (100-199), 5% (200-299), 7% (300-449), 10% (450-500)
- **Code**: `operations/payments.ts:99-127` (calculateSubscriptionPricing)
- **Tests**: `operations/payments.test.ts` (subscription pricing tests)
- **Base Price**: $0.50 per credit before discounts
- **Business Logic**: Volume discounts incentivize larger subscriptions
- **Maximum**: 500 credits per month (increased from 150 to support enterprise users)

### CR-007: One-Time Credit Packs (ADR-011)
- **Rule**: 8 predefined packs: 10, 25, 50, 100, 150, 200, 300, 500 credits
- **Code**: `operations/payments.ts:61-71` (CREDIT_PACKS constant)
- **Tests**: `operations/payments.test.ts` (one-time pricing tests)
- **Base Price**: $0.65 per credit with discount tiers (0%, 2.5%, 5%, 10%, 15%)
- **Minimum**: 10 credits (prevents micro-transactions)
- **Maximum**: 500 credits (reasonable one-time purchase limit)

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

This business rules reference serves as the authoritative guide for understanding all operational logic within the booking platform. AI agents should reference this document first when working with business-critical operations, then drill down to specific code references for implementation details.

For questions about any business rule, always check:
1. This document for business context
2. Referenced code files for implementation
3. Test files for expected behavior and edge cases
4. ADR comments in code for architectural decisions

Last updated: 2024-08-27