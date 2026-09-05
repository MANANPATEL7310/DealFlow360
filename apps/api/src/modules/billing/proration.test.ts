// apps/api/src/modules/billing/proration.test.ts
import { describe, expect, it } from "vitest";
import { daysBetween, prorate } from "./proration.js";

const d = (iso: string) => new Date(`${iso}T00:00:00Z`);

describe("daysBetween", () => {
  it("counts whole days", () => {
    expect(daysBetween(d("2026-01-01"), d("2026-01-31"))).toBe(30);
    expect(daysBetween(d("2026-01-01"), d("2026-02-01"))).toBe(31);
  });
});

describe("prorate", () => {
  const period = [d("2026-01-01"), d("2026-01-31")] as const; // 30-day window

  it("bills the remaining slice of the period", () => {
    expect(prorate(3000, d("2026-01-11"), ...period)).toBe(2000); // 3000 · 20/30
  });

  it("bills the full amount when the change is at period start", () => {
    expect(prorate(3000, d("2026-01-01"), ...period)).toBe(3000);
  });

  it("bills nothing when the change is at/after period end", () => {
    expect(prorate(3000, d("2026-01-31"), ...period)).toBe(0);
    expect(prorate(3000, d("2026-02-05"), ...period)).toBe(0); // clamped, never negative
  });

  it("never exceeds the plan amount for a change before the period", () => {
    expect(prorate(3000, d("2025-12-20"), ...period)).toBe(3000); // clamped to 100%
  });

  it("guards a zero-length period (no divide-by-zero)", () => {
    expect(
      prorate(3000, d("2026-01-01"), d("2026-01-01"), d("2026-01-01")),
    ).toBe(0);
  });
});
