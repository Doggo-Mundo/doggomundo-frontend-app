import { BrowserRouter } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { AppRouter } from "@/routes/AppRouter";
import { StripeProvider } from "@/features/payments/StripeProvider";
import { queryClient } from "@/lib/query-client";
import { SpriteDefs } from "@/components/brand/SpriteDefs";
import { EnvironmentBanner } from "@/components/environment/EnvironmentBanner";

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SpriteDefs />
      <EnvironmentBanner />
      <StripeProvider>
        <BrowserRouter>
          <AppRouter />
        </BrowserRouter>
        <Toaster richColors position="top-center" />
      </StripeProvider>
    </QueryClientProvider>
  );
}
