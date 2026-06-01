import type { EntityId } from "./common";

export interface BibleVersion {
  id: EntityId;
  name: string;
  abbreviation: string;
  language: string;
  isDefault: boolean;
}

export interface BibleBook {
  id: EntityId;
  name: string;
  abbreviation: string;
  testament: "Old" | "New";
  position: number;
}

export interface BibleVerse {
  id: EntityId;
  versionId: EntityId;
  bookId: EntityId;
  bookName: string;
  chapter: number;
  verse: number;
  text: string;
  version: string;
}

export interface ScriptureReference {
  book: string;
  chapter: number;
  verseStart?: number;
  verseEnd?: number;
}

export interface ScriptureSearchResult {
  reference: string;
  version: string;
  verses: BibleVerse[];
}
