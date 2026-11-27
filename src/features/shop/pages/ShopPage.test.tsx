import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { screen } from "@testing-library/react";
import { ShopPage } from "./ShopPage";
import { renderWithProviders } from "@/test/test-utils";
import { server } from "@/test/msw-server";
import { makeProduct } from "@/test/fixtures";

const API = "http://localhost/api";

describe("ShopPage", () => {
  it("keeps out-of-stock products in the grid, marked as Agotado", async () => {
    server.use(
      http.get(`${API}/retail/categories/`, () => HttpResponse.json([])),
      http.get(`${API}/retail/products/`, () =>
        HttpResponse.json([
          makeProduct({ id: "p-1", name: "Kong Classic" }),
          makeProduct({
            id: "p-2",
            name: "Pelota",
            in_stock: false,
            max_available: 0,
          }),
        ]),
      ),
    );

    renderWithProviders(<ShopPage />);

    expect(await screen.findByText("Pelota")).toBeInTheDocument();
    expect(screen.getByText("Kong Classic")).toBeInTheDocument();
    expect(screen.getAllByText("Agotado")).toHaveLength(1);
    // Still clickable to the detail page.
    expect(screen.getByText("Pelota").closest("a")).toHaveAttribute(
      "href",
      "/shop/products/p-2",
    );
  });
});
