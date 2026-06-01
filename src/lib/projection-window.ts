import { tryInvokeCommand } from "./tauri";

export async function openProjectionWindow() {
  await tryInvokeCommand("open_projection_window", undefined, () => {
    window.open(`${window.location.origin}/#projection`, "dlprojector-projection", "popup,width=1280,height=720");
  });

  return tryInvokeCommand<string>("projection_window_status", undefined, () => "Browser projection window opened");
}
