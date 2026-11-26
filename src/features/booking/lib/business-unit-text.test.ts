import { describe, expect, it } from "vitest";
import { businessUnitText } from "./business-unit-text";

const unit = (code: string, extra: Record<string, string> = {}) => ({
  id: code, name: code, code, code_display: code, ...extra,
}) as never;

describe("businessUnitText", () => {
  it("usa el nombre y la descripción capturados en la unidad", () => {
    const locations = [{
      name: "Carso Palmas",
      business_units: [unit("VET", { public_name: "Vacunación", public_description: "Vacunas" })],
    }];
    expect(businessUnitText("VET", locations)).toEqual({
      label: "Vacunación", description: "Vacunas",
    });
  });

  it("si la unidad no trae textos, usa los del tipo", () => {
    expect(businessUnitText("VET", [{ name: "X", business_units: [unit("VET")] }])).toEqual({
      label: "Alianza con Vet", description: "Consulta con nuestro veterinario",
    });
    expect(businessUnitText("GROOMING")).toEqual({
      label: "Grooming profesional", description: "Corte, estilo y cuidado a fondo",
    });
  });

  it("con textos distintos entre sucursales gana la primera por nombre", () => {
    const locations = [
      { name: "Polanco", business_units: [unit("AUTOLAVADO", { public_name: "Doggo Bath" })] },
      { name: "Carso Palmas", business_units: [unit("AUTOLAVADO", { public_name: "Lavado" })] },
    ];
    expect(businessUnitText("AUTOLAVADO", locations).label).toBe("Lavado");
  });
});
