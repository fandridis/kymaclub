import { useEffect } from "react";
import { useLocation } from "react-router";

const GA_ID = "G-L5TMY0Y43V";
const IS_PROD = import.meta.env.PROD;

/** Safe wrapper around window.gtag */
function gtag(...args: any[]) {
    if (typeof window !== "undefined" && typeof window.gtag === "function") {
        window.gtag(...args);
    }
}

/** Send a GA4 custom event anywhere in your app */
export function trackEvent(
    action: string,
    params?: Record<string, any>
) {
    if (!IS_PROD) return;
    gtag("event", action, { ...params, send_to: GA_ID });
}

/** Optionally set a stable user id for cross-device tracking */
export function setUserId(userId: string) {
    if (!IS_PROD) return;
    gtag("config", GA_ID, { user_id: userId });
}

/** Optionally set user properties for segmentation (plan, role, etc.) */
export function setUserProperties(props: Record<string, any>) {
    if (!IS_PROD) return;
    gtag("set", "user_properties", props);
}

/** Tracks SPA pageviews on every React Router navigation */
export function AnalyticsProvider() {
    const location = useLocation();

    useEffect(() => {
        if (!IS_PROD) return;

        const page_path =
            location.pathname + (location.search || "") + (location.hash || "");

        gtag("event", "page_view", {
            page_title: document.title,
            page_location: window.location.href,
            page_path,
            send_to: GA_ID,
        });
    }, [location]);

    return null;
}
