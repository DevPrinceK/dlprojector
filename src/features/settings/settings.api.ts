import { tryInvokeCommand } from "../../lib/tauri";

export interface AppSetting {
  key: string;
  value: string;
}

export async function getSettings() {
  return tryInvokeCommand<AppSetting[]>("list_settings", undefined, () => [
    { key: "projection.fontSize", value: "72" },
    { key: "projection.transition", value: "fade" },
    { key: "backup.autoEnabled", value: "true" },
    { key: "scripture.version", value: "KJV" }
  ]);
}

export async function saveSetting(key: string, value: string) {
  return tryInvokeCommand<AppSetting>("save_setting", { key, value }, () => ({ key, value }));
}
