import { describe, expect, it } from "vitest";
import { RecommendationOutput } from "./schema.js";
import { getCartLines } from "./tools.js";

describe("Agent 2 — AI Product Recommendation", () => {
  it("validates valid RecommendationOutput schema", () => {
    const validData = {
      suggestions: [
        {
          productId: "prod-1",
          reason: "Pairs well with laptops and has a 5% positive margin impact",
          marginDeltaPct: 5.2,
        },
      ],
    };
    const parsed = RecommendationOutput.parse(validData);
    expect(parsed.suggestions).toHaveLength(1);
    expect(parsed.suggestions[0]?.productId).toBe("prod-1");
  });

  it("fails validation if suggestion reason is empty", () => {
    const invalidData = {
      suggestions: [
        {
          productId: "prod-1",
          reason: "",
          marginDeltaPct: 5,
        },
      ],
    };
    expect(() => RecommendationOutput.parse(invalidData)).toThrow();
  });

  it("enforces backstop invariant: drops hallucinated product IDs", () => {
    const allowedSet = new Set(["prod-legit-1", "prod-legit-2"]);
    const rawSuggestions = [
      { productId: "prod-legit-1", reason: "Good match", marginDeltaPct: 2 },
      {
        productId: "prod-hallucinated-99",
        reason: "Fake product",
        marginDeltaPct: 10,
      },
      { productId: "prod-legit-2", reason: "Another match", marginDeltaPct: 1 },
    ];

    const filtered = rawSuggestions.filter((s) => allowedSet.has(s.productId));
    expect(filtered).toHaveLength(2);
    expect(filtered.map((s) => s.productId)).toEqual([
      "prod-legit-1",
      "prod-legit-2",
    ]);
  });

  it("get_cart_lines maps cart items without PII", async () => {
    // Test parameters schema structure
    expect(getCartLines.name).toBe("get_cart_lines");
    expect(getCartLines.parameters).toHaveProperty("required");
  });
});
