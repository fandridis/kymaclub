/**
 * Notification type definitions
 * Matches the notification type union from the database schema
 */

export type NotificationType =
    // Business notifications
    | "booking_created"
    | "booking_cancelled_by_consumer"
    | "review_received"
    | "payment_received"
    // Consumer notifications
    | "booking_confirmation"
    | "booking_reminder"
    | "class_cancelled"
    | "class_rebookable"
    | "booking_cancelled_by_business"
    | "payment_receipt"
    | "credits_received_subscription";

