# Google Analytics 4 Integration

This app includes a drop-in GA4 setup that handles SPA pageviews on route changes and provides helper functions for custom events.

## Quick Start

1. **Set your GA4 Measurement ID** in `.env`:
   ```
   VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
   ```

2. **On Cloudflare Pages/Workers**, set the same environment variable in your build settings.

## Usage Examples

### Custom Events

```tsx
import { trackEvent } from './analytics/AnalyticsProvider';

// Button click tracking
<button
  onClick={() =>
    trackEvent("class_booking", { class_id: "cls_123", method: "credit" })
  }
>
  Book Class
</button>

// Sign up success
trackEvent("sign_up", { method: "email" });

// Purchase (GA4 recommended parameters)
trackEvent("purchase", {
  transaction_id: "order_789",
  currency: "EUR",
  value: 29.99,
  items: [
    { item_id: "class_001", item_name: "Morning Yoga", quantity: 1 },
  ],
});
```

### User Context (Optional)

```tsx
import { setUserId, setUserProperties } from './analytics/AnalyticsProvider';

// Set user ID for cross-device tracking
setUserId(auth.user.id);

// Set user properties for segmentation
setUserProperties({ plan: "pro", role: "business" });
```

## Features

- ✅ **Automatic pageview tracking** on React Router navigation
- ✅ **Custom event tracking** with `trackEvent()` helper
- ✅ **User ID and properties** for cross-device tracking
- ✅ **Production-only tracking** (disabled in development)
- ✅ **TypeScript support** with proper gtag declarations
- ✅ **Safe gtag wrapper** that handles missing GA gracefully

## How It Works

1. **GA4 snippet** is injected into `app/root.tsx` with `send_page_view: false`
2. **AnalyticsProvider** listens to React Router location changes and fires `page_view` events
3. **Helper functions** provide safe wrappers around `window.gtag`
4. **Environment-based** - only tracks when `VITE_GA_MEASUREMENT_ID` is set and in production

## Development vs Production

- **Development**: No tracking (GA is disabled)
- **Production**: Full tracking when `VITE_GA_MEASUREMENT_ID` is set

To test locally, temporarily remove the `IS_PROD` guards or build a preview with your Cloudflare environment variables set.
