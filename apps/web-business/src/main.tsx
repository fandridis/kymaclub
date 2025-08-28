import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { ConvexReactClient } from "convex/react";
import { ConvexQueryCacheProvider } from "convex-helpers/react/cache";
import { RouterProvider } from "@tanstack/react-router";
import { createRouter } from "@tanstack/react-router";
import { NuqsAdapter } from 'nuqs/adapters/react'
import './lib/i18n';
import "./index.css";

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string);

// Import the generated route tree
import { routeTree } from './routeTree.gen'
import { AuthSync } from "./components/auth-sync";
import { ErrorBoundary } from "./components/error-boundary";
import { useAuth } from "./components/stores/auth";
import { SpinningCircles } from "./components/spinning-circles";
import i18n from "./lib/i18n";
import { I18nextProvider } from "react-i18next";

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
    <ErrorBoundary>
      <I18nextProvider i18n={i18n}>
        <ConvexAuthProvider client={convex}>
          <ConvexQueryCacheProvider>
            <AuthSync>
              <InnerApp />
            </AuthSync>
          </ConvexQueryCacheProvider>
        </ConvexAuthProvider>
      </I18nextProvider>
    </ErrorBoundary>
  </StrictMode>,
);

function InnerApp() {
  const { user } = useAuth()

  if (user === undefined) {
    return <SpinningCircles />
  }

  return (
    <NuqsAdapter>
      <RouterProvider router={router} />
    </NuqsAdapter>
  )
}