import { beforeEach, describe, expect, it } from "vitest";
import { act, screen } from "@testing-library/react";
import { RegisterPage } from "./RegisterPage";
import { renderWithProviders } from "@/test/test-utils";
import {
  PACK_CODE_SIGNATURE_KEY,
  PACK_CODE_SIGNED_EVENT,
} from "@/features/legal/pack-code-signature";

/** Devuelve los 4 checkbox inputs por su posición en el DOM
 *  (`PawCheckbox` usa React.useId() para generar `paw-<hookId>`;
 *  en tests podemos buscarlos por role="checkbox" en el orden en
 *  que aparecen). Testing-library no siempre puede computar el
 *  accessible name cuando el label envuelve tanto el input como
 *  un `<span>` con el copy, así que usamos el orden estable del
 *  DOM. */
function legalCheckboxes() {
  const boxes = screen.getAllByRole("checkbox");
  return {
    terms: boxes[0],
    privacy: boxes[1],
    disclaimer: boxes[2],
    packCode: boxes[3],
  };
}

/** Simula la firma del Código de la Manada. La huellita está
 *  disabled — no se puede activar por click; solo con el
 *  CustomEvent que emite PackCodePage al firmar. Aquí lo
 *  disparamos manualmente para poder testear el flujo del
 *  register sin tener que montar la página del código. */
function signPackCode() {
  act(() => {
    window.dispatchEvent(new CustomEvent(PACK_CODE_SIGNED_EVENT));
  });
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

// Cada caso de este archivo tipea 6 campos + hace varios clicks —
// user.type() es intencionadamente lento (simula tipeo real). En
// paralelo con otras suites es fácil pasar los 5s default. Subimos
// el testTimeout del archivo para que no falle por CPU contention.
describe("RegisterPage — client validation", { timeout: 15000 }, () => {
  // localStorage persiste entre tests dentro del mismo archivo —
  // si un test dejó firma pack code guardada, el siguiente lo
  // encontraría en el mount y marcaría el checkbox sin que el
  // test lo haya pedido. Limpiamos para aislar cada caso.
  beforeEach(() => {
    window.localStorage.removeItem(PACK_CODE_SIGNATURE_KEY);
  });

  it("shows a 'contraseñas no coinciden' error when they mismatch", async () => {
    const { user } = renderWithProviders(<RegisterPage />);
    await user.type(screen.getByLabelText(/^nombre$/i), "Vale");
    await user.type(screen.getByLabelText(/^apellido$/i), "Pérez");
    await user.type(screen.getByLabelText(/email/i), "v@example.com");
    await user.type(screen.getByLabelText(/teléfono/i), "5512345678");
    await user.type(screen.getByLabelText(/^contraseña$/i), "abcd1234");
    await user.type(
      screen.getByLabelText(/repite la contraseña/i),
      "diferente",
    );
    // El `.refine()` de zod que dispara "las contraseñas no
    // coinciden" solo corre si primero pasa la validación de todo
    // el object. Con los 4 legal `z.literal(true)` en el schema,
    // debemos marcar los 3 clickeables + simular la firma del
    // pack code para que la validación llegue al refine y expose
    // el error de mismatch que queremos aserar.
    const { terms, privacy, disclaimer } = legalCheckboxes();
    await user.click(terms);
    await user.click(privacy);
    await user.click(disclaimer);
    signPackCode();
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
    await user.type(screen.getByLabelText(/teléfono/i), "5512345678");
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

  it("shows the four legal checkboxes with links", () => {
    renderWithProviders(<RegisterPage />);
    // Los 4 checkboxes están presentes en el DOM.
    expect(screen.getAllByRole("checkbox")).toHaveLength(4);
    // Los links abren en nueva pestaña para no perder el form.
    const termsLink = screen.getByRole("link", {
      name: /términos y condiciones/i,
    });
    expect(termsLink).toHaveAttribute("href", "/legal/terms");
    expect(termsLink).toHaveAttribute("target", "_blank");
    // Y el aviso de privacidad / disclaimer / código también.
    expect(
      screen.getByRole("link", { name: /aviso de privacidad/i }),
    ).toHaveAttribute("href", "/legal/privacy");
    expect(
      screen.getByRole("link", { name: /^disclaimer$/i }),
    ).toHaveAttribute("href", "/legal/disclaimer");
    // El pack code URL puede llevar query params (?name=…&phone=…)
    // si el user ya escribió esos campos — aquí el form está vacío,
    // así que sin query.
    expect(
      screen.getByRole("link", { name: /código de la manada/i }),
    ).toHaveAttribute("href", "/legal/codigo-de-la-manada");
  });

  it("rejects submit when the terms checkbox is not checked", async () => {
    const { user } = renderWithProviders(<RegisterPage />);
    await fillValidBaseForm(user);
    // Marcamos los otros 3 para aislar el error del que nos interesa.
    const { privacy, disclaimer } = legalCheckboxes();
    await user.click(privacy);
    await user.click(disclaimer);
    signPackCode();
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
    signPackCode();
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
    signPackCode();
    await user.click(screen.getByRole("button", { name: /crear cuenta/i }));

    expect(
      await screen.findByText(/debes aceptar el disclaimer/i),
    ).toBeInTheDocument();
  });

  it("rejects submit when the pack code checkbox is not signed", async () => {
    const { user } = renderWithProviders(<RegisterPage />);
    await fillValidBaseForm(user);
    // No firmamos el pack code — clickearlo directamente no
    // debería marcarlo (está disabled). El submit debe rebotar
    // con el error específico del pack code.
    const { terms, privacy, disclaimer } = legalCheckboxes();
    await user.click(terms);
    await user.click(privacy);
    await user.click(disclaimer);
    await user.click(screen.getByRole("button", { name: /crear cuenta/i }));

    expect(
      await screen.findByText(/debes aceptar el código de la manada/i),
    ).toBeInTheDocument();
  });
});
