import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { RegisterPage } from "./RegisterPage";
import { renderWithProviders } from "@/test/test-utils";

/** Devuelve los 3 checkbox inputs por su id (`PawCheckbox` usa
 *  React.useId() para generar `paw-<hookId>`; en tests podemos
 *  buscarlos por role="checkbox" en el orden en que aparecen).
 *  Testing-library no siempre puede computar el accessible name
 *  cuando el label envuelve tanto el input como un `<span>` con
 *  el copy, así que usamos el orden estable del DOM. */
function legalCheckboxes() {
  const boxes = screen.getAllByRole("checkbox");
  return {
    terms: boxes[0],
    privacy: boxes[1],
    disclaimer: boxes[2],
  };
}

async function fillValidBaseForm(
  user: ReturnType<typeof renderWithProviders>["user"],
) {
  await user.type(screen.getByLabelText(/^nombre$/i), "Vale");
  await user.type(screen.getByLabelText(/^apellido$/i), "Pérez");
  await user.type(screen.getByLabelText(/email/i), "v@example.com");
  await user.type(screen.getByLabelText(/teléfono/i), "+525512345678");
  await user.type(screen.getByLabelText(/^contraseña$/i), "abcd1234");
  await user.type(screen.getByLabelText(/repite la contraseña/i), "abcd1234");
}

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
    // El `.refine()` de zod que dispara "las contraseñas no
    // coinciden" solo corre si primero pasa la validación de todo
    // el object. Con los 3 legal `z.literal(true)` en el schema,
    // debemos marcarlos aquí para que la validación llegue al
    // refine y expose el error de mismatch que queremos aserar.
    const { terms, privacy, disclaimer } = legalCheckboxes();
    await user.click(terms);
    await user.click(privacy);
    await user.click(disclaimer);
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

  // ------------------------------------------------------------------
  // F-G.2 — consentimientos legales
  // ------------------------------------------------------------------

  it("shows the three legal checkboxes with links", () => {
    renderWithProviders(<RegisterPage />);
    // Los 3 checkboxes están presentes en el DOM.
    expect(screen.getAllByRole("checkbox")).toHaveLength(3);
    // Los links abren en nueva pestaña para no perder el form.
    const termsLink = screen.getByRole("link", {
      name: /términos y condiciones/i,
    });
    expect(termsLink).toHaveAttribute("href", "/legal/terms");
    expect(termsLink).toHaveAttribute("target", "_blank");
    // Y el aviso de privacidad / disclaimer también.
    expect(
      screen.getByRole("link", { name: /aviso de privacidad/i }),
    ).toHaveAttribute("href", "/legal/privacy");
    expect(
      screen.getByRole("link", { name: /^disclaimer$/i }),
    ).toHaveAttribute("href", "/legal/disclaimer");
  });

  it("rejects submit when the terms checkbox is not checked", async () => {
    const { user } = renderWithProviders(<RegisterPage />);
    await fillValidBaseForm(user);
    // Marcamos privacy + disclaimer para aislar el error del que
    // nos interesa.
    const { privacy, disclaimer } = legalCheckboxes();
    await user.click(privacy);
    await user.click(disclaimer);
    await user.click(screen.getByRole("button", { name: /crear cuenta/i }));

    expect(
      await screen.findByText(/debes aceptar los términos/i),
    ).toBeInTheDocument();
  });

  it("rejects submit when the privacy checkbox is not checked", async () => {
    const { user } = renderWithProviders(<RegisterPage />);
    await fillValidBaseForm(user);
    const { terms, disclaimer } = legalCheckboxes();
    await user.click(terms);
    await user.click(disclaimer);
    await user.click(screen.getByRole("button", { name: /crear cuenta/i }));

    expect(
      await screen.findByText(/debes aceptar el aviso de privacidad/i),
    ).toBeInTheDocument();
  });

  it("rejects submit when the disclaimer checkbox is not checked", async () => {
    const { user } = renderWithProviders(<RegisterPage />);
    await fillValidBaseForm(user);
    const { terms, privacy } = legalCheckboxes();
    await user.click(terms);
    await user.click(privacy);
    await user.click(screen.getByRole("button", { name: /crear cuenta/i }));

    expect(
      await screen.findByText(/debes aceptar el disclaimer/i),
    ).toBeInTheDocument();
  });
});
