import { QueryClient } from "@tanstack/react-query";

/**
 * Singleton QueryClient shared across the app.
 *
 * Extracted from App.tsx so non-React modules (the axios 401
 * interceptor, the logout helper, etc.) can access it without
 * having to be React components / use hooks. Keep this file
 * dependency-free of anything user-scoped so importing it can't
 * accidentally trigger side effects.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});
