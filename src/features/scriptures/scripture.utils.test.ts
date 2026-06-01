import { describe, expect, it } from "vitest";
import { parseScriptureReference } from "./scripture.utils";

describe("parseScriptureReference", () => {
  it("parses a single verse reference", () => {
    expect(parseScriptureReference("John 3:16")).toEqual({
      book: "John",
      chapter: 3,
      verseStart: 16,
      verseEnd: 16
    });
  });

  it("parses a verse range", () => {
    expect(parseScriptureReference("Genesis 1:1-5")).toEqual({
      book: "Genesis",
      chapter: 1,
      verseStart: 1,
      verseEnd: 5
    });
  });

  it("parses a whole chapter", () => {
    expect(parseScriptureReference("Psalm 23")).toEqual({
      book: "Psalm",
      chapter: 23,
      verseStart: undefined,
      verseEnd: undefined
    });
  });
});
