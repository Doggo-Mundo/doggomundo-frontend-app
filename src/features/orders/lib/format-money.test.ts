import { describe, expect, it } from "vitest";
import { formatMoney } from "./format-money";

describe("formatMoney", () => {
  it("formats integer MXN with currency symbol", () => {
    // Intl.NumberFormat uses narrow non-breaking space (U+202F) between $ and digits
    expect(formatMoney(150)).toMatch(/^\$\s?150\.00$/);
  });

  it("accepts string numbers", () => {
    expect(formatMoney("1234.5")).toMatch(/1,234\.50/);
  });

  it("returns em dash on non-numeric input", () => {
    expect(formatMoney("abc")).toBe("—");
  });

  it("honors custom currency", () => {
    const out = formatMoney("10", "USD");
    expect(out).toMatch(/10\.00/);
  });
});
