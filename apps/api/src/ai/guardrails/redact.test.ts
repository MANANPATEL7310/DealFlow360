import { describe, expect, it } from "vitest";
import { redactPII } from "./redact.js";

describe("redactPII", () => {
  it("replaces emails and phone numbers before model calls", () => {
    const text = "Contact richa@example.com or +1 (555) 123-4567 for Acme.";

    expect(redactPII(text)).toBe("Contact [email] or [phone] for Acme.");
  });
});
