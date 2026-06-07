import { localRepository } from "../../lib/localRepository";
import { tryInvokeCommand } from "../../lib/tauri";
import type { MediaAsset } from "../../types/media";

export async function listMediaAssets() {
  return tryInvokeCommand<MediaAsset[]>("list_media_assets", undefined, () => localRepository.listMediaAssets());
}

export async function importMediaAsset(sourcePath: string) {
  return tryInvokeCommand<MediaAsset>("import_media_asset", { sourcePath }, () => {
    throw new Error("Media import is available in the desktop app.");
  });
}

export async function importMediaDataUrl(fileName: string, dataUrl: string) {
  return tryInvokeCommand<MediaAsset>("import_media_data_url", { fileName, dataUrl }, () => {
    throw new Error("Media import is available in the desktop app.");
  });
}

export async function importMediaUrl(url: string) {
  return tryInvokeCommand<MediaAsset>("import_media_url", { url }, () => {
    throw new Error("Media import is available in the desktop app.");
  });
}

export async function deleteMediaAsset(id: number) {
  return tryInvokeCommand<void>("delete_media_asset", { id }, () => undefined);
}

export async function materializeImage(value: string, name: string) {
  if (!value) return value;
  if (value.startsWith("data:image/")) {
    return (await importMediaDataUrl(name, value)).filePath;
  }
  if (value.startsWith("http://") || value.startsWith("https://")) {
    return (await importMediaUrl(value)).filePath;
  }
  return value;
}
