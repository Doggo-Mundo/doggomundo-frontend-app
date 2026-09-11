import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { screen, waitFor } from "@testing-library/react";
import { BusinessUnitPickerPage } from "./BusinessUnitPickerPage";
import { renderWithProviders } from "@/test/test-utils";
import { server } from "@/test/msw-server";

const API = "http://localhost/api";

/** Location fixture con solo las BUs indicadas. */
function locationWithBUs(codes: string[]) {
  return {
    count: 1,
    next: null,
    previous: null,
    results: [
      {
        id: "loc-carso",
        name: "Carso Palmas",
        address: "Av. de las Palmas",
        maps_url: "",
        phone: "",
        email: "",
        is_active: true,
        business_units: codes.map((code, idx) => ({
          id: `bu-${idx}`,
          code,
          name: code,
          is_active: true,
        })),
      },
    ],
  };
}

describe("BusinessUnitPickerPage — data-driven visibility", () => {
  it("hides BUs that are not registered in any location", async () => {
    // Carso Palmas tiene autolavado + grooming + vet + foto —
    // pero NO otras. La única bookable no listada aún es FOTO,
    // que se agrega en el test siguiente.
    server.use(
      http.get(`${API}/locations/`, () =>
        HttpResponse.json(locationWithBUs(["AUTOLAVADO", "GROOMING", "VET"])),
      ),
    );
    renderWithProviders(<BusinessUnitPickerPage />);
    // Los que existen se ven:
    expect(
      await screen.findByRole("button", { name: /autolavado/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /grooming profesional/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /veterinaria/i }),
    ).toBeInTheDocument();
    // Doggo Foto NO — nadie lo ofrece.
    await waitFor(() =>
      expect(
        screen.queryByRole("button", { name: /doggo foto/i }),
      ).not.toBeInTheDocument(),
    );
  });

  it("shows a BU as soon as at least one location registers it", async () => {
    server.use(
      http.get(`${API}/locations/`, () =>
        HttpResponse.json(
          locationWithBUs(["AUTOLAVADO", "GROOMING", "VET", "FOTO"]),
        ),
      ),
    );
    renderWithProviders(<BusinessUnitPickerPage />);
    expect(
      await screen.findByRole("button", { name: /doggo foto/i }),
    ).toBeInTheDocument();
  });

  it("keeps all bookable BUs visible while locations are loading", async () => {
    // Fetch tarda (no responde). No queremos esconder opciones
    // antes de tener data — mejor mostrar de más que engañar al
    // usuario con una lista prematuramente vacía.
    server.use(
      http.get(`${API}/locations/`, async () => {
        await new Promise((r) => setTimeout(r, 5000));
        return HttpResponse.json(locationWithBUs([]));
      }),
    );
    renderWithProviders(<BusinessUnitPickerPage />);
    expect(
      await screen.findByRole("button", { name: /autolavado/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /doggo foto/i }),
    ).toBeInTheDocument();
  });
});
