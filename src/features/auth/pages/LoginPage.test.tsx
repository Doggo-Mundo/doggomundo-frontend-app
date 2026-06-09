import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { screen, waitFor } from "@testing-library/react";
import { LoginPage } from "./LoginPage";
import { renderWithProviders } from "@/test/test-utils";
import { server } from "@/test/msw-server";
import { mockCustomerUser } from "@/test/msw-handlers";
import { useAuthStore } from "@/stores/auth-store";

const API = "http://localhost/api";

describe("LoginPage — client validation", () => {
  it("rejects empty email", async () => {
    const { user } = renderWithProviders(<LoginPage />);
    await user.click(screen.getByRole("button", { name: /entrar/i }));
    expect(await screen.findByText(/email inválido/i)).toBeInTheDocument();
  });

  it("rejects bad email format", async () => {
    const { user } = renderWithProviders(<LoginPage />);
    await user.type(screen.getByLabelText(/email/i), "not-an-email");
    await user.type(screen.getByLabelText(/contraseña/i, { selector: "input" }), "whatever");
    await user.click(screen.getByRole("button", { name: /entrar/i }));
    expect(await screen.findByText(/email inválido/i)).toBeInTheDocument();
  });

  it("requires a password", async () => {
    const { user } = renderWithProviders(<LoginPage />);
    await user.type(screen.getByLabelText(/email/i), "foo@bar.com");
    await user.click(screen.getByRole("button", { name: /entrar/i }));
    expect(
      await screen.findByText(/contraseña es requerida/i),
    ).toBeInTheDocument();
  });
});

describe("LoginPage — server error handling", () => {
  it("surfaces 401 as 'Credenciales inválidas'", async () => {
    server.use(
      http.post(`${API}/auth/login/`, () =>
        HttpResponse.json({ detail: "no credentials" }, { status: 401 }),
      ),
    );
    const { user } = renderWithProviders(<LoginPage />);
    await user.type(screen.getByLabelText(/email/i), "foo@bar.com");
    await user.type(screen.getByLabelText(/contraseña/i, { selector: "input" }), "wrong");
    await user.click(screen.getByRole("button", { name: /entrar/i }));
    expect(
      await screen.findByText(/credenciales inválidas/i),
    ).toBeInTheDocument();
  });

  it("maps field-level 400 errors to the form", async () => {
    server.use(
      http.post(`${API}/auth/login/`, () =>
        HttpResponse.json(
          { email: ["Usuario no verificado"] },
          { status: 400 },
        ),
      ),
    );
    const { user } = renderWithProviders(<LoginPage />);
    await user.type(screen.getByLabelText(/email/i), "foo@bar.com");
    await user.type(screen.getByLabelText(/contraseña/i, { selector: "input" }), "whatever");
    await user.click(screen.getByRole("button", { name: /entrar/i }));
    expect(
      await screen.findByText(/usuario no verificado/i),
    ).toBeInTheDocument();
  });
});

describe("LoginPage — success flow", () => {
  it("stores user + tokens on 200 and hydrates the auth store", async () => {
    useAuthStore.getState().logout();
    server.use(
      http.post(`${API}/auth/login/`, () =>
        HttpResponse.json(
          {
            user: mockCustomerUser,
            tokens: { access: "a-token", refresh: "r-token" },
          },
          { status: 200 },
        ),
      ),
    );
    const { user } = renderWithProviders(<LoginPage />);
    await user.type(
      screen.getByLabelText(/email/i),
      "valentina@example.com",
    );
    await user.type(screen.getByLabelText(/contraseña/i, { selector: "input" }), "cliente123");
    await user.click(screen.getByRole("button", { name: /entrar/i }));

    await waitFor(() =>
      expect(useAuthStore.getState().isAuthenticated).toBe(true),
    );
    expect(useAuthStore.getState().user?.email).toBe(
      "valentina@example.com",
    );
    expect(localStorage.getItem("refresh_token")).toBe("r-token");
  });

  it("lets admin/staff users into the customer app (single account)", async () => {
    useAuthStore.getState().logout();
    server.use(
      http.post(`${API}/auth/login/`, () =>
        HttpResponse.json(
          {
            user: { ...mockCustomerUser, user_type: "ADMIN" },
            tokens: { access: "a", refresh: "r" },
          },
          { status: 200 },
        ),
      ),
    );
    const { user } = renderWithProviders(<LoginPage />);
    await user.type(screen.getByLabelText(/email/i), "admin@x.com");
    await user.type(screen.getByLabelText(/contraseña/i, { selector: "input" }), "pw");
    await user.click(screen.getByRole("button", { name: /entrar/i }));

    await waitFor(() =>
      expect(useAuthStore.getState().isAuthenticated).toBe(true),
    );
  });
});
