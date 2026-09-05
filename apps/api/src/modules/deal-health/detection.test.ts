import { describe, expect, it } from "vitest";
import {
  computeBaseline,
  detectDeliverySlippage,
  detectDiscountAnomaly,
  detectStalled,
  EMPTY_BASELINE,
  mergeCandidates,
  type HealthConfig,
} from "./detection.js";

const config: HealthConfig = {
  stalledDays: 7,
  anomalyK: 2,
  minBaselineSample: 5,
};
const now = new Date("2026-02-20T00:00:00Z");

function at(iso: string): Date {
  return new Date(iso);
}

describe("detectStalled", () => {
  it("does not alert within the configured threshold", () => {
    expect(
      detectStalled(
        {
          quotationId: "q1",
          status: "SENT",
          lastActivityAt: at("2026-02-15T00:00:00Z"),
        },
        now,
        config,
      ),
    ).toBeNull();
  });

  it("returns medium severity after crossing the threshold", () => {
    const alert = detectStalled(
      {
        quotationId: "q1",
        status: "SENT",
        lastActivityAt: at("2026-02-10T00:00:00Z"),
      },
      now,
      config,
    );

    expect(alert).toMatchObject({
      quotationId: "q1",
      type: "STALLED",
      severity: "medium",
    });
  });

  it("returns high severity at twice the threshold", () => {
    const alert = detectStalled(
      {
        quotationId: "q1",
        status: "DRAFT",
        lastActivityAt: at("2026-02-04T00:00:00Z"),
      },
      now,
      config,
    );

    expect(alert?.severity).toBe("high");
  });

  it("ignores terminal and post-commit states", () => {
    expect(
      detectStalled(
        {
          quotationId: "q1",
          status: "PAID",
          lastActivityAt: at("2025-01-01T00:00:00Z"),
        },
        now,
        config,
      ),
    ).toBeNull();
    expect(
      detectStalled(
        {
          quotationId: "q1",
          status: "FULFILLMENT",
          lastActivityAt: at("2025-01-01T00:00:00Z"),
        },
        now,
        config,
      ),
    ).toBeNull();
  });
});

describe("computeBaseline and detectDiscountAnomaly", () => {
  it("computes population baseline statistics", () => {
    expect(computeBaseline([5, 6, 4, 5, 5])).toEqual({
      mean: 5,
      stddev: Math.sqrt(0.4),
      sampleSize: 5,
    });
  });

  it("flags a spike above the configured z-score threshold", () => {
    const baseline = computeBaseline([5, 6, 4, 5, 5]);

    const alert = detectDiscountAnomaly(
      { quotationId: "q1", discountPct: 25 },
      baseline,
      config,
    );

    expect(alert?.type).toBe("DISCOUNT_ANOMALY");
  });

  it("does not flag the rep's normal range", () => {
    const baseline = computeBaseline([5, 6, 4, 5, 5]);

    expect(
      detectDiscountAnomaly(
        { quotationId: "q1", discountPct: 6 },
        baseline,
        config,
      ),
    ).toBeNull();
  });

  it("stays silent below the minimum sample floor", () => {
    expect(
      detectDiscountAnomaly(
        { quotationId: "q1", discountPct: 90 },
        computeBaseline([5, 5]),
        config,
      ),
    ).toBeNull();
  });

  it("flags any strict excess as high for a flat-history rep", () => {
    const baseline = computeBaseline([10, 10, 10, 10, 10]);

    expect(
      detectDiscountAnomaly(
        { quotationId: "q1", discountPct: 10 },
        baseline,
        config,
      ),
    ).toBeNull();
    expect(
      detectDiscountAnomaly(
        { quotationId: "q1", discountPct: 11 },
        baseline,
        config,
      )?.severity,
    ).toBe("high");
  });

  it("does not alert with an empty baseline", () => {
    expect(
      detectDiscountAnomaly(
        { quotationId: "q1", discountPct: 99 },
        EMPTY_BASELINE,
        config,
      ),
    ).toBeNull();
  });
});

describe("detectDeliverySlippage", () => {
  it("ignores splits with no promise or already shipped splits", () => {
    expect(
      detectDeliverySlippage(
        {
          quotationId: "q1",
          splitId: "s1",
          promisedAt: null,
          shippedAt: null,
        },
        now,
      ),
    ).toBeNull();
    expect(
      detectDeliverySlippage(
        {
          quotationId: "q1",
          splitId: "s1",
          promisedAt: at("2026-01-01T00:00:00Z"),
          shippedAt: at("2026-01-02T00:00:00Z"),
        },
        now,
      ),
    ).toBeNull();
  });

  it("ignores future promises and flags past promises by severity", () => {
    expect(
      detectDeliverySlippage(
        {
          quotationId: "q1",
          splitId: "s1",
          promisedAt: at("2026-03-01T00:00:00Z"),
          shippedAt: null,
        },
        now,
      ),
    ).toBeNull();
    expect(
      detectDeliverySlippage(
        {
          quotationId: "q1",
          splitId: "s1",
          promisedAt: at("2026-02-18T00:00:00Z"),
          shippedAt: null,
        },
        now,
      )?.severity,
    ).toBe("medium");
    expect(
      detectDeliverySlippage(
        {
          quotationId: "q1",
          splitId: "s1",
          promisedAt: at("2026-02-10T00:00:00Z"),
          shippedAt: null,
        },
        now,
      )?.severity,
    ).toBe("high");
  });
});

describe("mergeCandidates", () => {
  it("keeps one alert per quotation and type at the worst severity", () => {
    const merged = mergeCandidates([
      {
        quotationId: "q1",
        type: "DELIVERY_SLIPPAGE",
        severity: "medium",
        detail: "first",
      },
      {
        quotationId: "q1",
        type: "DELIVERY_SLIPPAGE",
        severity: "high",
        detail: "second",
      },
      {
        quotationId: "q1",
        type: "STALLED",
        severity: "medium",
        detail: "third",
      },
    ]);

    expect(merged).toHaveLength(2);
    expect(
      merged.find((candidate) => candidate.type === "DELIVERY_SLIPPAGE"),
    ).toMatchObject({ severity: "high", detail: "second" });
  });
});
