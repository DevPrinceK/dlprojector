import { localRepository } from "../../lib/localRepository";
import { tryInvokeCommand } from "../../lib/tauri";
import type { ScriptureSearchResult } from "../../types/scripture";

export async function searchScriptures(query: string) {
  return tryInvokeCommand<ScriptureSearchResult[]>(
    "search_scriptures",
    { query },
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
