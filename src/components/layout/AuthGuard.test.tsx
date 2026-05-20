import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { render } from "@testing-library/react";
import { AuthGuard } from "./AuthGuard";
import { useAuthStore } from "@/stores/auth-store";
import { mockCustomerUser } from "@/test/msw-handlers";

function renderAt(route: string) {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <Routes>
        <Route element={<AuthGuard />}>
          <Route path="/" element={<div>inicio</div>} />
        </Route>
        <Route path="/login" element={<div>login-page</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("AuthGuard", () => {
  it("redirects unauthenticated users to /login", () => {
    useAuthStore.getState().logout();
    renderAt("/");
    expect(screen.getByText(/login-page/i)).toBeInTheDocument();
  });

  it("renders the protected tree when authenticated", () => {
    useAuthStore.setState({
      accessToken: "t",
      user: mockCustomerUser,
      isAuthenticated: true,
    });
    renderAt("/");
    expect(screen.getByText(/inicio/i)).toBeInTheDocument();
    useAuthStore.getState().logout();
  });
});
