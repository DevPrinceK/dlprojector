import { describe, expect, it } from "vitest";
import { coerceProjectionContent, getProjectionTitle } from "./projection.utils";

describe("projection utilities", () => {
  it("falls back to the logo content when content is invalid", () => {
    expect(coerceProjectionContent(null).type).toBe("logo");
  });

  it("derives a stable title", () => {
    expect(getProjectionTitle({ type: "scripture", reference: "John 3:16" })).toBe("John 3:16");
  });
});
