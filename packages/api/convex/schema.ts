import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const venueCategoryField = v.union(
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
  v.literal("rehabilitation_center"),
  v.literal("workshop")
);

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
  createdAt: v.optional(v.number()),
  createdBy: v.optional(v.id("users")),
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

  role: v.optional(v.union(v.literal("admin"), v.literal("user"), v.literal("internal"))),

  // Signup source tracking (for business authorization)
  signupSource: v.optional(v.union(
    v.literal("mobile-consumer"),
    v.literal("web-consumer"),
    v.literal("web-business")
  )),

  // Simple credit balance for booking classes
  credits: v.optional(v.number()),

  // Consumer profile image
  consumerProfileImageStorageId: v.optional(v.id("_storage")),

  // Profile image moderation fields
  profileImageModerationStatus: v.optional(v.union(
    v.literal("pending"),
    v.literal("auto_approved"),
    v.literal("flagged"),
    v.literal("auto_rejected"),
    v.literal("manual_approved"),
    v.literal("manual_rejected")
  )),
  profileImageModerationScore: v.optional(v.number()), // 0-100 confidence score
  profileImageModerationReason: v.optional(v.string()),
  profileImageModeratedAt: v.optional(v.number()),
  profileImageFlaggedAt: v.optional(v.number()),
  profileImageFlaggedReason: v.optional(v.string()),

  // Stripe customer ID for payments
  stripeCustomerId: v.optional(v.string()),

  // Testing flag for production testing
  isTester: v.optional(v.boolean()),

  // Active city slug for location-based filtering
  activeCitySlug: v.optional(v.string()),

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

export const authorizedBusinessEmailsFields = {
  email: v.string(),
  authorizedBy: v.id("users"),
  expiresAt: v.optional(v.number()), // Optional expiration date
  notes: v.optional(v.string()), // Optional notes about why this email was authorized
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
  primaryCategory: v.optional(venueCategoryField),

  // Social media
  socialMedia: v.optional(v.object({
    facebook: v.optional(v.string()),
    instagram: v.optional(v.string()),
    twitter: v.optional(v.string()),
    youtube: v.optional(v.string()),
    linkedin: v.optional(v.string()),
  })),

  citySlug: v.optional(v.string()),
  address: v.object({
    street: v.string(),
    city: v.string(),
    area: v.optional(v.string()),
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

  // Testing flag for production testing
  isTest: v.optional(v.boolean()),

  ...auditFields,
  ...softDeleteFields,
};

export const classTemplatesFields = {
  businessId: v.id("businesses"),
  venueId: v.id("venues"),
  name: v.string(),
  description: v.optional(v.string()),
  instructor: v.string(),

  primaryCategory: v.optional(venueCategoryField),

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

  // Booking control
  disableBookings: v.optional(v.boolean()), // Default: false (bookings enabled)

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

  // City slug for efficient city-based filtering (denormalized from venue)
  citySlug: v.optional(v.string()),

  primaryCategory: v.optional(venueCategoryField),

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
    minHours: v.number(), // Minimum hours before class start for booking
    maxHours: v.number(), // Maximum hours before class start for booking
  })),
  cancellationWindowHours: v.optional(v.number()),
  tags: v.optional(v.array(v.string())),
  color: v.optional(v.string()),

  // Instance-specific discount rules (overrides template rules)
  discountRules: v.optional(v.array(v.object(classDiscountRuleFields))),
  hasDiscountRules: v.optional(v.boolean()), // Performance optimization: true if discountRules.length > 0

  // Booking control
  disableBookings: v.optional(v.boolean()), // Default: false (bookings enabled)

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
    discountRules: v.optional(v.array(v.object(classDiscountRuleFields))),
    deleted: v.optional(v.boolean()),
    primaryCategory: venueCategoryField,
  }),

  // Venue Snapshot
  venueSnapshot: v.object({
    name: v.string(),
    citySlug: v.optional(v.string()),
    address: v.object({
      street: v.string(),
      city: v.string(),
      area: v.optional(v.string()),
      zipCode: v.string(),
      country: v.string(),
      state: v.optional(v.string()),
      latitude: v.optional(v.number()),
      longitude: v.optional(v.number()),
    }),
    imageStorageIds: v.optional(v.array(v.id("_storage"))),
    deleted: v.optional(v.boolean()),
  }),

  // Testing flag for production testing
  isTest: v.optional(v.boolean()),

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
  originalPrice: v.number(),           // Template price in cents (before any discount)  
  finalPrice: v.number(),             // What they actually paid in cents (creditsUsed = finalPrice / 100)
  creditTransactionId: v.string(),    // Links to creditLedger entries

  // Platform fee and refund tracking
  platformFeeRate: v.number(),        // Platform fee rate (0.0 to 1.0, e.g., 0.20 = 20%)
  refundAmount: v.optional(v.number()), // Refund amount in cents (0 if no refund, undefined until refund processed)

  // What discount was actually applied at booking time
  appliedDiscount: v.optional(v.object({
    source: v.union(
      v.literal("template_rule"),     // Automatic template rule
      v.literal("instance_rule")    // Manual instance override
    ),
    discountType: v.union(v.literal("percentage"), v.literal("fixed_amount")),
    // Note: discountValue removed as it was redundant with creditsSaved
    creditsSaved: v.number(),         // (originalPrice - finalPrice) / 100 (in credits for display)
    ruleName: v.string(),             // Name of the discount rule
    reason: v.optional(v.string()),   // Reason for the discount
    appliedBy: v.optional(v.id("users")), // Who applied the discount
  })),

  // Simple timestamps
  bookedAt: v.number(),
  cancelledAt: v.optional(v.number()),
  cancelledBy: v.optional(v.union(v.literal("consumer"), v.literal("business"))),
  completedAt: v.optional(v.number()),

  // Free cancellation privileges (for rescheduled classes, etc.)
  hasFreeCancel: v.optional(v.boolean()),
  freeCancelExpiresAt: v.optional(v.number()),
  freeCancelReason: v.optional(v.string()),

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
    v.literal("review_received"),
    v.literal("payment_received"),

    // Consumer notifications  
    v.literal("booking_confirmation"),
    v.literal("booking_reminder"),
    v.literal("class_cancelled"),
    v.literal("class_rebookable"),
    v.literal("booking_cancelled_by_business"),
    v.literal("payment_receipt"),
    v.literal("credits_received_subscription")
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

// Business settings - All business-specific preferences and settings
export const businessSettingsFields = {
  businessId: v.id("businesses"),

  // Notification preferences
  notifications: v.optional(v.object({
    // Per-type channel preferences
    preferences: v.object({
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
      // Optional to avoid breaking existing settings docs
      review_received: v.optional(v.object({
        email: v.boolean(),
        web: v.boolean(),
      })),
    }),
  })),

  // UI preferences and banners
  banners: v.optional(v.object({
    // Future business banners can be added here
    // announcementBannerDismissed: v.optional(v.boolean()),
  })),

  // Future settings can be added here
  // theme: v.optional(v.string()),
  // dashboardLayout: v.optional(v.string()),

  ...auditFields,
  ...softDeleteFields,
};

// User settings - All user-specific preferences and settings
export const userSettingsFields = {
  userId: v.id("users"),

  // Notification preferences
  notifications: v.optional(v.object({
    // Global opt-out (MVP critical field)
    globalOptOut: v.boolean(),

    // Per-type channel preferences
    preferences: v.object({
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
      credits_received_subscription: v.object({
        email: v.boolean(),
        web: v.boolean(),
        push: v.boolean(),
      }),
    }),
  })),

  // UI preferences and banners
  banners: v.optional(v.object({
    welcomeBannerDismissed: v.optional(v.boolean()),
    exampleNewFeatureBannerDismissed: v.optional(v.boolean()),
  })),

  // Future settings can be added here
  // theme: v.optional(v.string()),
  // language: v.optional(v.string()),

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

export const venueReviewsFields = {
  businessId: v.id("businesses"),
  venueId: v.id("venues"),
  userId: v.id("users"),

  // Review content
  rating: v.number(), // 1-5 star rating
  comment: v.optional(v.string()), // Optional text review

  // User snapshot for display (denormalized for efficiency)
  userSnapshot: v.object({
    name: v.optional(v.string()),
    email: v.optional(v.string()),
  }),

  // Venue snapshot for display (denormalized)
  venueSnapshot: v.object({
    name: v.string(),
  }),

  // Review visibility and moderation
  isVisible: v.boolean(), // Default: false until AI checks

  // AI Moderation fields
  moderationStatus: v.union(
    v.literal("pending"),      // Awaiting AI check
    v.literal("auto_approved"), // AI confidence < 40%
    v.literal("flagged"),       // AI confidence 40-80%
    v.literal("auto_rejected"), // AI confidence > 80%
    v.literal("manual_approved"), // Admin manually approved
    v.literal("manual_rejected")  // Admin manually rejected
  ),

  aiModerationScore: v.optional(v.number()), // 0-100 confidence score
  aiModerationReason: v.optional(v.string()), // Why AI flagged it
  aiModeratedAt: v.optional(v.number()), // When AI checked it

  // Manual moderation
  flaggedAt: v.optional(v.number()), // When flagged for manual review
  flaggedReason: v.optional(v.string()), // Additional context for manual review

  moderatedBy: v.optional(v.id("users")), // Admin who manually reviewed
  moderatedAt: v.optional(v.number()), // When manually reviewed
  moderationNote: v.optional(v.string()), // Admin's note on decision

  ...auditFields,
  ...softDeleteFields,
};

export const chatMessageThreadsFields = {
  businessId: v.id("businesses"),
  venueId: v.id("venues"),
  userId: v.id("users"), // The consumer user

  // Thread status and metadata
  status: v.union(
    v.literal("active"),
    v.literal("archived"),
    v.literal("blocked")
  ),

  // Denormalized data for efficient display
  userSnapshot: v.object({
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
  }),

  venueSnapshot: v.object({
    name: v.string(),
  }),

  // Thread summary info
  lastMessageAt: v.number(), // For sorting threads
  lastMessagePreview: v.optional(v.string()), // First 100 chars of last message
  lastMessageSender: v.union(v.literal("consumer"), v.literal("venue")),

  // Unread counts (for both sides)
  unreadCountConsumer: v.number(), // Messages venue sent that consumer hasn't read
  unreadCountVenue: v.number(), // Messages consumer sent that venue hasn't read

  // Total message count (for pagination)
  messageCount: v.number(),

  ...auditFields,
  ...softDeleteFields,
};

export const chatMessagesFields = {
  threadId: v.id("chatMessageThreads"),
  businessId: v.id("businesses"), // For multi-tenancy
  venueId: v.id("venues"),

  // Message content
  content: v.string(),
  messageType: v.union(
    v.literal("text"),           // Regular text message
    v.literal("system"),         // System generated message
    v.literal("cancellation_card"), // Special cancellation notification
    v.literal("booking_reference"), // Message referencing a specific booking
    v.literal("image"),          // Image attachment (future)
    v.literal("file")            // File attachment (future)
  ),

  // Sender info
  senderType: v.union(v.literal("consumer"), v.literal("venue"), v.literal("system")),
  senderId: v.optional(v.id("users")), // null for system messages

  // Sender snapshot for display
  senderSnapshot: v.optional(v.object({
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    businessRole: v.optional(v.string()), // For venue staff messages
  })),

  // Read tracking
  readByConsumer: v.boolean(),
  readByVenue: v.boolean(),
  readByConsumerAt: v.optional(v.number()),
  readByVenueAt: v.optional(v.number()),

  // Optional booking context
  relatedBookingId: v.optional(v.id("bookings")),
  relatedClassInstanceId: v.optional(v.id("classInstances")),

  // Cancellation card specific data
  cancellationData: v.optional(v.object({
    className: v.string(),
    instructorName: v.string(),
    originalDateTime: v.number(),
    cancellationReason: v.optional(v.string()),
    canRebook: v.boolean(),
  })),

  // Message metadata
  editedAt: v.optional(v.number()),
  editedBy: v.optional(v.id("users")),
  isEdited: v.optional(v.boolean()),

  // System message context
  systemContext: v.optional(v.object({
    type: v.union(
      v.literal("booking_confirmed"),
      v.literal("booking_cancelled"),
      v.literal("class_cancelled"),
      v.literal("payment_processed"),
      v.literal("thread_created")
    ),
    metadata: v.optional(v.any()), // Flexible metadata for different system message types
  })),

  ...auditFields,
  ...softDeleteFields,
};

// ADR-020: User Presence Tracking for Smart Notifications
// Real-time presence tracking to detect if users are actively in conversations
// Used for smart notification delivery to avoid spam when user is already chatting
export const userPresenceFields = {
  userId: v.id("users"),

  // Current active thread (null if not in any chat)
  activeThreadId: v.optional(v.union(v.id("chatMessageThreads"), v.null())),

  // Presence status
  isActive: v.boolean(), // Is user currently active in the app
  lastSeen: v.number(), // Last activity timestamp

  // App state tracking
  appState: v.union(
    v.literal("active"),      // App is in foreground
    v.literal("background"),  // App is in background
    v.literal("inactive")     // App is not running/closed
  ),

  // Device info for multi-device support
  deviceId: v.optional(v.string()), // Unique device identifier
  deviceType: v.optional(v.union(
    v.literal("mobile"),
    v.literal("web"),
    v.literal("desktop")
  )),

  // Metadata
  ...auditFields,
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
  users: defineTable(usersFields)
    .index("email", ["email"])
    .index("by_active_city_slug", ["activeCitySlug"]),

  /** 
   * Business that the user belongs to - created on onboarding
   */
  businesses: defineTable(businessesFields)
    .index("by_email", ["email"]),

  /**
  * Authorized business emails - whitelist for new business account creation
  */
  authorizedBusinessEmails: defineTable(authorizedBusinessEmailsFields)
    .index("by_email", ["email"])
    .index("by_deleted", ["deleted"]),

  /** 
   * System settings for global configuration
   */
  systemSettings: defineTable(systemSettingsFields).index("by_key", ["key"]),


  /** 
   * Venues/Locations where classes are held
   */
  venues: defineTable(venuesFields)
    .index("by_business", ["businessId"])
    .index("by_city_slug", ["citySlug"])
    .index("by_deleted", ["deleted"])
    // 🆕 PERFORMANCE INDEXES FOR DELETED ITEM FILTERING
    .index("by_business_deleted", ["businessId", "deleted"]),

  /** 
   * Class templates - blueprints for creating class instances
   * No scheduling logic, just the "what" not the "when"
   */
  classTemplates: defineTable(classTemplatesFields)
    .index("by_business", ["businessId"])
    .index("by_venue", ["venueId"])
    .index("by_venue_deleted", ["venueId", "deleted"])
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
    .index("by_business_name_timepattern_dayofweek", ["businessId", "name", "timePattern", "dayOfWeek"])
    // 🆕 CRITICAL PERFORMANCE INDEXES FOR EFFICIENT FILTERING
    .index("by_business_deleted_start_time", ["businessId", "deleted", "startTime"])
    .index("by_business_status_start_time", ["businessId", "status", "startTime"])
    .index("by_template_deleted", ["templateId", "deleted"])
    .index("by_venue_deleted_start_time", ["venueId", "deleted", "startTime"])
    // 🚀 GLOBAL CONSUMER QUERY OPTIMIZATION - eliminates expensive filters
    .index("by_status_deleted_start_time", ["status", "deleted", "startTime"])
    // 🏙️ CITY-BASED FILTERING - efficient city filtering for consumer queries
    .index("by_city_slug_status_deleted_start_time", ["citySlug", "status", "deleted", "startTime"])
    // 🧪 TEST INSTANCE FILTERING - efficient filtering of test instances for non-testers
    .index("by_city_slug_status_deleted_isTest_start_time", ["citySlug", "status", "deleted", "isTest", "startTime"])
    // 🎯 DISCOUNT OPTIMIZATION - only fetch instances with discount rules
    .index("by_status_deleted_hasDiscountRules_start_time", ["status", "deleted", "hasDiscountRules", "startTime"])
    // 🏁 CLASS COMPLETION OPTIMIZATION - efficient queries for classes that have ended
    .index("by_status_deleted_end_time", ["status", "deleted", "endTime"])
    // 🔍 INTERNAL ADMIN SORTING INDEXES - for efficient sorting in admin panel
    .index("by_deleted_start_time", ["deleted", "startTime"])
    .index("by_deleted_price", ["deleted", "price"])
    .index("by_deleted_capacity", ["deleted", "capacity"]),

  /** 
   * Bookings - customer reservations for class instances (simplified)
   */
  bookings: defineTable(bookingsFields)
    .index("by_business", ["businessId"])
    .index("by_user", ["userId"])
    .index("by_class_instance", ["classInstanceId"])
    .index("by_user_class", ["userId", "classInstanceId"])
    .index("by_credit_transaction", ["creditTransactionId"])
    .index("by_discount_source", ["appliedDiscount.source"])
    .index("by_user_start_time", ["userId", "classInstanceSnapshot.startTime"])
    // 🆕 CRITICAL PERFORMANCE INDEXES FOR COMMON QUERY PATTERNS
    .index("by_user_status_deleted", ["userId", "status", "deleted"])
    .index("by_business_created", ["businessId", "createdAt"])
    .index("by_user_status_created", ["userId", "status", "createdAt"])
    .index("by_class_instance_status", ["classInstanceId", "status"])
    .index("by_user_status_start_time", ["userId", "status", "classInstanceSnapshot.startTime"])
    .index("by_status_deleted_start_time", ["status", "deleted", "classInstanceSnapshot.startTime"])
    // 🔍 DASHBOARD METRICS INDEX - for efficient booking queries by status, deleted, and bookedAt
    .index("by_status_deleted_bookedAt", ["status", "deleted", "bookedAt"]),

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
    .index("by_user_status", ["userId", "status"])
    // 🆕 CRITICAL PERFORMANCE INDEXES FOR DATE RANGE QUERIES
    .index("by_user_created", ["userId", "createdAt"])
    .index("by_business_created", ["businessId", "createdAt"])
    .index("by_user_type_created", ["userId", "type", "createdAt"])
    .index("by_business_type_created", ["businessId", "type", "createdAt"]),

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
   * Business settings - All business-specific preferences and settings
   */
  businessSettings: defineTable(businessSettingsFields)
    .index("by_business", ["businessId"]),

  /**
   * User settings - All user-specific preferences and settings
   */
  userSettings: defineTable(userSettingsFields)
    .index("by_user", ["userId"]),

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

  /**
   * Venue Reviews - User reviews and ratings for venues
   */
  venueReviews: defineTable(venueReviewsFields)
    .index("by_venue", ["venueId"])
    .index("by_user", ["userId"])
    .index("by_business", ["businessId"])
    .index("by_venue_visible", ["venueId", "isVisible"])
    .index("by_venue_created", ["venueId", "createdAt"])
    .index("by_user_venue", ["userId", "venueId"])
    .index("by_venue_visible_created", ["venueId", "isVisible", "createdAt"])
    .index("by_business_created", ["businessId", "createdAt"])
    .index("by_deleted", ["deleted"]),

  /**
   * Message Threads - One thread per user-venue relationship
   */
  chatMessageThreads: defineTable(chatMessageThreadsFields)
    .index("by_business", ["businessId"])
    .index("by_venue", ["venueId"])
    .index("by_user", ["userId"])
    .index("by_user_venue", ["userId", "venueId"]) // Unique constraint enforced at business logic level
    .index("by_venue_last_message", ["venueId", "lastMessageAt"])
    .index("by_business_last_message", ["businessId", "lastMessageAt"])
    .index("by_user_last_message", ["userId", "lastMessageAt"])
    .index("by_venue_status", ["venueId", "status"])
    .index("by_venue_deleted_last_message", ["venueId", "deleted", "lastMessageAt"])
    .index("by_business_deleted_status", ["businessId", "deleted", "status"]),

  /**
   * Messages - Individual messages within threads
   */
  chatMessages: defineTable(chatMessagesFields)
    .index("by_thread", ["threadId"])
    .index("by_thread_created", ["threadId", "createdAt"])
    .index("by_business", ["businessId"])
    .index("by_venue", ["venueId"])
    .index("by_sender", ["senderId"])
    .index("by_sender_type", ["senderType"])
    .index("by_message_type", ["messageType"])
    .index("by_related_booking", ["relatedBookingId"])
    .index("by_related_class_instance", ["relatedClassInstanceId"])
    .index("by_thread_read_consumer", ["threadId", "readByConsumer"])
    .index("by_thread_read_venue", ["threadId", "readByVenue"])
    .index("by_venue_created", ["venueId", "createdAt"])
    .index("by_business_created", ["businessId", "createdAt"])
    .index("by_thread_deleted_created", ["threadId", "deleted", "createdAt"]),

  /**
   * User Presence - Real-time tracking for smart notifications
   * ADR-020: Prevents notification spam by detecting active users in conversations
   */
  userPresence: defineTable(userPresenceFields)
    .index("by_user", ["userId"])
    .index("by_thread", ["activeThreadId"])
    .index("by_user_active", ["userId", "isActive"])
    .index("by_user_last_seen", ["userId", "lastSeen"])
    .index("by_last_seen", ["lastSeen"]) // For cleanup queries
    .index("by_thread_active", ["activeThreadId", "isActive"])
    .index("by_device", ["deviceId"])
    .index("by_user_device", ["userId", "deviceId"]),

});
