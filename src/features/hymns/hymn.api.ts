import { localRepository } from "../../lib/localRepository";
import { tryInvokeCommand } from "../../lib/tauri";
import type { Hymn, HymnImportResult, HymnInput } from "../../types/hymn";

export async function searchHymns(query: string) {
  return tryInvokeCommand<Hymn[]>("search_hymns", { query }, () => localRepository.searchHymns(query));
}

export async function listHymns() {
  return searchHymns("");
}

export async function createHymn(input: HymnInput) {
  return tryInvokeCommand<Hymn>("create_hymn", { input }, () => localRepository.createHymn(input));
}

export async function updateHymn(id: number, input: HymnInput) {
  return tryInvokeCommand<Hymn>("update_hymn", { id, input }, () => localRepository.updateHymn(id, input));
}

export async function deleteHymn(id: number) {
  return tryInvokeCommand<void>("delete_hymn", { id }, () => localRepository.deleteHymn(id));
}

export async function importBundledGhs() {
  return tryInvokeCommand<HymnImportResult>(
    "import_bundled_ghs",
    undefined,
    () => {
      throw new Error("GHS import is available in the desktop app.");
    }
  );
}
