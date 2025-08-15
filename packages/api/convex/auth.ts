import { convexAuth, EmailConfig } from "@convex-dev/auth/server";
import { Password } from "@convex-dev/auth/providers/Password";
import GitHub from "@auth/core/providers/github";
import { ResendOTP } from "./resendOTP";

// TODO: Move it somewhere else, if used.
const frontendBaseUrls = {
  consumer: "http://localhost:5173",  // "http://localhost:5173",
  business: "http://localhost:5174"   // "http://localhost:5173/business",
}

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
    console.log("Test mode: Skipping email send to", email);
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
      // console.log('AFTER USER CREATED OR UPDATED', args);
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
