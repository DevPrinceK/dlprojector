import { tryInvokeCommand } from "../../lib/tauri";

export async function exportBackup(targetPath?: string) {
  return tryInvokeCommand<string>("export_backup", { targetPath }, () => {
    throw new Error("Backup export is available in the desktop app.");
  });
}

export async function importBackup(sourcePath: string) {
  return tryInvokeCommand<void>("import_backup", { sourcePath }, () => {
    throw new Error("Backup restore is available in the desktop app.");
  });
}
