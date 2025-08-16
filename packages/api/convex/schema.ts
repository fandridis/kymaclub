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

export const discountTemplatesFields = {
  name: v.string(),
  type: v.union(v.literal("percentage"), v.literal("fixed_amount")),
  description: v.optional(v.string()),
  rate: v.number(), // 0.20 for 20% off

  // Eligibility restrictions only
  maxBusinesses: v.optional(v.number()),
  requiresApproval: v.boolean(),
  isActive: v.boolean(),

  // How many businesses currently using this template
  currentUsage: v.optional(v.number()),

  ...auditFields,
  ...softDeleteFields,
};

export const businessDiscountsFields = {
  businessId: v.id("businesses"),
  discountTemplateId: v.id("discountTemplates"),

  // Simple overrides
  customRate: v.optional(v.number()), // Override template rate
  expiresAt: v.optional(v.number()), // null = permanent

  // Application details
  appliedAt: v.number(),
  appliedBy: v.id("users"),

  // Audit trail
  lastModifiedAt: v.optional(v.number()),
  lastModifiedBy: v.optional(v.id("users")),

  // Status
  isActive: v.boolean(),
  notes: v.optional(v.string()),

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
  baseCredits: v.number(),
  bookingWindow: v.optional(v.object({
    minHours: v.number(), // Can't book closer than this
    maxHours: v.number(), // Can't book further than this
  })),
  cancellationWindowHours: v.number(),

  // Smart discount rules (multiple rules, best price wins)
  discountRules: v.optional(v.array(v.object({
    id: v.string(),              // "early_bird_001", "last_minute_001"
    name: v.string(),            // "Early Bird Special", "Last Minute Deal"

    // When this rule applies
    condition: v.object({
      type: v.union(
        v.literal("hours_before_min"), // At least X hours before (early bird)
        v.literal("hours_before_max"), // At most X hours before (last minute)
        v.literal("always")            // Always applies (general discount)
      ),
      hours: v.optional(v.number())    // 12 for early bird, 4 for last minute
    }),

    // How the discount is calculated
    discount: v.object({
      type: v.union(
        v.literal("fixed_amount"),   // baseCredits - X
        v.literal("percentage"),     // baseCredits * (1 - X)
        v.literal("fixed_price")     // set final price to X
      ),
      value: v.number()              // 2 (credits), 0.40 (40%), or 2 (final price)
    }),

    isActive: v.boolean(),
    createdAt: v.number(),
    createdBy: v.id("users")
  }))),

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
  baseCredits: v.optional(v.number()),
  bookingWindow: v.optional(v.object({
    minHours: v.number(),
    maxHours: v.number(),
  })),
  cancellationWindowHours: v.optional(v.number()),
  tags: v.optional(v.array(v.string())),
  color: v.optional(v.string()),

  // Manual discount override (takes precedence over template rules)
  manualDiscount: v.optional(v.object({
    type: v.union(
      v.literal("fixed_amount"),
      v.literal("percentage"),
      v.literal("fixed_price")
    ),
    value: v.number(),
    reason: v.optional(v.string()),    // "Low attendance", "Manager special"
    appliedBy: v.id("users"),
    appliedAt: v.number(),
    isActive: v.boolean()              // Can temporarily disable
  })),

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

  // Simplified status flow
  status: v.union(
    v.literal("pending"),    // Just booked, not yet attended
    v.literal("completed"),  // User attended class
    v.literal("cancelled"),  // User cancelled before class
    v.literal("no_show")     // User didn't show up
  ),

  // Simple pricing tracking (links to credit ledger)
  originalPrice: v.number(),           // Template baseCredits (before any discount)
  finalPrice: v.number(),             // What they actually paid
  creditsUsed: v.number(),            // Same as finalPrice (for consistency)
  creditTransactionId: v.string(),    // Links to creditLedger entries

  // What discount was actually applied at booking time
  appliedDiscount: v.optional(v.object({
    source: v.union(
      v.literal("template_rule"),     // Automatic template rule
      v.literal("manual_override")    // Manual instance override
    ),
    type: v.union(
      v.literal("fixed_amount"),
      v.literal("percentage"),
      v.literal("fixed_price")
    ),
    value: v.number(),                // The discount value used
    creditsSaved: v.number(),         // originalPrice - finalPrice

    // For template rules
    ruleId: v.optional(v.string()),   // Which template rule was applied
    ruleName: v.optional(v.string()), // "Early Bird Special"

    // For manual overrides
    reason: v.optional(v.string()),   // Manager's reason
    appliedBy: v.optional(v.id("users"))
  })),

  // Simple timestamps
  bookedAt: v.number(),
  cancelledAt: v.optional(v.number()),
  completedAt: v.optional(v.number()),

  ...auditFields,
  ...softDeleteFields,
};

export const cancellationPoliciesFields = {
  // Business this policy applies to
  businessId: v.id("businesses"),
  // Full refund allowed until this many minutes before class start
  fullRefundCutoffMins: v.number(),
  // Partial refund allowed until this many minutes before class start
  partialRefundCutoffMins: v.number(),
  // Fraction refunded on late cancel (0.0–1.0)
  partialRefundPercent: v.number(), // 0.0 - 1.0
  // Whether business earns revenue on late cancellation per policy
  payBusinessOnLateCancel: v.boolean(),
  // Whether business earns revenue on no-shows per policy
  payBusinessOnNoShow: v.boolean(),
  // Effective date range for policy activation (ms since epoch)
  effectiveFrom: v.optional(v.number()),
  effectiveUntil: v.optional(v.number()),
  // Whether this policy is currently active
  isActive: v.boolean(),
  // Standard audit fields and soft deletion flags
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

  // Audit and reference tracking
  description: v.string(),
  externalRef: v.optional(v.string()), // payment ID, booking ID, etc.

  ...auditFields,
  ...softDeleteFields,
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
   * Discount templates
   */
  discountTemplates: defineTable(discountTemplatesFields)
    .index("by_active", ["isActive"])
    .index("by_name", ["name"]),

  /** 
   * Junction table: which businesses have which discounts
   */
  businessDiscounts: defineTable(businessDiscountsFields)
    .index("by_business", ["businessId"])
    .index("by_template", ["discountTemplateId"])
    .index("by_business_active", ["businessId", "isActive"])
    .index("by_expires", ["expiresAt"]),

  /** 
   * Venues/Locations where classes are held
   */
  venues: defineTable(venuesFields)
    .index("by_business", ["businessId"])
    .index("by_city", ["address.city"]),

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
    .index("by_discount_source", ["appliedDiscount.source"]),

  /**
 * Per-business cancellation policy configuration
 */
  cancellationPolicies: defineTable(cancellationPoliciesFields)
    .index("by_business_and_active", ["businessId", "isActive"])
    .index("by_business", ["businessId"])
    .index("by_effective_range", ["effectiveFrom", "effectiveUntil"]),

  /**
   * Simple Credit Transactions - One record per credit operation
   */
  creditTransactions: defineTable(creditTransactionsFields)
    .index("by_user", ["userId"])
    .index("by_business", ["businessId"])
    .index("by_type", ["type"])
    .index("by_venue", ["venueId"])
    .index("by_class_template", ["classTemplateId"])
    .index("by_class_instance", ["classInstanceId"])
    .index("by_user_type", ["userId", "type"])
    .index("by_business_type", ["businessId", "type"]),
});
