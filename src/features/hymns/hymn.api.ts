import { localRepository } from "../../lib/localRepository";
import { tryInvokeCommand } from "../../lib/tauri";
import type { Hymn, HymnInput } from "../../types/hymn";

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
