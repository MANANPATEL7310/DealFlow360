import { beforeEach, describe, expect, it, vi } from "vitest";
import { runSalesReport } from "./tools.js";

vi.mock("../../../lib/db.js", () => ({
  db: {
    product: {
      findMany: vi.fn(),
    },
  },
}));

vi.mock("../../reports/report-dataset.js", () => ({
  listReps: vi.fn(),
  runReport: vi.fn(async (filters, viewer) => ({ filters, viewer })),
}));

const ctx = {
  actorId: "manager-1",
  actorRole: "sales_manager",
  agent: "insights",
  runId: "run-1",
};

describe("AI insights tools", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("passes whitelisted filters and real actor scope into M11", async () => {
    await expect(
      runSalesReport.handler({ status: "PAID", category: "HARDWARE" }, ctx),
    ).resolves.toMatchObject({
      filters: { status: "PAID", category: "HARDWARE" },
      viewer: { sub: "manager-1", role: "sales_manager" },
    });
  });

  it("rejects non-whitelisted filter keys before M11 runs", async () => {
    await expect(
      runSalesReport.handler({ rawSql: "select * from User" }, ctx),
    ).rejects.toThrow();
  });
});
