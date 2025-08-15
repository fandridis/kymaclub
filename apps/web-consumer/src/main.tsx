import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { ConvexReactClient } from "convex/react";
import { RouterProvider } from "@tanstack/react-router";
import { createRouter } from "@tanstack/react-router";
import './lib/i18n';
import "./index.css";

const CONVEX_URL = import.meta.env.VITE_CONVEX_URL ?? 'https://colorful-ladybug-413.convex.cloud';

const convex = new ConvexReactClient(CONVEX_URL);

// Import the generated route tree
import { routeTree } from './routeTree.gen'

// Create a new router instance
const router = createRouter({ routeTree })

// Register the router instance for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ConvexAuthProvider client={convex}>
      <RouterProvider router={router} />
    </ConvexAuthProvider>
  </StrictMode>,
);
