import { BrowserRouter } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { AppRouter } from "@/routes/AppRouter";
import { StripeProvider } from "@/features/payments/StripeProvider";
import { queryClient } from "@/lib/query-client";

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
