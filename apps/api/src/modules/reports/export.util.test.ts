import { describe, expect, it } from "vitest";
import { reportFilename, toMajor } from "./export.util.js";

describe("report export utilities", () => {
  it("converts minor units to major units", () => {
    expect(toMajor(12345)).toBe(123.45);
  });

  it("builds date-bounded export filenames", () => {
    expect(
      reportFilename("xlsx", {
        from: new Date("2026-01-01T00:00:00Z"),
        to: new Date("2026-01-31T00:00:00Z"),
      }),
    ).toBe("sales-report_2026-01-01_2026-01-31.xlsx");
  });

  it("uses stable fallback filename bounds", () => {
    expect(reportFilename("pdf", {})).toBe("sales-report_start_today.pdf");
  });
});
