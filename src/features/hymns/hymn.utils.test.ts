import { describe, expect, it } from "vitest";
import { parseLyricsToStanzas } from "./hymn.utils";

describe("parseLyricsToStanzas", () => {
  it("splits stanzas by blank lines", () => {
    const parsed = parseLyricsToStanzas("Verse one\nLine two\n\nVerse two\nLine two", "Test Hymn", "007");
    expect(parsed.title).toBe("Test Hymn");
    expect(parsed.number).toBe("007");
    expect(parsed.stanzas).toHaveLength(2);
  });

  it("extracts a chorus section", () => {
    const parsed = parseLyricsToStanzas("Verse one\n\nChorus:\nSing amen", "Test Hymn");
    expect(parsed.stanzas).toEqual(["Verse one"]);
    expect(parsed.chorus).toBe("Sing amen");
  });
});
