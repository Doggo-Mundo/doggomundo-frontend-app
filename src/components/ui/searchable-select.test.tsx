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
