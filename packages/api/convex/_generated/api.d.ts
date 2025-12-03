/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as ResendOTPPasswordReset from "../ResendOTPPasswordReset.js";
import type * as actions_ai from "../actions/ai.js";
import type * as actions_email from "../actions/email.js";
import type * as actions_payments from "../actions/payments.js";
import type * as actions_venue from "../actions/venue.js";
import type * as auth from "../auth.js";
import type * as crons from "../crons.js";
import type * as http from "../http.js";
import type * as internal_mutations_credits from "../internal/mutations/credits.js";
import type * as internal_queries_bookings from "../internal/queries/bookings.js";
import type * as internal_queries_businesses from "../internal/queries/businesses.js";
import type * as internal_queries_classInstances from "../internal/queries/classInstances.js";
import type * as internal_queries_consumers from "../internal/queries/consumers.js";
import type * as internal_queries_dashboardMetrics from "../internal/queries/dashboardMetrics.js";
import type * as internal_queries_search from "../internal/queries/search.js";
import type * as migrations from "../migrations.js";
import type * as mutations_bookings from "../mutations/bookings.js";
import type * as mutations_chat from "../mutations/chat.js";
import type * as mutations_classInstances from "../mutations/classInstances.js";
import type * as mutations_classTemplates from "../mutations/classTemplates.js";
import type * as mutations_core from "../mutations/core.js";
import type * as mutations_credits from "../mutations/credits.js";
import type * as mutations_notifications from "../mutations/notifications.js";
import type * as mutations_payments from "../mutations/payments.js";
import type * as mutations_presence from "../mutations/presence.js";
import type * as mutations_pushNotifications from "../mutations/pushNotifications.js";
import type * as mutations_reviews from "../mutations/reviews.js";
import type * as mutations_settings from "../mutations/settings.js";
import type * as mutations_uploads from "../mutations/uploads.js";
import type * as mutations_users from "../mutations/users.js";
import type * as mutations_venues from "../mutations/venues.js";
import type * as mutations_widgets from "../mutations/widgets.js";
import type * as queries_bookings from "../queries/bookings.js";
import type * as queries_chat from "../queries/chat.js";
import type * as queries_classInstances from "../queries/classInstances.js";
import type * as queries_classTemplates from "../queries/classTemplates.js";
import type * as queries_core from "../queries/core.js";
import type * as queries_credits from "../queries/credits.js";
import type * as queries_dashboard from "../queries/dashboard.js";
import type * as queries_earnings from "../queries/earnings.js";
import type * as queries_notifications from "../queries/notifications.js";
import type * as queries_payments from "../queries/payments.js";
import type * as queries_presence from "../queries/presence.js";
import type * as queries_reviews from "../queries/reviews.js";
import type * as queries_settings from "../queries/settings.js";
import type * as queries_subscriptions from "../queries/subscriptions.js";
import type * as queries_uploads from "../queries/uploads.js";
import type * as queries_venues from "../queries/venues.js";
import type * as queries_widgets from "../queries/widgets.js";
import type * as resendOTP from "../resendOTP.js";
import type * as testFunctions from "../testFunctions.js";
import type * as testResources from "../testResources.js";
import type * as triggers_index from "../triggers/index.js";
import type * as utils_rateLimiter from "../utils/rateLimiter.js";
import type * as utils from "../utils.js";
import type * as waitlist from "../waitlist.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  ResendOTPPasswordReset: typeof ResendOTPPasswordReset;
  "actions/ai": typeof actions_ai;
  "actions/email": typeof actions_email;
  "actions/payments": typeof actions_payments;
  "actions/venue": typeof actions_venue;
  auth: typeof auth;
  crons: typeof crons;
  http: typeof http;
  "internal/mutations/credits": typeof internal_mutations_credits;
  "internal/queries/bookings": typeof internal_queries_bookings;
  "internal/queries/businesses": typeof internal_queries_businesses;
  "internal/queries/classInstances": typeof internal_queries_classInstances;
  "internal/queries/consumers": typeof internal_queries_consumers;
  "internal/queries/dashboardMetrics": typeof internal_queries_dashboardMetrics;
  "internal/queries/search": typeof internal_queries_search;
  migrations: typeof migrations;
  "mutations/bookings": typeof mutations_bookings;
  "mutations/chat": typeof mutations_chat;
  "mutations/classInstances": typeof mutations_classInstances;
  "mutations/classTemplates": typeof mutations_classTemplates;
  "mutations/core": typeof mutations_core;
  "mutations/credits": typeof mutations_credits;
  "mutations/notifications": typeof mutations_notifications;
  "mutations/payments": typeof mutations_payments;
  "mutations/presence": typeof mutations_presence;
  "mutations/pushNotifications": typeof mutations_pushNotifications;
  "mutations/reviews": typeof mutations_reviews;
  "mutations/settings": typeof mutations_settings;
  "mutations/uploads": typeof mutations_uploads;
  "mutations/users": typeof mutations_users;
  "mutations/venues": typeof mutations_venues;
  "mutations/widgets": typeof mutations_widgets;
  "queries/bookings": typeof queries_bookings;
  "queries/chat": typeof queries_chat;
  "queries/classInstances": typeof queries_classInstances;
  "queries/classTemplates": typeof queries_classTemplates;
  "queries/core": typeof queries_core;
  "queries/credits": typeof queries_credits;
  "queries/dashboard": typeof queries_dashboard;
  "queries/earnings": typeof queries_earnings;
  "queries/notifications": typeof queries_notifications;
  "queries/payments": typeof queries_payments;
  "queries/presence": typeof queries_presence;
  "queries/reviews": typeof queries_reviews;
  "queries/settings": typeof queries_settings;
  "queries/subscriptions": typeof queries_subscriptions;
  "queries/uploads": typeof queries_uploads;
  "queries/venues": typeof queries_venues;
  "queries/widgets": typeof queries_widgets;
  resendOTP: typeof resendOTP;
  testFunctions: typeof testFunctions;
  testResources: typeof testResources;
  "triggers/index": typeof triggers_index;
  "utils/rateLimiter": typeof utils_rateLimiter;
  utils: typeof utils;
  waitlist: typeof waitlist;
}>;
declare const fullApiWithMounts: typeof fullApi;

export declare const api: FilterApi<
  typeof fullApiWithMounts,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApiWithMounts,
  FunctionReference<any, "internal">
>;

export declare const components: {
  resend: {
    lib: {
      cancelEmail: FunctionReference<
        "mutation",
        "internal",
        { emailId: string },
        null
      >;
      cleanupAbandonedEmails: FunctionReference<
        "mutation",
        "internal",
        { olderThan?: number },
        null
      >;
      cleanupOldEmails: FunctionReference<
        "mutation",
        "internal",
        { olderThan?: number },
        null
      >;
      createManualEmail: FunctionReference<
        "mutation",
        "internal",
        {
          from: string;
          headers?: Array<{ name: string; value: string }>;
          replyTo?: Array<string>;
          subject: string;
          to: string;
        },
        string
      >;
      get: FunctionReference<
        "query",
        "internal",
        { emailId: string },
        {
          complained: boolean;
          createdAt: number;
          errorMessage?: string;
          finalizedAt: number;
          from: string;
          headers?: Array<{ name: string; value: string }>;
          html?: string;
          opened: boolean;
          replyTo: Array<string>;
          resendId?: string;
          segment: number;
          status:
            | "waiting"
            | "queued"
            | "cancelled"
            | "sent"
            | "delivered"
            | "delivery_delayed"
            | "bounced"
            | "failed";
          subject: string;
          text?: string;
          to: string;
        } | null
      >;
      getStatus: FunctionReference<
        "query",
        "internal",
        { emailId: string },
        {
          complained: boolean;
          errorMessage: string | null;
          opened: boolean;
          status:
            | "waiting"
            | "queued"
            | "cancelled"
            | "sent"
            | "delivered"
            | "delivery_delayed"
            | "bounced"
            | "failed";
        } | null
      >;
      handleEmailEvent: FunctionReference<
        "mutation",
        "internal",
        { event: any },
        null
      >;
      sendEmail: FunctionReference<
        "mutation",
        "internal",
        {
          from: string;
          headers?: Array<{ name: string; value: string }>;
          html?: string;
          options: {
            apiKey: string;
            initialBackoffMs: number;
            onEmailEvent?: { fnHandle: string };
            retryAttempts: number;
            testMode: boolean;
          };
          replyTo?: Array<string>;
          subject: string;
          text?: string;
          to: string;
        },
        string
      >;
      updateManualEmail: FunctionReference<
        "mutation",
        "internal",
        {
          emailId: string;
          errorMessage?: string;
          resendId?: string;
          status:
            | "waiting"
            | "queued"
            | "cancelled"
            | "sent"
            | "delivered"
            | "delivery_delayed"
            | "bounced"
            | "failed";
        },
        null
      >;
    };
  };
  pushNotifications: {
    public: {
      deleteNotificationsForUser: FunctionReference<
        "mutation",
        "internal",
        { logLevel: "DEBUG" | "INFO" | "WARN" | "ERROR"; userId: string },
        any
      >;
      getNotification: FunctionReference<
        "query",
        "internal",
        { id: string; logLevel: "DEBUG" | "INFO" | "WARN" | "ERROR" },
        null | {
          _contentAvailable?: boolean;
          _creationTime: number;
          badge?: number;
          body?: string;
          categoryId?: string;
          channelId?: string;
          data?: any;
          expiration?: number;
          interruptionLevel?:
            | "active"
            | "critical"
            | "passive"
            | "time-sensitive";
          mutableContent?: boolean;
          numPreviousFailures: number;
          priority?: "default" | "normal" | "high";
          sound?: string | null;
          state:
            | "awaiting_delivery"
            | "in_progress"
            | "delivered"
            | "needs_retry"
            | "failed"
            | "maybe_delivered"
            | "unable_to_deliver";
          subtitle?: string;
          title: string;
          ttl?: number;
        }
      >;
      getNotificationsForUser: FunctionReference<
        "query",
        "internal",
        {
          limit?: number;
          logLevel: "DEBUG" | "INFO" | "WARN" | "ERROR";
          userId: string;
        },
        Array<{
          _contentAvailable?: boolean;
          _creationTime: number;
          badge?: number;
          body?: string;
          categoryId?: string;
          channelId?: string;
          data?: any;
          expiration?: number;
          id: string;
          interruptionLevel?:
            | "active"
            | "critical"
            | "passive"
            | "time-sensitive";
          mutableContent?: boolean;
          numPreviousFailures: number;
          priority?: "default" | "normal" | "high";
          sound?: string | null;
          state:
            | "awaiting_delivery"
            | "in_progress"
            | "delivered"
            | "needs_retry"
            | "failed"
            | "maybe_delivered"
            | "unable_to_deliver";
          subtitle?: string;
          title: string;
          ttl?: number;
        }>
      >;
      getStatusForUser: FunctionReference<
        "query",
        "internal",
        { logLevel: "DEBUG" | "INFO" | "WARN" | "ERROR"; userId: string },
        { hasToken: boolean; paused: boolean }
      >;
      pauseNotificationsForUser: FunctionReference<
        "mutation",
        "internal",
        { logLevel: "DEBUG" | "INFO" | "WARN" | "ERROR"; userId: string },
        null
      >;
      recordPushNotificationToken: FunctionReference<
        "mutation",
        "internal",
        {
          logLevel: "DEBUG" | "INFO" | "WARN" | "ERROR";
          pushToken: string;
          userId: string;
        },
        null
      >;
      removePushNotificationToken: FunctionReference<
        "mutation",
        "internal",
        { logLevel: "DEBUG" | "INFO" | "WARN" | "ERROR"; userId: string },
        null
      >;
      restart: FunctionReference<
        "mutation",
        "internal",
        { logLevel: "DEBUG" | "INFO" | "WARN" | "ERROR" },
        boolean
      >;
      sendPushNotification: FunctionReference<
        "mutation",
        "internal",
        {
          allowUnregisteredTokens?: boolean;
          logLevel: "DEBUG" | "INFO" | "WARN" | "ERROR";
          notification: {
            _contentAvailable?: boolean;
            badge?: number;
            body?: string;
            categoryId?: string;
            channelId?: string;
            data?: any;
            expiration?: number;
            interruptionLevel?:
              | "active"
              | "critical"
              | "passive"
              | "time-sensitive";
            mutableContent?: boolean;
            priority?: "default" | "normal" | "high";
            sound?: string | null;
            subtitle?: string;
            title: string;
            ttl?: number;
          };
          userId: string;
        },
        string | null
      >;
      shutdown: FunctionReference<
        "mutation",
        "internal",
        { logLevel: "DEBUG" | "INFO" | "WARN" | "ERROR" },
        { data?: any; message: string }
      >;
      unpauseNotificationsForUser: FunctionReference<
        "mutation",
        "internal",
        { logLevel: "DEBUG" | "INFO" | "WARN" | "ERROR"; userId: string },
        null
      >;
    };
  };
  rateLimiter: {
    lib: {
      checkRateLimit: FunctionReference<
        "query",
        "internal",
        {
          config:
            | {
                capacity?: number;
                kind: "token bucket";
                maxReserved?: number;
                period: number;
                rate: number;
                shards?: number;
                start?: null;
              }
            | {
                capacity?: number;
                kind: "fixed window";
                maxReserved?: number;
                period: number;
                rate: number;
                shards?: number;
                start?: number;
              };
          count?: number;
          key?: string;
          name: string;
          reserve?: boolean;
          throws?: boolean;
        },
        { ok: true; retryAfter?: number } | { ok: false; retryAfter: number }
      >;
      clearAll: FunctionReference<
        "mutation",
        "internal",
        { before?: number },
        null
      >;
      getServerTime: FunctionReference<"mutation", "internal", {}, number>;
      getValue: FunctionReference<
        "query",
        "internal",
        {
          config:
            | {
                capacity?: number;
                kind: "token bucket";
                maxReserved?: number;
                period: number;
                rate: number;
                shards?: number;
                start?: null;
              }
            | {
                capacity?: number;
                kind: "fixed window";
                maxReserved?: number;
                period: number;
                rate: number;
                shards?: number;
                start?: number;
              };
          key?: string;
          name: string;
          sampleShards?: number;
        },
        {
          config:
            | {
                capacity?: number;
                kind: "token bucket";
                maxReserved?: number;
                period: number;
                rate: number;
                shards?: number;
                start?: null;
              }
            | {
                capacity?: number;
                kind: "fixed window";
                maxReserved?: number;
                period: number;
                rate: number;
                shards?: number;
                start?: number;
              };
          shard: number;
          ts: number;
          value: number;
        }
      >;
      rateLimit: FunctionReference<
        "mutation",
        "internal",
        {
          config:
            | {
                capacity?: number;
                kind: "token bucket";
                maxReserved?: number;
                period: number;
                rate: number;
                shards?: number;
                start?: null;
              }
            | {
                capacity?: number;
                kind: "fixed window";
                maxReserved?: number;
                period: number;
                rate: number;
                shards?: number;
                start?: number;
              };
          count?: number;
          key?: string;
          name: string;
          reserve?: boolean;
          throws?: boolean;
        },
        { ok: true; retryAfter?: number } | { ok: false; retryAfter: number }
      >;
      resetRateLimit: FunctionReference<
        "mutation",
        "internal",
        { key?: string; name: string },
        null
      >;
    };
    time: {
      getServerTime: FunctionReference<"mutation", "internal", {}, number>;
    };
  };
  migrations: {
    lib: {
      cancel: FunctionReference<
        "mutation",
        "internal",
        { name: string },
        {
          batchSize?: number;
          cursor?: string | null;
          error?: string;
          isDone: boolean;
          latestEnd?: number;
          latestStart: number;
          name: string;
          next?: Array<string>;
          processed: number;
          state: "inProgress" | "success" | "failed" | "canceled" | "unknown";
        }
      >;
      cancelAll: FunctionReference<
        "mutation",
        "internal",
        { sinceTs?: number },
        Array<{
          batchSize?: number;
          cursor?: string | null;
          error?: string;
          isDone: boolean;
          latestEnd?: number;
          latestStart: number;
          name: string;
          next?: Array<string>;
          processed: number;
          state: "inProgress" | "success" | "failed" | "canceled" | "unknown";
        }>
      >;
      clearAll: FunctionReference<
        "mutation",
        "internal",
        { before?: number },
        null
      >;
      getStatus: FunctionReference<
        "query",
        "internal",
        { limit?: number; names?: Array<string> },
        Array<{
          batchSize?: number;
          cursor?: string | null;
          error?: string;
          isDone: boolean;
          latestEnd?: number;
          latestStart: number;
          name: string;
          next?: Array<string>;
          processed: number;
          state: "inProgress" | "success" | "failed" | "canceled" | "unknown";
        }>
      >;
      migrate: FunctionReference<
        "mutation",
        "internal",
        {
          batchSize?: number;
          cursor?: string | null;
          dryRun: boolean;
          fnHandle: string;
          name: string;
          next?: Array<{ fnHandle: string; name: string }>;
          oneBatchOnly?: boolean;
        },
        {
          batchSize?: number;
          cursor?: string | null;
          error?: string;
          isDone: boolean;
          latestEnd?: number;
          latestStart: number;
          name: string;
          next?: Array<string>;
          processed: number;
          state: "inProgress" | "success" | "failed" | "canceled" | "unknown";
        }
      >;
    };
  };
};
