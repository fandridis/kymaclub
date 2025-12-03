import { defineApp } from "convex/server";
import resend from "@convex-dev/resend/convex.config";
import pushNotifications from "@convex-dev/expo-push-notifications/convex.config";
import rateLimiter from "@convex-dev/rate-limiter/convex.config";
import migrations from "@convex-dev/migrations/convex.config";

const app = defineApp();

app.use(resend);
app.use(pushNotifications);
app.use(rateLimiter);
app.use(migrations);

export default app;
