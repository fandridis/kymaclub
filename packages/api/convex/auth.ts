import { convexAuth, EmailConfig } from "@convex-dev/auth/server";
import { Password } from "@convex-dev/auth/providers/Password";
import GitHub from "@auth/core/providers/github";
import { ResendOTP } from "./resendOTP";
import { ConvexError } from "convex/values";
import { ERROR_CODES } from "../utils/errorCodes";

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
    Password,
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

      if (!email) {
        return;
      }

      // Get all users with this email
      const users = await ctx.db
        .query("users")
        .withIndex("email", (q) => q.eq("email", email))
        .collect();

      // Filter to non-deleted users excluding current one
      const otherUsers = users.filter(u =>
        u._id !== args.userId && !u.deleted
      );

      // If this is a new email (no other valid users), check authorization
      if (otherUsers.length === 0) {
        // Check whitelist via authorized business emails
        const authorized = await ctx.db
          .query("authorizedBusinessEmails")
          .withIndex("by_email", (q) => q.eq("email", email))
          .filter((q) => q.neq(q.field("deleted"), true))
          .first();

        if (!authorized || (authorized.expiresAt && authorized.expiresAt < Date.now())) {
          // Soft delete unauthorized user
          await ctx.db.patch(args.userId, {
            deleted: true,
            deletedAt: Date.now(),
          });

          throw new ConvexError({
            message: "Business account creation is by invitation only. Please contact support@orcavo.com to request access.",
            code: ERROR_CODES.ACCOUNT_NOT_AUTHORIZED,
          });
        }
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
