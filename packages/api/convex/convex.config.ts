import { defineApp } from "convex/server";
import resend from "@convex-dev/resend/convex.config";
import pushNotifications from "@convex-dev/expo-push-notifications/convex.config";

const app = defineApp();

app.use(resend);
app.use(pushNotifications);

export default app;
