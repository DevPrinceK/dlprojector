import { convertFileSrc } from "@tauri-apps/api/core";
import { isTauriRuntime } from "./tauri";

export function mediaSource(path?: string) {
  if (!path) return undefined;
  if (/^(https?:|data:|asset:|blob:)/i.test(path)) return path;
  return isTauriRuntime() ? convertFileSrc(path) : path;
}
