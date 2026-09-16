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

/** Catalog fixture con un servicio activo por cada BU indicada — el
 *  wizard cruza contra servicios activos para no mostrar tipos vacíos. */
function servicesForBUs(codes: string[]) {
  return {
    count: codes.length,
    next: null,
    previous: null,
    results: codes.map((code, idx) => ({
      id: `svc-${idx}`,
      name: `Servicio ${code}`,
      business_unit: `bu-${idx}`,
      business_unit_code: code,
      business_unit_name: code,
      base_price: "100.00",
      base_duration_minutes: 30,
      bookable: true,
      requires_pet: false,
      is_active: true,
    })),
  };
}

describe("BusinessUnitPickerPage — data-driven visibility", () => {
  it("hides BUs that are not registered in any location", async () => {
    // Carso Palmas tiene AUTOLAVADO (Doggo Bath) + GROOMING + VET —
    // pero NO FOTO. Además todas esas BUs tienen servicios activos.
    server.use(
      http.get(`${API}/locations/`, () =>
        HttpResponse.json(locationWithBUs(["AUTOLAVADO", "GROOMING", "VET"])),
      ),
      http.get(`${API}/services/catalog/`, () =>
        HttpResponse.json(servicesForBUs(["AUTOLAVADO", "GROOMING", "VET"])),
      ),
    );
    renderWithProviders(<BusinessUnitPickerPage />);
    // Los que existen se ven (AUTOLAVADO renombrado a Doggo Bath,
    // VET a Alianza con Vet):
    expect(
      await screen.findByRole("button", { name: /doggo bath/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /grooming profesional/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /alianza con vet/i }),
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
      http.get(`${API}/services/catalog/`, () =>
        HttpResponse.json(
          servicesForBUs(["AUTOLAVADO", "GROOMING", "VET", "FOTO"]),
        ),
      ),
    );
    renderWithProviders(<BusinessUnitPickerPage />);
    expect(
      await screen.findByRole("button", { name: /doggo foto/i }),
    ).toBeInTheDocument();
  });

  it("hides BUs when locations register them but no active services exist", async () => {
    // Carso tiene la BU pero desactivaron todos los servicios de
    // GROOMING. El wizard debe ocultarlo — antes el cliente llegaba
    // al ServicePicker con lista vacía y se confundía.
    server.use(
      http.get(`${API}/locations/`, () =>
        HttpResponse.json(locationWithBUs(["AUTOLAVADO", "GROOMING"])),
      ),
      http.get(`${API}/services/catalog/`, () =>
        HttpResponse.json(servicesForBUs(["AUTOLAVADO"])),
      ),
    );
    renderWithProviders(<BusinessUnitPickerPage />);
    expect(
      await screen.findByRole("button", { name: /doggo bath/i }),
    ).toBeInTheDocument();
    await waitFor(() =>
      expect(
        screen.queryByRole("button", { name: /grooming profesional/i }),
      ).not.toBeInTheDocument(),
    );
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
      http.get(`${API}/services/catalog/`, async () => {
        await new Promise((r) => setTimeout(r, 5000));
        return HttpResponse.json(servicesForBUs([]));
      }),
    );
    renderWithProviders(<BusinessUnitPickerPage />);
    expect(
      await screen.findByRole("button", { name: /doggo bath/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /doggo foto/i }),
    ).toBeInTheDocument();
  });
});
