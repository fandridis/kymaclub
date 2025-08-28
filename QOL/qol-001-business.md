# QOL-001: Business Logic Analysis - Top 5 Critical Components

**Analysis Date:** 2024-08-28  
**Analyst:** Business Logic Expert (Claude)  
**Scope:** Complete platform architecture analysis based on CLAUDE.md and all START_HERE.md files

## Executive Summary

After comprehensive analysis of the multi-tenant class booking platform, these are the **5 most business-critical components** ranked by impact on revenue, user experience, and system integrity. Each component represents a potential single point of failure that could significantly damage business operations.

---

## 🏆 Top 5 Most Important Business Components

### 1. **Credit System & Payment Processing** 💰
**Revenue Engine - HIGHEST BUSINESS IMPACT**

- **Location**: `packages/api/operations/payments.ts`, `services/paymentsService.ts`
- **Business Criticality**: Direct revenue impact - any bugs cause immediate financial losses
- **Key Components**:
  - **Double-entry ledger system** (`CR-002`) - Financial transaction integrity
  - **Webhook-driven credit allocation** (`CR-004`) - Payment safety (Stripe `checkout.session.completed`)
  - **5-tier subscription pricing** (`CR-006`) - Volume discounts (0%, 3%, 5%, 7%, 10%)
  - **Credit conversion ratio** (`CR-005`) - 1 credit = 50 cents spending value
  - **8 predefined credit packs** (`CR-007`) - One-time purchases (10-500 credits)
- **Risk Areas**: Payment webhook failures, duplicate transactions, incorrect pricing calculations
- **Dependencies**: Stripe API, Convex mutations, credit expiration system

### 2. **Booking System** 📅
**Core Transaction Flow - REVENUE GENERATOR**

- **Location**: `services/bookingService.ts`, `integrationTests/booking.*.test.ts`
- **Business Criticality**: Primary revenue-generating transaction - booking failures = lost sales
- **Key Components**:
  - **Real-time availability** (`BK-001`) - Capacity management with waitlist overflow
  - **Cancellation window policies** (`BK-002`) - Automated refund calculations
  - **Discount application** (`PR-001`) - Instance > template discount hierarchy
  - **Free class handling** - Special logic when final price = 0 after discounts
  - **Status propagation** (`BK-003`) - Real-time booking confirmations
- **Risk Areas**: Double-booking, incorrect refund calculations, capacity race conditions
- **Dependencies**: Credit system, class scheduling, notification system

### 3. **Class Scheduling System** 🕐
**Booking Foundation - OPERATIONAL BACKBONE**

- **Location**: `operations/classInstance.ts`, `operations/classTemplate.ts`
- **Business Criticality**: Enables all bookings - scheduling bugs break entire customer experience
- **Key Components**:
  - **Template-instance architecture** (`TM-001`) - Master records with override capability
  - **Time calculation rules** (`CS-003`) - `endTime = startTime + (duration * 60 * 1000)`
  - **Historical snapshots** (`DI-001`) - Template/venue data preservation for audit
  - **Bulk operations** - Multiple instance creation with validation limits
  - **Business timezone priority** - All scheduling based on business local time
- **Risk Areas**: Time calculation errors, snapshot inconsistencies, bulk operation failures
- **Dependencies**: Venue management, pricing system, calendar integrations

### 4. **Multi-tenant Data Architecture** 🏢
**Business Isolation - SCALABILITY FOUNDATION**

- **Location**: Throughout schema, operations with `businessId` scoping
- **Business Criticality**: Data breaches between businesses = existential threat to platform
- **Key Components**:
  - **Business data isolation** (`VM-003`) - All entities scoped by `businessId`
  - **Audit trail system** (`DI-004`) - `createdAt/By`, `updatedAt/By`, soft deletes
  - **Cross-business validation** - Prevents accidental data exposure
  - **Role-based permissions** - Owner/admin/staff access controls
  - **Data integrity constraints** - Foreign key relationships with business scoping
- **Risk Areas**: Cross-business data leaks, permission escalation, audit trail gaps
- **Dependencies**: Authentication system, business management, all data operations

### 5. **Real-time Synchronization** 🔄
**Competitive Advantage - USER EXPERIENCE**

- **Location**: Convex subscriptions across all frontend applications
- **Business Criticality**: Core differentiator - real-time updates drive customer satisfaction
- **Key Components**:
  - **Live booking availability** - Instant capacity updates across all clients
  - **Calendar synchronization** - Real-time class schedule changes
  - **Credit balance updates** - Immediate balance display after transactions
  - **Cross-platform consistency** - Business dashboard, consumer web, mobile app
  - **Optimistic UI updates** - Fast perceived performance with conflict resolution
- **Risk Areas**: Subscription memory leaks, stale data states, network partition handling
- **Dependencies**: Convex backend, all frontend applications, network infrastructure

---

## Business Impact Analysis

### **Revenue Protection Priority**
1. **Credit System** - Direct revenue impact, financial safety
2. **Booking System** - Primary transaction flow, customer conversion
3. **Class Scheduling** - Enables all revenue-generating activities

### **Customer Experience Priority**
1. **Real-time Sync** - Modern user expectations, competitive advantage
2. **Booking System** - Smooth transaction experience
3. **Class Scheduling** - Accurate, reliable scheduling information

### **Technical Foundation Priority**
1. **Multi-tenant Architecture** - Platform scalability and security
2. **Real-time Sync** - Modern application architecture
3. **Credit System** - Financial data integrity

---

## Critical Business Rules Cross-Reference

### **Pricing & Credits**
- `PR-001`: Dynamic discount hierarchy (early bird 10% > capacity 5%)
- `CR-005`: Credit conversion (1 credit = 50 cents spending value)
- `CR-006`: 5-tier subscription discounts (0% → 10% max)

### **Scheduling & Bookings**
- `CS-001`: Time update rule (endTime requires startTime - ADR-001)
- `BK-001`: Capacity management (bookedCount ≤ capacity, waitlist overflow)
- `DI-001`: Historical snapshots (template/venue data preservation)

### **Data Integrity**
- `DI-004`: Audit trail requirements (createdAt/By, updatedAt/By)
- `VM-003`: Multi-tenant isolation (businessId scoping)
- `EH-001`: Centralized error codes (no hardcoded strings)

---

## Recommendation for AI Agent Analysis

Each specialized AI agent should focus their QOL analysis on these components:

1. **Frontend Engineers**: How real-time sync, booking flows, and scheduling UX can be improved
2. **Backend Engineers**: How credit safety, data integrity, and multi-tenancy can be strengthened  
3. **QA Engineers**: How testing coverage for these critical paths can be enhanced

**Priority**: Any QOL improvements should prioritize these 5 components over feature enhancements, as they represent the highest business risk/reward areas.

---

*This analysis forms the foundation for all subsequent QOL improvements. Focus engineering efforts on these components for maximum business impact.*