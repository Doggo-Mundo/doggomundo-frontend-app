import type { ReactElement, ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { render, type RenderOptions } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

interface RenderWithProvidersOptions extends RenderOptions {
  /** URL the MemoryRouter should mount on. */
  route?: string;
  /** If set, wrap the UI under `path`; useful for route params like `/pets/:id`. */
  path?: string;
  queryClient?: QueryClient;
}

export function makeTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: 0, gcTime: 0 },
      mutations: { retry: false },
    },
  });
}

/**
 * Render a component with the real app providers. Pass `path` + `route` to
 * simulate being deep-linked to a parameterized route.
 */
export function renderWithProviders(
  ui: ReactElement,
  {
    route = "/",
    path,
    queryClient = makeTestQueryClient(),
    ...rtl
  }: RenderWithProvidersOptions = {},
) {
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[route]}>
          {path ? (
            <Routes>
              <Route path={path} element={children} />
              <Route path="*" element={<div data-testid="other-route" />} />
            </Routes>
          ) : (
            children
          )}
        </MemoryRouter>
      </QueryClientProvider>
    );
  }

  return {
    user: userEvent.setup(),
    queryClient,
    ...render(ui, { wrapper: Wrapper, ...rtl }),
  };
}
