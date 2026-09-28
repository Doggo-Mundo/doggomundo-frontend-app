import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SearchableSelect } from "./searchable-select";

const OPTIONS = [
  { id: "b1", name: "Beagle" },
  { id: "b2", name: "Bulldog Francés" },
  { id: "b3", name: "Pastor Alemán" },
];

describe("SearchableSelect", () => {
  it("filters options with fuzzy match ignoring case and diacritics", async () => {
    const onChange = vi.fn();
    render(
      <SearchableSelect
        options={OPTIONS}
        value={null}
        onChange={onChange}
      />,
    );
    await userEvent.click(screen.getByRole("button"));
    const search = screen.getByPlaceholderText("Buscar…");
    // "aleman" sin tilde → matchea "Pastor Alemán"
    await userEvent.type(search, "aleman");
    expect(screen.getByText("Pastor Alemán")).toBeInTheDocument();
    expect(screen.queryByText("Beagle")).not.toBeInTheDocument();
  });

  it("selects an option on click", async () => {
    const onChange = vi.fn();
    render(
      <SearchableSelect
        options={OPTIONS}
        value={null}
        onChange={onChange}
      />,
    );
    await userEvent.click(screen.getByRole("button"));
    await userEvent.click(screen.getByRole("option", { name: /beagle/i }));
    expect(onChange).toHaveBeenCalledWith("b1");
  });

  it("does NOT offer 'Crear' when onCreate is not provided", async () => {
    render(
      <SearchableSelect
        options={OPTIONS}
        value={null}
        onChange={vi.fn()}
      />,
    );
    await userEvent.click(screen.getByRole("button"));
    await userEvent.type(
      screen.getByPlaceholderText("Buscar…"),
      "raza inexistente",
    );
    expect(screen.getByText("Sin resultados.")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /crear/i }),
    ).not.toBeInTheDocument();
  });

  it("shows 'Crear {query}' button when onCreate given and no match", async () => {
    const onCreate = vi.fn().mockResolvedValue({
      id: "new-1", name: "Gran Pirineo",
    });
    render(
      <SearchableSelect
        options={OPTIONS}
        value={null}
        onChange={vi.fn()}
        onCreate={onCreate}
        createLabel="Crear raza"
      />,
    );
    await userEvent.click(screen.getByRole("button"));
    await userEvent.type(
      screen.getByPlaceholderText("Buscar…"),
      "Gran Pirineo",
    );
    // Aparece el CTA con el término entre comillas.
    const createBtn = await screen.findByRole("button", {
      name: /crear raza.*gran pirineo/i,
    });
    expect(createBtn).toBeInTheDocument();
  });

  it("does NOT offer 'Crear' when the query matches an existing option exactly (normalized)", async () => {
    const onCreate = vi.fn();
    render(
      <SearchableSelect
        options={OPTIONS}
        value={null}
        onChange={vi.fn()}
        onCreate={onCreate}
      />,
    );
    await userEvent.click(screen.getByRole("button"));
    // "beagle" (lowercase) normaliza igual que "Beagle" — no ofrecer crear.
    await userEvent.type(
      screen.getByPlaceholderText("Buscar…"),
      "beagle",
    );
    expect(screen.getByText("Beagle")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /crear/i }),
    ).not.toBeInTheDocument();
  });

  it("invokes onCreate and selects the returned option", async () => {
    const onCreate = vi.fn().mockResolvedValue({
      id: "new-42", name: "Gran Pirineo",
    });
    const onChange = vi.fn();
    render(
      <SearchableSelect
        options={OPTIONS}
        value={null}
        onChange={onChange}
        onCreate={onCreate}
      />,
    );
    await userEvent.click(screen.getByRole("button"));
    await userEvent.type(
      screen.getByPlaceholderText("Buscar…"),
      "Gran Pirineo",
    );
    const createBtn = await screen.findByRole("button", {
      name: /crear.*gran pirineo/i,
    });
    await userEvent.click(createBtn);
    await waitFor(() => expect(onCreate).toHaveBeenCalledWith("Gran Pirineo"));
    await waitFor(() => expect(onChange).toHaveBeenCalledWith("new-42"));
  });

  it("matches by any query word (fuzzy tokenized)", async () => {
    // Escenario real: Jackie busca 'gigante de los pirineos' y
    // aunque 'gigante' no matchea nada, 'pirineos' debe traer las
    // razas que contienen 'pirineo' — incluida la Mastín de los
    // Pirineos y el Gran Pirineo.
    const opts = [
      { id: "1", name: "Beagle" },
      { id: "2", name: "Gran Pirineo" },
      { id: "3", name: "Mastín de los Pirineos" },
      { id: "4", name: "Pastor Alemán" },
    ];
    render(
      <SearchableSelect options={opts} value={null} onChange={vi.fn()} />,
    );
    await userEvent.click(screen.getByRole("button"));
    await userEvent.type(
      screen.getByPlaceholderText("Buscar…"),
      "gigante de los pirineos",
    );
    expect(screen.getByText("Gran Pirineo")).toBeInTheDocument();
    expect(screen.getByText("Mastín de los Pirineos")).toBeInTheDocument();
    expect(screen.queryByText("Beagle")).not.toBeInTheDocument();
    expect(screen.queryByText("Pastor Alemán")).not.toBeInTheDocument();
  });

  it("ranks options with more matched words first", async () => {
    const opts = [
      { id: "1", name: "Pastor Blanco" },
      { id: "2", name: "Pastor Alemán" },
      { id: "3", name: "Alemán del Rin" },
    ];
    render(
      <SearchableSelect options={opts} value={null} onChange={vi.fn()} />,
    );
    await userEvent.click(screen.getByRole("button"));
    await userEvent.type(
      screen.getByPlaceholderText("Buscar…"),
      "pastor aleman",
    );
    // "Pastor Alemán" tiene 2 matches; los otros 1 cada uno. Debe
    // aparecer primero en el DOM.
    const items = screen.getAllByRole("option");
    expect(items[0]).toHaveTextContent("Pastor Alemán");
  });

  it("stopwords alone do not filter — returns full list", async () => {
    render(
      <SearchableSelect
        options={OPTIONS}
        value={null}
        onChange={vi.fn()}
      />,
    );
    await userEvent.click(screen.getByRole("button"));
    await userEvent.type(screen.getByPlaceholderText("Buscar…"), "de los");
    // No hubo tokens útiles → mostramos todo, no "Sin resultados".
    expect(screen.getByText("Beagle")).toBeInTheDocument();
    expect(screen.getByText("Bulldog Francés")).toBeInTheDocument();
    expect(screen.getByText("Pastor Alemán")).toBeInTheDocument();
  });

  it("does NOT offer 'Crear' for query shorter than 2 chars", async () => {
    render(
      <SearchableSelect
        options={OPTIONS}
        value={null}
        onChange={vi.fn()}
        onCreate={vi.fn()}
      />,
    );
    await userEvent.click(screen.getByRole("button"));
    await userEvent.type(screen.getByPlaceholderText("Buscar…"), "z");
    expect(
      screen.queryByRole("button", { name: /crear/i }),
    ).not.toBeInTheDocument();
  });
});
