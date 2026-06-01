import { useEffect, useState } from "react";
import { Download, Save } from "lucide-react";
import { exportBackup, importBackup } from "../../features/backup/backup.api";
import { getSettings, saveSetting, type AppSetting } from "../../features/settings/settings.api";
import { toErrorMessage } from "../../lib/error-handling";
import { useAppStore } from "../../stores/app.store";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { PageHeader } from "./components/PageHeader";

export function SettingsPage() {
  const pushToast = useAppStore((state) => state.pushToast);
  const [settings, setSettings] = useState<AppSetting[]>([]);
  const [backupPath, setBackupPath] = useState("");
  const [restorePath, setRestorePath] = useState("");

  useEffect(() => {
    void getSettings().then(setSettings);
  }, []);

  const updateSetting = (key: string, value: string) => {
    setSettings((current) => current.map((item) => (item.key === key ? { ...item, value } : item)));
  };

  const saveAll = async () => {
    try {
      await Promise.all(settings.map((setting) => saveSetting(setting.key, setting.value)));
      pushToast({ kind: "success", title: "Settings saved" });
    } catch (error) {
      pushToast({ kind: "error", title: "Could not save settings", description: toErrorMessage(error) });
    }
  };

  const runExport = async () => {
    try {
      const result = await exportBackup(backupPath || undefined);
      pushToast({ kind: "success", title: "Backup exported", description: result });
    } catch (error) {
      pushToast({ kind: "error", title: "Backup failed", description: toErrorMessage(error) });
    }
  };

  const runRestore = async () => {
    try {
      await importBackup(restorePath);
      pushToast({ kind: "success", title: "Backup restored", description: "Restart the app to reload restored data." });
    } catch (error) {
      pushToast({ kind: "error", title: "Restore failed", description: toErrorMessage(error) });
    }
  };

  return (
    <section>
      <PageHeader
        eyebrow="Settings"
        title="Projection preferences"
        description="Tune display behavior, backup settings, and app defaults. More settings can be added without changing the persistence model."
      />

      <div className="grid gap-5 xl:grid-cols-2">
        <Card className="dl-glass">
          <CardHeader>
            <CardTitle>App Settings</CardTitle>
            <CardDescription>Stored locally in SQLite in the desktop app.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {settings.map((setting) => (
              <div key={setting.key} className="space-y-2">
                <Label>{setting.key}</Label>
                <Input value={setting.value} onChange={(event) => updateSetting(setting.key, event.target.value)} />
              </div>
            ))}
            <Button variant="gold" onClick={() => void saveAll()}>
              <Save className="h-4 w-4" />
              Save Settings
            </Button>
          </CardContent>
        </Card>

        <Card className="dl-glass">
          <CardHeader>
            <CardTitle>Backup and Restore</CardTitle>
            <CardDescription>Backups use the .dlcfbackup format and include the SQLite database plus media assets.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-5">
            <div className="space-y-2">
              <Label>Export path or folder (optional)</Label>
              <div className="flex gap-3">
                <Input value={backupPath} onChange={(event) => setBackupPath(event.target.value)} placeholder="Leave blank for default backup folder" />
                <Button variant="gold" onClick={() => void runExport()}>
                  <Download className="h-4 w-4" />
                  Export
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Restore file</Label>
              <div className="flex gap-3">
                <Input value={restorePath} onChange={(event) => setRestorePath(event.target.value)} placeholder="C:\\path\\backup.dlcfbackup" />
                <Button variant="outline" onClick={() => void runRestore()}>
                  Restore
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
