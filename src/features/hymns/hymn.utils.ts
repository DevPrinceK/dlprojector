import type { Hymn, HymnLyrics } from "../../types/hymn";
import type { ProjectionContent } from "../../types/projection";

export function parseLyricsToStanzas(rawLyrics: string, title = "", number?: string): HymnLyrics {
  const normalized = rawLyrics.replace(/\r\n/g, "\n").trim();
  const chorusMatch = normalized.match(/(?:^|\n)chorus:\s*([\s\S]*?)(?=\n\s*\n|$)/i);
  const chorus = chorusMatch?.[1]?.trim() ?? "";
  const withoutChorus = normalized.replace(/(?:^|\n)chorus:\s*([\s\S]*?)(?=\n\s*\n|$)/i, "").trim();
  const stanzas = withoutChorus
    .split(/\n\s*\n/g)
    .map((stanza) => stanza.trim())
    .filter(Boolean);

  return {
    title,
    number,
    stanzas: stanzas.length > 0 ? stanzas : [normalized].filter(Boolean),
    chorus
  };
}

export function hymnToProjection(hymn: Hymn, stanzaIndex = 0): ProjectionContent {
  const safeIndex = Math.max(0, Math.min(stanzaIndex, hymn.lyricsJson.stanzas.length - 1));
  const stanza = hymn.lyricsJson.stanzas[safeIndex] ?? "";
  const chorus = hymn.lyricsJson.chorus?.trim();
  return {
    type: "hymn",
    title: hymn.title,
    subtitle: hymn.number ? `Hymn ${hymn.number}` : undefined,
    body: chorus ? `${stanza}\n\nChorus:\n${chorus}` : stanza,
    metadata: {
      hymn,
      stanzaIndex: safeIndex,
      totalStanzas: hymn.lyricsJson.stanzas.length
    }
  };
}
