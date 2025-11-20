import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { ConvexReactClient } from "convex/react";
import { ConvexQueryCacheProvider } from "convex-helpers/react/cache";
import { RouterProvider } from "@tanstack/react-router";
import { createRouter } from "@tanstack/react-router";
import { NuqsAdapter } from 'nuqs/adapters/react'
import "./index.css";

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string);

// Import the generated route tree
import { routeTree } from './routeTree.gen'
import { ErrorBoundary } from "./components/error-boundary";
import { SciFiLoader } from "./components/sci-fi-loader";
import { useCurrentUser } from "./hooks/use-current-user";

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
      <ConvexAuthProvider client={convex}>
        <ConvexQueryCacheProvider>
          <InnerApp />
        </ConvexQueryCacheProvider>
      </ConvexAuthProvider>
    </ErrorBoundary>
  </StrictMode>,
);

import { SciFiBackground } from "./components/ui/sci-fi-background";

function InnerApp() {
  const { user, isLoading } = useCurrentUser()

  if (isLoading) {
    return (
      <SciFiBackground className="flex items-center justify-center">
        <SciFiLoader fullScreen={true} />
      </SciFiBackground>
    )
  }

  return (
    <NuqsAdapter>
      <RouterProvider router={router} />
    </NuqsAdapter>
  )
}