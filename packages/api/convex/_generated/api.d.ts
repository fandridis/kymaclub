/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as actions_venue from "../actions/venue.js";
import type * as auth from "../auth.js";
import type * as http from "../http.js";
import type * as mutations_bookings from "../mutations/bookings.js";
import type * as mutations_classInstances from "../mutations/classInstances.js";
import type * as mutations_classTemplates from "../mutations/classTemplates.js";
import type * as mutations_core from "../mutations/core.js";
import type * as mutations_credits from "../mutations/credits.js";
import type * as mutations_uploads from "../mutations/uploads.js";
import type * as mutations_venues from "../mutations/venues.js";
import type * as queries_bookings from "../queries/bookings.js";
import type * as queries_classInstances from "../queries/classInstances.js";
import type * as queries_classTemplates from "../queries/classTemplates.js";
import type * as queries_core from "../queries/core.js";
import type * as queries_credits from "../queries/credits.js";
import type * as queries_uploads from "../queries/uploads.js";
import type * as queries_venues from "../queries/venues.js";
import type * as resendOTP from "../resendOTP.js";
import type * as testFunctions from "../testFunctions.js";
import type * as testResources from "../testResources.js";
import type * as triggers_index from "../triggers/index.js";
import type * as utils from "../utils.js";
import type * as waitlist from "../waitlist.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  "actions/venue": typeof actions_venue;
  auth: typeof auth;
  http: typeof http;
  "mutations/bookings": typeof mutations_bookings;
  "mutations/classInstances": typeof mutations_classInstances;
  "mutations/classTemplates": typeof mutations_classTemplates;
  "mutations/core": typeof mutations_core;
  "mutations/credits": typeof mutations_credits;
  "mutations/uploads": typeof mutations_uploads;
  "mutations/venues": typeof mutations_venues;
  "queries/bookings": typeof queries_bookings;
  "queries/classInstances": typeof queries_classInstances;
  "queries/classTemplates": typeof queries_classTemplates;
  "queries/core": typeof queries_core;
  "queries/credits": typeof queries_credits;
  "queries/uploads": typeof queries_uploads;
  "queries/venues": typeof queries_venues;
  resendOTP: typeof resendOTP;
  testFunctions: typeof testFunctions;
  testResources: typeof testResources;
  "triggers/index": typeof triggers_index;
  utils: typeof utils;
  waitlist: typeof waitlist;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
