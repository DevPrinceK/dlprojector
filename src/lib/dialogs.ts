import { isTauriRuntime } from "./tauri";

export async function chooseBackupSavePath() {
  if (!isTauriRuntime()) return null;
  const { save } = await import("@tauri-apps/plugin-dialog");
  return save({
    title: "Export DL Projector backup",
    defaultPath: `dlprojector-${new Date().toISOString().slice(0, 10)}.dlcfbackup`,
    filters: [{ name: "DL Projector Backup", extensions: ["dlcfbackup"] }]
  });
}

export async function chooseBackupRestorePath() {
  if (!isTauriRuntime()) return null;
  const { open } = await import("@tauri-apps/plugin-dialog");
  const selected = await open({
    title: "Restore DL Projector backup",
    multiple: false,
    directory: false,
    filters: [{ name: "DL Projector Backup", extensions: ["dlcfbackup", "zip"] }]
  });
  return typeof selected === "string" ? selected : null;
}
