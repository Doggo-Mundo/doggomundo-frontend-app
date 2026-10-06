import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { render } from "@testing-library/react";
import { GuestGuard } from "./GuestGuard";
import { useAuthStore } from "@/stores/auth-store";
import { mockCustomerUser } from "@/test/msw-handlers";

function renderAt(route: string) {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <Routes>
        <Route element={<GuestGuard />}>
          <Route path="/login" element={<div>login-page</div>} />
        </Route>
        <Route path="/" element={<div>inicio</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("GuestGuard", () => {
  it("renders the guest tree when not authenticated", () => {
    useAuthStore.getState().logout();
    renderAt("/login");
    expect(screen.getByText(/login-page/i)).toBeInTheDocument();
  });

  it("redirects authenticated users away to /", () => {
    useAuthStore.setState({
      accessToken: "t",
      user: mockCustomerUser,
      isAuthenticated: true,
    });
    renderAt("/login");
    expect(screen.getByText(/inicio/i)).toBeInTheDocument();
    useAuthStore.getState().logout();
  });
});
