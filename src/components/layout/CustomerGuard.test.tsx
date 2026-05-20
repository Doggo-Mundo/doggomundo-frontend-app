import { describe, expect, it } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { Toaster } from "sonner";
import { CustomerGuard } from "./CustomerGuard";
import { useAuthStore } from "@/stores/auth-store";
import { mockCustomerUser } from "@/test/msw-handlers";

function renderAt(route: string) {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <Routes>
        <Route element={<CustomerGuard />}>
          <Route path="/" element={<div>customer-only</div>} />
        </Route>
        <Route path="/login" element={<div>login-page</div>} />
      </Routes>
      <Toaster />
    </MemoryRouter>,
  );
}

describe("CustomerGuard", () => {
  it("lets CUSTOMER users through", () => {
    useAuthStore.setState({
      accessToken: "t",
      user: mockCustomerUser,
      isAuthenticated: true,
    });
    renderAt("/");
    expect(screen.getByText(/customer-only/i)).toBeInTheDocument();
    useAuthStore.getState().logout();
  });

  it("logs out an ADMIN user and redirects to /login", async () => {
    useAuthStore.setState({
      accessToken: "t",
      user: { ...mockCustomerUser, user_type: "ADMIN" },
      isAuthenticated: true,
    });
    renderAt("/");
    expect(screen.getByText(/login-page/i)).toBeInTheDocument();
    await waitFor(() =>
      expect(useAuthStore.getState().isAuthenticated).toBe(false),
    );
  });

  it("kicks a STAFF user the same way", async () => {
    useAuthStore.setState({
      accessToken: "t",
      user: { ...mockCustomerUser, user_type: "STAFF" },
      isAuthenticated: true,
    });
    renderAt("/");
    expect(screen.getByText(/login-page/i)).toBeInTheDocument();
    await waitFor(() =>
      expect(useAuthStore.getState().isAuthenticated).toBe(false),
    );
  });
});
