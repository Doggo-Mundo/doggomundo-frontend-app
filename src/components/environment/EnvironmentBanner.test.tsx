import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EnvironmentBanner } from "./EnvironmentBanner";
import { TestCardHint } from "./TestCardHint";

describe("EnvironmentBanner", () => {
  it("se muestra en pruebas", () => {
    render(<EnvironmentBanner isTest />);
    expect(screen.getByRole("status", { name: "Ambiente de pruebas" })).toBeInTheDocument();
  });

  it("no se muestra en producción", () => {
    const { container } = render(<EnvironmentBanner isTest={false} />);
    expect(container).toBeEmptyDOMElement();
  });
});

describe("TestCardHint", () => {
  it("muestra la tarjeta de prueba en modo test", () => {
    render(<TestCardHint testMode />);
    expect(screen.getByText("4242 4242 4242 4242")).toBeInTheDocument();
  });

  it("no aparece con llave live", () => {
    const { container } = render(<TestCardHint testMode={false} />);
    expect(container).toBeEmptyDOMElement();
  });
});
