import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { screen, waitFor } from "@testing-library/react";
import { PetEditPage } from "./PetEditPage";
import { renderWithProviders } from "@/test/test-utils";
import { server } from "@/test/msw-server";
import { makePet } from "@/test/fixtures";

const API = "http://localhost/api";

function setupPet(pet = makePet()) {
  server.use(
    http.get(`${API}/pets/${pet.id}/`, () => HttpResponse.json(pet)),
  );
  return pet;
}

describe("PetEditPage — microchip validation", () => {
  it("rejects a microchip with less than 15 digits", async () => {
    const pet = setupPet();
    const { user } = renderWithProviders(<PetEditPage />, {
      route: `/pets/${pet.id}/edit`,
      path: "/pets/:id/edit",
    });

    await waitFor(() =>
      expect(
        screen.getByRole("heading", { name: /editar perfil/i }),
      ).toBeInTheDocument(),
    );

    await user.type(screen.getByLabelText(/microchip/i), "123");
    await user.click(screen.getByRole("button", { name: /guardar cambios/i }));

    expect(
      await screen.findByText(/exactamente 15 dígitos/i),
    ).toBeInTheDocument();
  });

  it("rejects a microchip with non-digit characters", async () => {
    const pet = setupPet();
    const { user } = renderWithProviders(<PetEditPage />, {
      route: `/pets/${pet.id}/edit`,
      path: "/pets/:id/edit",
    });
    await waitFor(() =>
      expect(
        screen.getByRole("heading", { name: /editar perfil/i }),
      ).toBeInTheDocument(),
    );

    // 14 digits + one letter = 15 chars but not all digits
    await user.type(screen.getByLabelText(/microchip/i), "12345678901234A");
    await user.click(screen.getByRole("button", { name: /guardar cambios/i }));

    expect(
      await screen.findByText(/exactamente 15 dígitos/i),
    ).toBeInTheDocument();
  });

  it("accepts exactly 15 digits and PATCHes update-complete", async () => {
    const pet = setupPet();
    let patchedWith: Record<string, unknown> | null = null;
    server.use(
      http.patch(`${API}/pets/${pet.id}/update-complete/`, async ({ request }) => {
        patchedWith = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({ ...pet, microchip_id: "123456789012345" });
      }),
    );

    const { user } = renderWithProviders(<PetEditPage />, {
      route: `/pets/${pet.id}/edit`,
      path: "/pets/:id/edit",
    });
    await waitFor(() =>
      expect(
        screen.getByRole("heading", { name: /editar perfil/i }),
      ).toBeInTheDocument(),
    );

    await user.type(screen.getByLabelText(/microchip/i), "123456789012345");
    await user.click(screen.getByRole("button", { name: /guardar cambios/i }));

    await waitFor(() =>
      expect(patchedWith).toEqual({ microchip_id: "123456789012345" }),
    );
  });
});

describe("PetEditPage — isDirty gating", () => {
  it("disables 'Guardar cambios' when no field has been touched", async () => {
    const pet = setupPet();
    renderWithProviders(<PetEditPage />, {
      route: `/pets/${pet.id}/edit`,
      path: "/pets/:id/edit",
    });
    await waitFor(() =>
      expect(
        screen.getByRole("heading", { name: /editar perfil/i }),
      ).toBeInTheDocument(),
    );

    const btn = screen.getByRole("button", {
      name: /sin cambios por guardar/i,
    });
    expect(btn).toBeDisabled();
  });

  it("enables the button after a field becomes dirty", async () => {
    const pet = setupPet();
    const { user } = renderWithProviders(<PetEditPage />, {
      route: `/pets/${pet.id}/edit`,
      path: "/pets/:id/edit",
    });
    await waitFor(() =>
      expect(
        screen.getByRole("heading", { name: /editar perfil/i }),
      ).toBeInTheDocument(),
    );

    await user.type(screen.getByLabelText(/^nombre$/i), "z"); // append "z"

    const btn = screen.getByRole("button", { name: /guardar cambios/i });
    expect(btn).not.toBeDisabled();
  });
});
