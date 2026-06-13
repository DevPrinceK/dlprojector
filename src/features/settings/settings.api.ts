import { isTauriRuntime, tryInvokeCommand } from "../../lib/tauri";

export interface AppSetting {
  key: string;
  value: string;
}

export async function getSettings() {
  return tryInvokeCommand<AppSetting[]>("list_settings", undefined, () => [
    { key: "projection.fontSize", value: "72" },
    { key: "projection.transition", value: "fade" },
    { key: "projection.background", value: "navy" },
    { key: "projection.showScriptureVersion", value: "true" },
    { key: "projection.showHymnTitle", value: "true" },
    { key: "hymn.scrollSecondsPerLine", value: "4.2" },
    { key: "shortcut.next", value: "Space" },
    { key: "shortcut.blank", value: "b" },
    { key: "shortcut.logo", value: "l" },
    { key: "backup.autoEnabled", value: "true" },
    { key: "scripture.version", value: "KJV" },
    { key: "loader.text", value: "DLCF Legon" },
    { key: "scripture.referencePosition", value: "top" },
    { key: "hymn.textAlign", value: "center" },
    { key: "projection.screenIndex", value: "1" },
    { key: "backup.directory", value: "" },
    { key: "backup.retention", value: "10" }
  ]);
}

export async function saveSetting(key: string, value: string) {
  return tryInvokeCommand<AppSetting>("save_setting", { key, value }, () => ({ key, value }));
}

export async function installSampleData() {
  return tryInvokeCommand<void>("install_sample_data", undefined, async () => undefined);
}

export async function getDiagnosticsPath() {
  return tryInvokeCommand<string>("diagnostics_path", undefined, () => "Diagnostics are available in the desktop app.");
}

const settingsChangedEvent = "settings:changed";
const settingsChannelName = "dlprojector:settings";

export async function notifySettingsChanged(settings: AppSetting[]) {
  if (isTauriRuntime()) {
    const { emit } = await import("@tauri-apps/api/event");
    await emit(settingsChangedEvent, settings);
    return;
  }

  const channel = typeof BroadcastChannel === "undefined" ? null : new BroadcastChannel(settingsChannelName);
  channel?.postMessage(settings);
  channel?.close();
}

export async function listenSettingsChanged(onSettings: (settings: AppSetting[]) => void) {
  if (isTauriRuntime()) {
    const { listen } = await import("@tauri-apps/api/event");
    return listen<AppSetting[]>(settingsChangedEvent, (event) => onSettings(event.payload));
  }

  const channel = typeof BroadcastChannel === "undefined" ? null : new BroadcastChannel(settingsChannelName);
  const listener = (event: MessageEvent<AppSetting[]>) => onSettings(event.data);
  channel?.addEventListener("message", listener);
  return () => {
    channel?.removeEventListener("message", listener);
    channel?.close();
  };
}
