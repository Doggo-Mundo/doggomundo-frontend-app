import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { AppRouter } from "@/routes/AppRouter";
import { StripeProvider } from "@/features/payments/StripeProvider";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <StripeProvider>
        <BrowserRouter>
          <AppRouter />
        </BrowserRouter>
        <Toaster richColors position="top-center" />
      </StripeProvider>
    </QueryClientProvider>
  );
}
