import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { auth } from "./auth";

const http = httpRouter();

auth.addHttpRoutes(http);

// Unified Stripe webhook endpoint
http.route({
  path: "/stripe/webhooks",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const signature = request.headers.get("stripe-signature");
    if (!signature) {
      return new Response("Missing stripe-signature header", { status: 400 });
    }

    const payload = await request.text();
    
    const result = await ctx.runAction(internal.actions.payments.processWebhook, {
      signature,
      payload,
    });

    if (result.success) {
      return new Response("OK", { status: 200 });
    } else {
      console.error("Stripe webhook error:", result.error);
      return new Response("Webhook Error", { status: 400 });
    }
  }),
});

export default http;
