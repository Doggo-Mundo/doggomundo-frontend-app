import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { RegisterPage } from "./RegisterPage";
import { renderWithProviders } from "@/test/test-utils";

describe("RegisterPage — client validation", () => {
  it("shows a 'contraseñas no coinciden' error when they mismatch", async () => {
    const { user } = renderWithProviders(<RegisterPage />);
    await user.type(screen.getByLabelText(/^nombre$/i), "Vale");
    await user.type(screen.getByLabelText(/^apellido$/i), "Pérez");
    await user.type(screen.getByLabelText(/email/i), "v@example.com");
    await user.type(screen.getByLabelText(/teléfono/i), "+525512345678");
    await user.type(screen.getByLabelText(/^contraseña$/i), "abcd1234");
    await user.type(
      screen.getByLabelText(/repite la contraseña/i),
      "diferente",
    );
    await user.click(screen.getByRole("button", { name: /crear cuenta/i }));

    expect(
      await screen.findByText(/las contraseñas no coinciden/i),
    ).toBeInTheDocument();
  });

  it("rejects an invalid Mexican phone", async () => {
    const { user } = renderWithProviders(<RegisterPage />);
    await user.type(screen.getByLabelText(/^nombre$/i), "Vale");
    await user.type(screen.getByLabelText(/^apellido$/i), "Pérez");
    await user.type(screen.getByLabelText(/email/i), "v@example.com");
    await user.type(screen.getByLabelText(/teléfono/i), "abc");
    await user.type(screen.getByLabelText(/^contraseña$/i), "abcd1234");
    await user.type(screen.getByLabelText(/repite la contraseña/i), "abcd1234");
    await user.click(screen.getByRole("button", { name: /crear cuenta/i }));

    expect(
      await screen.findByText(/teléfono inválido/i),
    ).toBeInTheDocument();
  });

  it("rejects a password shorter than 8 chars", async () => {
    const { user } = renderWithProviders(<RegisterPage />);
    await user.type(screen.getByLabelText(/^nombre$/i), "Vale");
    await user.type(screen.getByLabelText(/^apellido$/i), "Pérez");
    await user.type(screen.getByLabelText(/email/i), "v@example.com");
    await user.type(screen.getByLabelText(/teléfono/i), "+525512345678");
    await user.type(screen.getByLabelText(/^contraseña$/i), "short");
    await user.type(screen.getByLabelText(/repite la contraseña/i), "short");
    await user.click(screen.getByRole("button", { name: /crear cuenta/i }));

    expect(
      await screen.findByText(/mínimo 8 caracteres/i),
    ).toBeInTheDocument();
  });
});
