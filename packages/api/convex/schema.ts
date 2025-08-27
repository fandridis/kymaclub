import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

/***************************************************************
 * Reusable object fields for all tables
 ***************************************************************/
const softDeleteFields = {
  deleted: v.optional(v.boolean()),
  deletedAt: v.optional(v.union(v.number(), v.null())),
  deletedBy: v.optional(v.union(v.id("users"), v.null())),
};

const auditFields = {
  createdAt: v.number(),
  createdBy: v.id("users"),
  updatedAt: v.optional(v.number()),
  updatedBy: v.optional(v.id("users")),
};

export const classDiscountRuleFields = {
  id: v.string(),
  name: v.string(),
  condition: v.object({
    type: v.union(v.literal("hours_before_min"), v.literal("hours_before_max"), v.literal("always")),
    hours: v.optional(v.number()),
  }),
  discount: v.object({
    type: v.literal("fixed_amount"),
    value: v.number(),
  }),
  createdAt: v.number(),
  createdBy: v.id("users"),
  updatedAt: v.optional(v.number()),
  updatedBy: v.optional(v.id("users")),
};

/***************************************************************
 * Main tables
 ***************************************************************/
export const usersFields = {
  name: v.optional(v.string()),
  image: v.optional(v.string()),
  email: v.optional(v.string()),
  emailVerificationTime: v.optional(v.number()),
  phone: v.optional(v.string()),
  phoneVerificationTime: v.optional(v.number()),
  isAnonymous: v.optional(v.boolean()),
  businessId: v.optional(v.id("businesses")),
  businessRole: v.optional(v.union(v.literal("owner"), v.literal("admin"), v.literal("user"))),
  hasBusinessOnboarded: v.optional(v.boolean()),
  hasConsumerOnboarded: v.optional(v.boolean()),

  role: v.optional(v.union(v.literal("admin"), v.literal("user"))),

  // Simple credit balance for booking classes
  credits: v.optional(v.number()),

  // Consumer profile image
  consumerProfileImageStorageId: v.optional(v.id("_storage")),

  // Stripe customer ID for payments
  stripeCustomerId: v.optional(v.string()),

  ...softDeleteFields,
};

export const businessesFields = {
  name: v.string(),
  description: v.optional(v.string()),
  email: v.string(),
  phone: v.optional(v.string()),
  website: v.optional(v.string()),
  logo: v.optional(v.string()),
  images: v.optional(v.array(v.string())),
  timezone: v.string(),
  currency: v.string(),

  // Address
  address: v.object({
    street: v.string(),
    city: v.string(),
    zipCode: v.string(),
    country: v.string(),
    state: v.optional(v.string()),
  }),

  // Social media
  socialMedia: v.optional(v.object({
    facebook: v.optional(v.string()),
    instagram: v.optional(v.string()),
    twitter: v.optional(v.string()),
    youtube: v.optional(v.string()),
    linkedin: v.optional(v.string()),
  })),

  // Simplified fee structure
  feeStructure: v.object({
    // Monthly payout fee rate for this business (if different from system default)
    baseFeeRate: v.optional(v.number()),
    payoutFrequency: v.union(
      v.literal("weekly"),
      v.literal("monthly"),
      v.literal("bi_monthly")
    ),
    minimumPayout: v.number(),
    payoutMethod: v.optional(v.object({
      type: v.union(v.literal("bank_transfer"), v.literal("paypal"), v.literal("stripe")),
      details: v.string(),
      isVerified: v.boolean(),
    })),
  }),

  // Business status
  isActive: v.boolean(),
  onboardingCompleted: v.boolean(),

  // Business earnings cache (updated from credit ledger)
  unpaidEarnings: v.optional(v.number()), // Total earnings not yet paid out
  lifetimeEarnings: v.optional(v.number()), // All-time earnings from bookings
  totalPayouts: v.optional(v.number()), // Total amount paid out to business
  lastPayoutAt: v.optional(v.number()), // When last payout occurred
  earningsLastUpdated: v.optional(v.number()), // When earnings cache was last updated

  ...auditFields,
  ...softDeleteFields,
};

export const businessInvitationsFields = {
  businessId: v.id("businesses"),
  email: v.string(),
  role: v.union(v.literal("owner"), v.literal("admin"), v.literal("user")),
  token: v.string(), // Unique invitation token
  invitedBy: v.id("users"),
  status: v.union(
    v.literal("pending"),
    v.literal("accepted"),
    v.literal("expired"),
    v.literal("revoked")
  ),
  expiresAt: v.number(),
  acceptedAt: v.optional(v.number()),
  acceptedBy: v.optional(v.id("users")),
  metadata: v.optional(v.object({
    personalMessage: v.optional(v.string()),
    permissions: v.optional(v.array(v.string())),
  })),
  ...auditFields,
  ...softDeleteFields,
};

export const systemSettingsFields = {
  key: v.string(), // "credit_value", "standard_fee_rate", "max_promotional_discount", etc.
  value: v.union(v.string(), v.number(), v.boolean()),
  description: v.string(),
  ...auditFields,
  ...softDeleteFields,
};


export const instructorsFields = {
  businessId: v.id("businesses"),
  name: v.string(),
  email: v.string(),
  bio: v.optional(v.string()),
  specialties: v.optional(v.array(v.string())),
  isActive: v.boolean(),
  ...auditFields,
  ...softDeleteFields,
};

export const venuesFields = {
  businessId: v.id("businesses"),
  name: v.string(),
  description: v.optional(v.string()),
  capacity: v.optional(v.number()),
  email: v.string(),
  phone: v.optional(v.string()),
  website: v.optional(v.string()),
  equipment: v.optional(v.array(v.string())),
  rating: v.optional(v.number()),
  reviewCount: v.optional(v.number()),

  // Primary business category - required field
  primaryCategory: v.union(
    v.literal("yoga_studio"),
    v.literal("fitness_center"),
    v.literal("dance_studio"),
    v.literal("pilates_studio"),
    v.literal("swimming_facility"),
    v.literal("martial_arts_studio"),
    v.literal("climbing_gym"),
    v.literal("crossfit_box"),
    v.literal("wellness_center"),
    v.literal("outdoor_fitness"),
    v.literal("personal_training"),
    v.literal("rehabilitation_center")
  ),

  // Social media
  socialMedia: v.optional(v.object({
    facebook: v.optional(v.string()),
    instagram: v.optional(v.string()),
    twitter: v.optional(v.string()),
    youtube: v.optional(v.string()),
    linkedin: v.optional(v.string()),
  })),

  address: v.object({
    street: v.string(),
    city: v.string(),
    zipCode: v.string(),
    country: v.string(),
    state: v.optional(v.string()),
    latitude: v.optional(v.number()),
    longitude: v.optional(v.number()),
  }),
  amenities: v.optional(v.object({
    showers: v.optional(v.boolean()),
    accessible: v.optional(v.boolean()),
    mats: v.optional(v.boolean()),
  })),
  services: v.optional(v.object({
    yoga: v.optional(v.boolean()),
    pilates: v.optional(v.boolean()),
    gym: v.optional(v.boolean()),
    massage: v.optional(v.boolean()),
    dance: v.optional(v.boolean()),
    crossfit: v.optional(v.boolean()),
    spinning: v.optional(v.boolean()),
    boxing: v.optional(v.boolean()),
    martialArts: v.optional(v.boolean()),
    swimming: v.optional(v.boolean()),
    personalTraining: v.optional(v.boolean()),
    physiotherapy: v.optional(v.boolean()),
    nutrition: v.optional(v.boolean()),
    meditation: v.optional(v.boolean()),
    stretching: v.optional(v.boolean()),
    hiit: v.optional(v.boolean()),
    zumba: v.optional(v.boolean()),
    trx: v.optional(v.boolean()),
  })),

  isActive: v.boolean(),
  imageStorageIds: v.optional(v.array(v.id("_storage"))),
  ...auditFields,
  ...softDeleteFields,
};

export const classTemplatesFields = {
  businessId: v.id("businesses"),
  venueId: v.id("venues"),
  name: v.string(),
  description: v.optional(v.string()),
  instructor: v.string(),

  // Class details
  duration: v.number(), // minutes
  capacity: v.number(),
  allowWaitlist: v.optional(v.boolean()),
  waitlistCapacity: v.optional(v.number()),

  // Booking rules
  price: v.number(), // Price in business currency (100-10000 IN CENTS, no decimals) - currency from business.currency
  bookingWindow: v.optional(v.object({
    minHours: v.number(), // Can't book closer than this
    maxHours: v.number(), // Can't book further than this
  })),
  cancellationWindowHours: v.number(),

  // Flexible discount rules - businesses can define custom early-bird and last-minute discounts
  discountRules: v.optional(v.array(v.object(classDiscountRuleFields))),

  // Template metadata
  isActive: v.boolean(),
  tags: v.optional(v.array(v.string())),
  color: v.optional(v.string()), // For UI display

  // Image URLS
  imageStorageIds: v.optional(v.array(v.id("_storage"))),

  ...auditFields,
  ...softDeleteFields,
};

export const classInstancesFields = {
  businessId: v.id("businesses"),
  templateId: v.id("classTemplates"),
  venueId: v.id("venues"),

  // Scheduling (REQUIRED for every instance)
  startTime: v.number(), // Unix timestamp
  endTime: v.number(),
  timezone: v.string(),

  // Denormalized fields for efficient pattern matching
  timePattern: v.string(), // "15:00-16:00" format for quick time matching
  dayOfWeek: v.number(), // 0-6 (Sunday=0) for day-based queries

  // Overrideable fields from template (if different from template)
  name: v.optional(v.string()),
  description: v.optional(v.string()),
  instructor: v.optional(v.string()),
  capacity: v.optional(v.number()),
  price: v.optional(v.number()), // Price in business currency (100-10000 IN CENTS, no decimals) - currency from business.currency
  bookingWindow: v.optional(v.object({
    minHours: v.number(),
    maxHours: v.number(),
  })),
  cancellationWindowHours: v.optional(v.number()),
  tags: v.optional(v.array(v.string())),
  color: v.optional(v.string()),

  // Instance-specific discount rules (overrides template rules)
  discountRules: v.optional(v.array(v.object(classDiscountRuleFields))),

  // Status and booking tracking
  status: v.union(
    v.literal("scheduled"),
    v.literal("cancelled"),
    v.literal("completed")
  ),
  bookedCount: v.number(),
  waitlistCount: v.optional(v.number()),

  // Template Snapshot
  templateSnapshot: v.object({
    name: v.string(),
    description: v.optional(v.string()),
    instructor: v.string(),
    imageStorageIds: v.optional(v.array(v.id("_storage"))),
    deleted: v.optional(v.boolean()),
  }),

  // Venue Snapshot
  venueSnapshot: v.object({
    name: v.string(),
    address: v.object({
      street: v.string(),
      city: v.string(),
      zipCode: v.string(),
      country: v.string(),
      state: v.optional(v.string()),
      latitude: v.optional(v.number()),
      longitude: v.optional(v.number()),
    }),
    imageStorageIds: v.optional(v.array(v.id("_storage"))),
    deleted: v.optional(v.boolean()),
  }),

  ...auditFields,
  ...softDeleteFields,
};

export const customersFields = {
  businessId: v.id("businesses"),
  email: v.string(),
  name: v.string(),
  phone: v.optional(v.string()),

  // Credit balance - single source of truth
  credits: v.number(), // Available credits (cached from ledger)

  // Customer details
  membershipType: v.optional(v.string()),
  memberSince: v.number(),
  lastVisit: v.optional(v.number()),
  waiverSigned: v.boolean(),
  waiverSignedAt: v.optional(v.number()),
  emergencyContact: v.optional(v.object({
    name: v.string(),
    phone: v.string(),
    relationship: v.string(),
  })),
  medicalNotes: v.optional(v.string()),
  isActive: v.boolean(),
  notes: v.optional(v.string()),
  ...auditFields,
  ...softDeleteFields,
};

export const bookingsFields = {
  businessId: v.id("businesses"),
  userId: v.id("users"),
  classInstanceId: v.id("classInstances"),

  // Denormalized user metadata for business owners to see customer details
  // This field is automatically populated when bookings are created (optional for backward compatibility)
  userSnapshot: v.object({
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
  }),

  // Denormalized class instance metadata for efficient queries and display
  // This field is automatically populated when bookings are created (optional for backward compatibility)
  classInstanceSnapshot: v.optional(v.object({
    startTime: v.number(),           // For efficient ordering and display
    endTime: v.optional(v.number()), // For display purposes
    name: v.optional(v.string()),    // Class name for display
    status: v.optional(v.string()),  // Instance status
    cancellationWindowHours: v.optional(v.number()),
    instructor: v.optional(v.string()),
  })),

  venueSnapshot: v.optional(v.object({
    name: v.optional(v.string()),
  })),

  // Simplified status flow
  status: v.union(
    v.literal("pending"),    // Just booked, not yet attended
    v.literal("completed"),  // User attended class
    v.literal("cancelled_by_consumer"),  // User cancelled before class
    v.literal("cancelled_by_business"),  // Business cancelled class
    v.literal("cancelled_by_business_rebookable"),  // Business cancelled, but allows rebooking
    v.literal("no_show")     // User didn't show up
  ),

  // Optional Cancel reason
  cancelReason: v.optional(v.string()),

  // Simple pricing tracking (links to credit ledger)
  originalPrice: v.number(),           // Template price (before any discount)
  finalPrice: v.number(),             // What they actually paid
  creditsUsed: v.number(),            // Same as finalPrice (for consistency)
  creditTransactionId: v.string(),    // Links to creditLedger entries

  // What discount was actually applied at booking time
  appliedDiscount: v.optional(v.object({
    source: v.union(
      v.literal("template_rule"),     // Automatic template rule
      v.literal("instance_rule")    // Manual instance override
    ),
    discountType: v.union(v.literal("percentage"), v.literal("fixed_amount")),
    discountValue: v.number(),        // The discount value used
    creditsSaved: v.number(),         // originalPrice - finalPrice
    ruleName: v.string(),             // Name of the discount rule
    reason: v.optional(v.string()),   // Reason for the discount
    appliedBy: v.optional(v.id("users")), // Who applied the discount
  })),

  // Simple timestamps
  bookedAt: v.number(),
  cancelledAt: v.optional(v.number()),
  cancelledBy: v.optional(v.union(v.literal("consumer"), v.literal("business"))),
  completedAt: v.optional(v.number()),

  ...auditFields,
  ...softDeleteFields,
};

export const creditTransactionsFields = {
  // Who the transaction affects
  userId: v.id("users"),

  // Signed amount (positive for add, negative for spend)
  amount: v.number(),

  // Transaction type - what happened to credits
  type: v.union(
    v.literal("purchase"),   // Credits added via payment
    v.literal("gift"),       // Credits given for free
    v.literal("spend"),      // Credits spent (bookings)
    v.literal("refund"),     // Credits returned
  ),

  // Reason - why/how it happened  
  reason: v.optional(v.union(
    // Purchase reasons
    v.literal("user_buy"),           // User bought credits

    // Spend reasons
    v.literal("booking"),            // Class booking

    // Gift reasons
    v.literal("admin_gift"),         // Admin manual gift
    v.literal("campaign_bonus"),     // Marketing campaign
    v.literal("referral_bonus"),     // Referral bonus  
    v.literal("welcome_bonus"),      // Welcome bonus
    v.literal("subscription_renewal"), // Monthly subscription credits

    // Refund reasons
    v.literal("user_cancellation"),  // User cancelled booking
    v.literal("business_cancellation"), // Business cancelled class
    v.literal("payment_issue"),      // Payment problem/chargeback
    v.literal("general_refund")      // Other refund
  )),

  // Business context for earnings tracking
  businessId: v.optional(v.id("businesses")),
  venueId: v.optional(v.id("venues")),
  classTemplateId: v.optional(v.id("classTemplates")),
  classInstanceId: v.optional(v.id("classInstances")),

  // Internal references
  bookingId: v.optional(v.id("bookings")),

  // Audit and reference tracking
  description: v.string(),
  externalRef: v.optional(v.string()), // payment ID, stripe ID, paypal ID, etc.

  // Enhanced purchase tracking (only populated for purchase transactions)
  stripePaymentIntentId: v.optional(v.string()),
  stripeCheckoutSessionId: v.optional(v.string()),
  packageName: v.optional(v.string()), // "50 Credit Pack", "20 Credits Monthly"
  priceInCents: v.optional(v.number()),
  currency: v.optional(v.string()),

  // Transaction status (primarily for purchases, otherwise defaults to completed)
  status: v.optional(v.union(
    v.literal("pending"),    // Payment initiated but not confirmed
    v.literal("completed"),  // Transaction successful
    v.literal("failed"),     // Transaction failed
    v.literal("canceled"),   // User canceled during checkout
    v.literal("refunded")    // Transaction refunded
  )),
  completedAt: v.optional(v.number()),

  ...auditFields,
  ...softDeleteFields,
};

export const notificationsFields = {
  businessId: v.id("businesses"), // Always present - even consumer notifications are "about" a business

  // Who receives this notification
  recipientType: v.union(v.literal("business"), v.literal("consumer")),
  recipientUserId: v.optional(v.id("users")), // For consumer notifications

  type: v.union(
    // Business notifications
    v.literal("booking_created"),
    v.literal("booking_cancelled_by_consumer"),
    v.literal("payment_received"),

    // Consumer notifications  
    v.literal("booking_confirmation"),
    v.literal("booking_reminder"),
    v.literal("class_cancelled"),
    v.literal("class_rebookable"),
    v.literal("booking_cancelled_by_business"),
    v.literal("payment_receipt")
  ),

  // Content
  title: v.string(),
  message: v.string(),

  // Context
  relatedBookingId: v.optional(v.id("bookings")),
  relatedClassInstanceId: v.optional(v.id("classInstances")),

  // Status
  seen: v.boolean(),
  seenAt: v.optional(v.number()),

  // Delivery tracking (MVP critical fields)
  deliveryStatus: v.union(v.literal("pending"), v.literal("sent"), v.literal("failed")),
  failureReason: v.optional(v.string()),
  retryCount: v.optional(v.number()),

  // Channels where this was sent
  sentToEmail: v.boolean(),
  sentToWeb: v.boolean(),
  sentToPush: v.boolean(),

  // Simple metadata
  metadata: v.optional(v.object({
    className: v.optional(v.string()),
    userEmail: v.optional(v.string()),
    userName: v.optional(v.string()),
    amount: v.optional(v.number()),
  })),

  ...auditFields,
  ...softDeleteFields,
};

// Business notification preferences - stored at business level
export const businessNotificationSettingsFields = {
  businessId: v.id("businesses"),

  // Per-type channel preferences
  notificationPreferences: v.object({
    booking_created: v.object({
      email: v.boolean(),
      web: v.boolean(),
    }),
    booking_cancelled_by_consumer: v.object({
      email: v.boolean(),
      web: v.boolean(),
    }),
    booking_cancelled_by_business: v.object({
      email: v.boolean(),
      web: v.boolean(),
    }),
    payment_received: v.object({
      email: v.boolean(),
      web: v.boolean(),
    }),
  }),

  ...auditFields,
  ...softDeleteFields,
};

// User notification preferences - for when they're acting as consumers
export const userNotificationSettingsFields = {
  userId: v.id("users"),

  // Global opt-out (MVP critical field)
  globalOptOut: v.boolean(),

  // Per-type channel preferences
  notificationPreferences: v.object({
    booking_confirmation: v.object({
      email: v.boolean(),
      web: v.boolean(),
      push: v.boolean(),
    }),
    booking_reminder: v.object({
      email: v.boolean(),
      web: v.boolean(),
      push: v.boolean(),
    }),
    class_cancelled: v.object({
      email: v.boolean(),
      web: v.boolean(),
      push: v.boolean(),
    }),
    class_rebookable: v.object({
      email: v.boolean(),
      web: v.boolean(),
      push: v.boolean(),
    }),
    booking_cancelled_by_business: v.object({
      email: v.boolean(),
      web: v.boolean(),
      push: v.boolean(),
    }),
    payment_receipt: v.object({
      email: v.boolean(),
      web: v.boolean(),
      push: v.boolean(),
    }),
  }),

  ...auditFields,
  ...softDeleteFields,
};

export const subscriptionsFields = {
  userId: v.id("users"),

  // Stripe integration
  stripeCustomerId: v.string(), // Stripe customer ID
  stripeSubscriptionId: v.string(), // Stripe subscription ID
  stripePriceId: v.string(), // Which Stripe price/plan
  stripeProductId: v.string(), // Stripe product ID

  // Subscription details
  status: v.union(
    v.literal("active"),
    v.literal("canceled"),
    v.literal("past_due"),
    v.literal("incomplete"),
    v.literal("trialing"),
    v.literal("unpaid")
  ),

  // Billing cycle (anniversary billing)
  currentPeriodStart: v.number(), // Unix timestamp
  currentPeriodEnd: v.number(), // Unix timestamp
  billingCycleAnchor: v.number(), // Day of month (1-31) for anniversary billing

  // Credit allocation
  creditAmount: v.number(), // Credits awarded per billing cycle
  pricePerCycle: v.number(), // Amount charged per cycle (in cents)
  currency: v.string(), // "eur", "usd", etc.

  // Subscription lifecycle
  startDate: v.number(), // When subscription started
  canceledAt: v.optional(v.number()), // When user cancelled
  cancelAtPeriodEnd: v.optional(v.boolean()), // Cancel at end of current period
  endedAt: v.optional(v.number()), // When subscription actually ended

  // Metadata
  planName: v.string(), // "20 Credits Monthly", "50 Credits Monthly"

  ...auditFields,
  ...softDeleteFields,
};

export const subscriptionEventsFields = {
  subscriptionId: v.optional(v.id("subscriptions")), // Database subscription ID (null if not created yet)
  stripeSubscriptionId: v.string(), // Stripe subscription ID

  // Stripe event details
  stripeEventId: v.string(), // Unique Stripe event ID for idempotency
  eventType: v.string(), // "customer.subscription.created", "invoice.payment_succeeded", etc.

  // Event processing
  processedAt: v.number(),
  creditsAllocated: v.optional(v.number()), // Credits added for this event
  creditTransactionId: v.optional(v.string()), // Link to credit transaction

  // Raw event data (for debugging)
  eventData: v.optional(v.any()), // Raw Stripe event object

  ...auditFields,
};

/***************************************************************
 * Database schema
 ***************************************************************/
export default defineSchema({
  ...authTables,

  /** 
   * Users that register to the system
   */
  users: defineTable(usersFields).index("email", ["email"]),

  /** 
   * Business that the user belongs to - created on onboarding
   */
  businesses: defineTable(businessesFields)
    .index("by_email", ["email"]),

  /**
  * Business invitations for user onboarding
  */
  businessInvitations: defineTable(businessInvitationsFields)
    .index("by_business", ["businessId"])
    .index("by_email", ["email"])
    .index("by_token", ["token"])
    .index("by_business_email", ["businessId", "email"]),

  /** 
   * System settings for global configuration
   */
  systemSettings: defineTable(systemSettingsFields).index("by_key", ["key"]),


  /** 
   * Venues/Locations where classes are held
   */
  venues: defineTable(venuesFields)
    .index("by_business", ["businessId"])
    .index("by_city", ["address.city"])
    .index("by_deleted", ["deleted"]),

  /** 
   * Class templates - blueprints for creating class instances
   * No scheduling logic, just the "what" not the "when"
   */
  classTemplates: defineTable(classTemplatesFields)
    .index("by_business", ["businessId"])
    .index("by_venue", ["venueId"])
    .index("by_business_deleted", ["businessId", "deleted"])
    .index("by_business_deleted_active", ["businessId", "deleted", "isActive"]),

  /** 
   * Class instances - actual scheduled classes
   * Each instance references a template but can override any field
   */
  classInstances: defineTable(classInstancesFields)
    .index("by_business", ["businessId"])
    .index("by_venue", ["venueId"])
    .index("by_template", ["templateId"])
    .index("by_start_time", ["startTime"])
    .index("by_business_start_time", ["businessId", "startTime"])
    .index("by_template_and_start_time", ["templateId", "startTime"])
    .index("by_business_name_timepattern_dayofweek", ["businessId", "name", "timePattern", "dayOfWeek"]),

  /** 
   * Bookings - customer reservations for class instances (simplified)
   */
  bookings: defineTable(bookingsFields)
    .index("by_business", ["businessId"])
    .index("by_user", ["userId"])
    .index("by_class_instance", ["classInstanceId"])
    .index("by_user_class", ["userId", "classInstanceId"])
    .index("by_business_status", ["businessId", "status"])
    .index("by_credit_transaction", ["creditTransactionId"])
    .index("by_discount_source", ["appliedDiscount.source"])
    .index("by_user_start_time", ["userId", "classInstanceSnapshot.startTime"]),

  /**
   * Enhanced Credit Transactions - One record per credit operation (includes purchases)
   */
  creditTransactions: defineTable(creditTransactionsFields)
    .index("by_user", ["userId"])
    .index("by_business", ["businessId"])
    .index("by_type", ["type"])
    .index("by_venue", ["venueId"])
    .index("by_class_template", ["classTemplateId"])
    .index("by_class_instance", ["classInstanceId"])
    .index("by_booking", ["bookingId"])
    .index("by_user_type", ["userId", "type"])
    .index("by_business_type", ["businessId", "type"])
    .index("by_stripe_payment_intent", ["stripePaymentIntentId"])
    .index("by_stripe_checkout_session", ["stripeCheckoutSessionId"])
    .index("by_status", ["status"])
    .index("by_user_status", ["userId", "status"]),

  /**
   * Notifications - Messages sent to businesses and consumers
   */
  notifications: defineTable(notificationsFields)
    .index("by_business", ["businessId"])
    .index("by_recipient_user", ["recipientUserId"])
    .index("by_recipient_type", ["recipientType"])
    .index("by_business_type", ["businessId", "type"])
    .index("by_delivery_status", ["deliveryStatus"])
    .index("by_created_at", ["createdAt"])
    .index("by_business_recipient_seen", ["businessId", "recipientUserId", "seen"]),

  /**
   * Business notification settings - How businesses want to receive notifications
   */
  businessNotificationSettings: defineTable(businessNotificationSettingsFields)
    .index("by_business", ["businessId"]),

  /**
   * User notification settings - How users want to receive consumer notifications
   */
  userNotificationSettings: defineTable(userNotificationSettingsFields)
    .index("by_user", ["userId"])
    .index("by_global_opt_out", ["globalOptOut"]),

  /**
   * User subscriptions - Monthly credit subscriptions via Stripe
   */
  subscriptions: defineTable(subscriptionsFields)
    .index("by_user", ["userId"])
    .index("by_stripe_subscription", ["stripeSubscriptionId"])
    .index("by_stripe_customer", ["stripeCustomerId"])
    .index("by_status", ["status"])
    .index("by_user_status", ["userId", "status"]),

  /**
   * Subscription events - Track Stripe webhook events for subscriptions
   */
  subscriptionEvents: defineTable(subscriptionEventsFields)
    .index("by_subscription", ["subscriptionId"])
    .index("by_stripe_event", ["stripeEventId"])
    .index("by_event_type", ["eventType"])
    .index("by_processed_at", ["processedAt"]),
});
