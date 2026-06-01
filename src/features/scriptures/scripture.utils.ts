import type { BibleVerse, ScriptureReference, ScriptureSearchResult } from "../../types/scripture";
import type { ProjectionContent } from "../../types/projection";

const bookAliases = new Map<string, string>([
  ["psalms", "Psalm"],
  ["psalm", "Psalm"],
  ["jn", "John"],
  ["john", "John"],
  ["rom", "Romans"],
  ["romans", "Romans"],
  ["gen", "Genesis"],
  ["genesis", "Genesis"],
  ["1 cor", "1 Corinthians"],
  ["1 corinthians", "1 Corinthians"],
  ["2 cor", "2 Corinthians"],
  ["2 corinthians", "2 Corinthians"]
]);

export function parseScriptureReference(query: string): ScriptureReference | null {
  const normalized = query.trim().replace(/\s+/g, " ");
  if (!normalized) return null;

  const match = normalized.match(/^((?:[1-3]\s*)?[A-Za-z][A-Za-z\s]+?)\s+(\d+)(?::(\d+)(?:\s*-\s*(\d+))?)?$/);
  if (!match) return null;

  const [, rawBook, rawChapter, rawVerseStart, rawVerseEnd] = match;
  const book = normalizeBookName(rawBook);
  const chapter = Number(rawChapter);
  const verseStart = rawVerseStart ? Number(rawVerseStart) : undefined;
  const verseEnd = rawVerseEnd ? Number(rawVerseEnd) : verseStart;

  if (!book || !Number.isInteger(chapter) || chapter < 1) return null;
  if (verseStart !== undefined && (!Number.isInteger(verseStart) || verseStart < 1)) return null;
  if (verseEnd !== undefined && (!Number.isInteger(verseEnd) || verseEnd < verseStart!)) return null;

  return {
    book,
    chapter,
    verseStart,
    verseEnd
  };
}

export function normalizeBookName(book: string) {
  const normalized = book.trim().replace(/\s+/g, " ");
  const key = normalized.toLowerCase();
  return bookAliases.get(key) ?? normalized.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function scriptureResultToProjection(result: ScriptureSearchResult, verseIndex = 0): ProjectionContent {
  const safeIndex = Math.max(0, Math.min(verseIndex, result.verses.length - 1));
  const verse = result.verses[safeIndex];
  const body = verse ? verse.text : result.verses.map((item) => item.text).join("\n");
  const reference = verse ? `${verse.bookName} ${verse.chapter}:${verse.verse}` : result.reference;

  return {
    type: "scripture",
    title: reference,
    reference,
    body,
    subtitle: result.version,
    metadata: {
      result,
      verseIndex: safeIndex,
      totalVerses: result.verses.length
    }
  };
}

export function scriptureRangeBody(verses: BibleVerse[]) {
  return verses.map((item) => `${item.verse}. ${item.text}`).join("\n");
}
