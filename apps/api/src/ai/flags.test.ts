import { beforeEach, describe, expect, it, vi } from "vitest";

function client(values: Record<string, unknown>) {
  return {
    systemSetting: {
      findUnique: async ({ where }: { where: { key: string } }) => {
        if (!(where.key in values)) {
          return null;
        }

        return { value: JSON.stringify(values[where.key]) };
      },
    },
  };
}

describe("aiAgentEnabled", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv("JWT_SECRET", "test-secret-at-least-16-chars");
    vi.stubEnv("DATABASE_URL", "postgresql://user:pass@localhost:5432/test");
    vi.stubEnv("OPENROUTER_API_KEY", "test-key");
  });

  it("returns false when the master setting is off", async () => {
    const { aiAgentEnabled } = await import("./flags.js");

    await expect(
      aiAgentEnabled("fulfillment", client({ "ai.enabled": false })),
    ).resolves.toBe(false);
  });
});
