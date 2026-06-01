import { localRepository } from "../../lib/localRepository";
import { invokeCommand, tryInvokeCommand } from "../../lib/tauri";
import type { BibleVersion, ScriptureImportResult, ScriptureSearchResult } from "../../types/scripture";

export async function searchScriptures(query: string, version?: string) {
  return tryInvokeCommand<ScriptureSearchResult[]>(
    "search_scriptures",
    { query, version },
    () => localRepository.searchScriptures(query)
  );
}

export async function getRecentScriptures() {
  return tryInvokeCommand<ScriptureSearchResult[]>(
    "get_recent_scriptures",
    undefined,
    () => localRepository.getRecentScriptures()
  );
}

export async function importBundledKjv() {
  return tryInvokeCommand<ScriptureImportResult>(
    "import_bundled_kjv",
    undefined,
    () => {
      throw new Error("KJV import is available in the desktop app.");
    }
  );
}

export async function listBibleVersions() {
  return tryInvokeCommand<BibleVersion[]>(
    "list_bible_versions",
    undefined,
    () => [{ id: 1, name: "King James Version", abbreviation: "KJV", language: "English", isDefault: true }]
  );
}

export async function importBibleCsv(abbreviation: string, name: string, csvText: string, makeDefault = false) {
  return invokeCommand<ScriptureImportResult>("import_bible_csv", {
    abbreviation,
    name,
    csvText,
    makeDefault
  });
}
