import { convexAuth, EmailConfig } from "@convex-dev/auth/server";
import { Password } from "@convex-dev/auth/providers/Password";
import GitHub from "@auth/core/providers/github";
import { ResendOTPPasswordReset } from "./ResendOTPPasswordReset";
import { ResendOTP } from "./resendOTP";
import { ConvexError } from "convex/values";
import { ERROR_CODES } from "../utils/errorCodes";
import type { MutationCtx } from "./_generated/server";

// Removed unused frontendBaseUrls - can be added back when needed for specific auth flows

// Custom test provider
// Custom test email provider
const TestEmailProvider: EmailConfig = {
  id: "test-email",
  name: "Test Email",
  type: "email",
  maxAge: 60 * 60 * 24, // 24 hours
  sendVerificationRequest: async ({ identifier: email, url, provider, token }) => {
    // In test mode, we don't actually send emails
    // Just log for debugging if needed
  },
  // You might need to add other required fields depending on your version
};

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    Password({ reset: ResendOTPPasswordReset }),
    GitHub,
    ResendOTP,
    ...(process.env.NODE_ENV === "test" || process.env.ENABLE_TEST_AUTH === "true"
      ? [TestEmailProvider]
      : []),
  ],
  callbacks: {
    async redirect({ redirectTo }) {
      return redirectTo;
    },
    async afterUserCreatedOrUpdated(ctx, args) {
      const email = args.profile?.email;

      console.log("[auth] afterUserCreatedOrUpdated callback invoked", {
        email,
        userId: args.userId,
        name: args.profile?.name,
      });

      if (!email) {
        console.log("[auth] No email found, skipping authorization check");
        return;
      }

      // Type the context properly for our schema
      const typedCtx = ctx as MutationCtx;

      // Get the user to check if this is a new signup
      const user = await typedCtx.db.get(args.userId);
      if (!user) {
        return;
      }

      // Check if user was just created (within last 10 seconds)
      // This tells us if this is a new signup vs returning user
      const isNewSignup = user._creationTime && (Date.now() - user._creationTime) < 10000;

      if (isNewSignup) {
        console.log("[auth] New signup detected - checking authorization");

        // Check whitelist via authorized business emails
        const authorized = await typedCtx.db
          .query("authorizedBusinessEmails")
          .withIndex("by_email", (q) => q.eq("email", email))
          .filter((q) => q.neq(q.field("deleted"), true))
          .first();

        const isAuthorizedBusiness = authorized && (!authorized.expiresAt || authorized.expiresAt >= Date.now());

        console.log("[auth] Authorization check result:", {
          foundInWhitelist: !!authorized,
          isExpired: authorized && authorized.expiresAt && authorized.expiresAt < Date.now(),
          isAuthorizedBusiness,
        });

        // Determine signup source based on authorization status
        // If user is authorized for business, assume web-business signup
        // Otherwise, assume consumer signup (mobile or web)
        let signupSource: "mobile-consumer" | "web-consumer" | "web-business";

        if (isAuthorizedBusiness) {
          // Authorized = business signup attempt
          signupSource = "web-business";
          console.log("[auth] Business signup detected - authorization confirmed");
        } else {
          // Not authorized = consumer signup (mobile already has location gate)
          signupSource = "mobile-consumer";
          console.log("[auth] Consumer signup - no authorization required");
        }

        // Set signup source on user
        await typedCtx.db.patch(args.userId, {
          signupSource,
        });

        // Only throw error if attempting business signup without authorization
        // Consumer signups should always be allowed (already has region gate in mobile app)
        if (signupSource === "web-business") {
          if (!authorized || (authorized.expiresAt && authorized.expiresAt < Date.now())) {
            console.log("[auth] Business signup NOT authorized - throwing error", { userId: args.userId });

            throw new ConvexError({
              message: "Business account creation is by invitation only. Please contact support@orcavo.com to request access.",
              code: ERROR_CODES.ACCOUNT_NOT_AUTHORIZED,
            });
          }

          console.log("[auth] Business signup authorized - account creation allowed");
        } else {
          console.log("[auth] Consumer signup - account creation allowed");
        }
      } else {
        console.log("[auth] Returning user - no authorization check needed");
      }
    }
  },
});


// import { convexAuth } from "@convex-dev/auth/server";
// import { Email } from "@convex-dev/auth/providers/Email";
// import { Password } from "@convex-dev/auth/providers/Password";

// // Configure auth with both Email (production) and Password (testing)
// export const { auth, signIn, signOut, store } = convexAuth({
//   providers: [
//     Email({
//       // your email config for production
//     }),
//     // Password provider only enabled in test environments
//     ...(process.env.ENABLE_TEST_AUTH === "true" 
//       ? [Password({
//           // Optional: customize password requirements for test
//           profile(params) {
//             return {
//               email: params.email as string,
//               name: params.name as string,
//             };
//           },
//         })] 
//       : []
//     ),
//   ],
// });
