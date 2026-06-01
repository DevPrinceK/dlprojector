import type { TimestampedEntity } from "./common";

export interface HymnLyrics {
  title: string;
  number?: string;
  stanzas: string[];
  chorus?: string;
}

export interface Hymn extends TimestampedEntity {
  number: string;
  title: string;
  category?: string | null;
  author?: string | null;
  lyricsJson: HymnLyrics;
  isActive: boolean;
}

export interface HymnInput {
  number: string;
  title: string;
  category?: string;
  author?: string;
  lyricsJson: HymnLyrics;
  isActive?: boolean;
}

export interface HymnImportResult {
  hymnal: string;
  hymnsImported: number;
  hymnsTotal: number;
}
