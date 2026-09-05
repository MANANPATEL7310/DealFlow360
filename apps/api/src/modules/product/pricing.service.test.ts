// apps/api/src/modules/product/pricing.service.test.ts
import { describe, expect, it } from "vitest";
import { selectUnitPrice } from "./pricing.service.js";

describe("selectUnitPrice — priority tier list → default list → basePrice", () => {
  it("prefers the tier+currency list price when present", () => {
    expect(
      selectUnitPrice({
        tierListPrice: 9000,
        defaultListPrice: 10000,
        basePrice: 12000,
        variantExtra: 0,
      }),
    ).toBe(9000);
  });

  it("falls back to the default list when there is no tier list", () => {
    expect(
      selectUnitPrice({
        tierListPrice: null,
        defaultListPrice: 10000,
        basePrice: 12000,
        variantExtra: 0,
      }),
    ).toBe(10000);
  });

  it("falls back to basePrice when no list applies", () => {
    expect(
      selectUnitPrice({
        tierListPrice: null,
        defaultListPrice: null,
        basePrice: 12000,
        variantExtra: 0,
      }),
    ).toBe(12000);
  });

  it("adds the variant extraPrice on top of the resolved base", () => {
    expect(
      selectUnitPrice({
        tierListPrice: 9000,
        defaultListPrice: null,
        basePrice: 12000,
        variantExtra: 1500,
      }),
    ).toBe(10500);
  });
});
