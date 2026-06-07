import { useEffect, useState } from "react";
import { BookOpen, Download, Music, RefreshCw, Save } from "lucide-react";
import { exportBackup, importBackup } from "../../features/backup/backup.api";
import { importBundledGhs } from "../../features/hymns/hymn.api";
import { importBibleCsv, importBundledKjv, listBibleVersions } from "../../features/scriptures/scripture.api";
import { getSettings, notifySettingsChanged, saveSetting, type AppSetting } from "../../features/settings/settings.api";
import { toErrorMessage } from "../../lib/error-handling";
import { useAppStore } from "../../stores/app.store";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { PageHeader } from "./components/PageHeader";
import type { BibleVersion } from "../../types/scripture";
import { Badge } from "../../components/ui/badge";
import { chooseBackupRestorePath, chooseBackupSavePath } from "../../lib/dialogs";
import { useSettingsStore } from "../../stores/settings.store";
import { checkForUpdates } from "../../features/updates/update.api";
import { isTauriRuntime } from "../../lib/tauri";

interface DownloadableBibleVersion {
  abbreviation: string;
  name: string;
  url: string;
}

const bibleCsvBase = "https://raw.githubusercontent.com/scrollmapper/bible_databases/master/formats/csv";
const downloadableBibleVersions: DownloadableBibleVersion[] = [
  { abbreviation: "BSB", name: "Berean Standard Bible", url: `${bibleCsvBase}/BSB.csv` },
  { abbreviation: "LEB", name: "Lexham English Bible", url: `${bibleCsvBase}/LEB.csv` },
  { abbreviation: "ASV", name: "American Standard Version", url: `${bibleCsvBase}/ASV.csv` },
  { abbreviation: "BBE", name: "Bible in Basic English", url: `${bibleCsvBase}/BBE.csv` },
  { abbreviation: "YLT", name: "Young's Literal Translation", url: `${bibleCsvBase}/YLT.csv` }
];

export function SettingsPage() {
  const pushToast = useAppStore((state) => state.pushToast);
  const applySettings = useSettingsStore((state) => state.apply);
  const [settings, setSettings] = useState<AppSetting[]>([]);
  const [backupPath, setBackupPath] = useState("");
  const [restorePath, setRestorePath] = useState("");
  const [isImportingKjv, setIsImportingKjv] = useState(false);
  const [isImportingGhs, setIsImportingGhs] = useState(false);
  const [downloadingBibleVersion, setDownloadingBibleVersion] = useState<string | null>(null);
  const [installedVersions, setInstalledVersions] = useState<BibleVersion[]>([]);
  const [isCheckingUpdates, setIsCheckingUpdates] = useState(false);

  useEffect(() => {
    void getSettings().then(setSettings);
    void refreshBibleVersions();
  }, []);

  const refreshBibleVersions = async () => {
    setInstalledVersions(await listBibleVersions());
  };

  const updateSetting = (key: string, value: string) => {
    setSettings((current) => current.map((item) => (item.key === key ? { ...item, value } : item)));
  };

  const saveAll = async () => {
    try {
      await Promise.all(settings.map((setting) => saveSetting(setting.key, setting.value)));
      applySettings(settings);
      await notifySettingsChanged(settings);
      pushToast({ kind: "success", title: "Settings saved" });
    } catch (error) {
      pushToast({ kind: "error", title: "Could not save settings", description: toErrorMessage(error) });
    }
  };

  const runExport = async () => {
    try {
      const selectedPath = backupPath || (await chooseBackupSavePath()) || undefined;
      const result = await exportBackup(selectedPath);
      pushToast({ kind: "success", title: "Backup exported", description: result });
    } catch (error) {
      pushToast({ kind: "error", title: "Backup failed", description: toErrorMessage(error) });
    }
  };

  const runRestore = async () => {
    try {
      const selectedPath = restorePath || (await chooseBackupRestorePath());
      if (!selectedPath) return;
      await importBackup(selectedPath);
      pushToast({ kind: "success", title: "Backup restored", description: "Restart the app to reload restored data." });
    } catch (error) {
      pushToast({ kind: "error", title: "Restore failed", description: toErrorMessage(error) });
    }
  };

  const runKjvImport = async () => {
    if (isImportingKjv) return;
    try {
      setIsImportingKjv(true);
      const result = await importBundledKjv();
      await refreshBibleVersions();
      pushToast({
        kind: "success",
        title: "KJV Bible installed",
        description: `${result.versesTotal.toLocaleString()} verses ready across ${result.booksImported} books.`
      });
    } catch (error) {
      pushToast({ kind: "error", title: "KJV import failed", description: toErrorMessage(error) });
    } finally {
      setIsImportingKjv(false);
    }
  };

  const runGhsImport = async () => {
    if (isImportingGhs) return;
    try {
      setIsImportingGhs(true);
      const result = await importBundledGhs();
      pushToast({
        kind: "success",
        title: "GHS hymnal installed",
        description: `${result.hymnsTotal.toLocaleString()} ${result.hymnal} hymns ready for search and projection.`
      });
    } catch (error) {
      pushToast({ kind: "error", title: "GHS import failed", description: toErrorMessage(error) });
    } finally {
      setIsImportingGhs(false);
    }
  };

  const downloadBibleVersion = async (version: DownloadableBibleVersion) => {
    if (downloadingBibleVersion) return;
    try {
      setDownloadingBibleVersion(version.abbreviation);
      const response = await fetch(version.url);
      if (!response.ok) throw new Error(`Download failed with status ${response.status}.`);
      const csvText = await response.text();
      const result = await importBibleCsv(version.abbreviation, version.name, csvText);
      await refreshBibleVersions();
      pushToast({
        kind: "success",
        title: `${version.abbreviation} Bible installed`,
        description: `${result.versesTotal.toLocaleString()} verses ready for projection.`
      });
    } catch (error) {
      pushToast({ kind: "error", title: `${version.abbreviation} download failed`, description: toErrorMessage(error) });
    } finally {
      setDownloadingBibleVersion(null);
    }
  };

  const runUpdateCheck = async () => {
    try {
      setIsCheckingUpdates(true);
      const status = await checkForUpdates();
      if (!status.updateAvailable) {
        pushToast({ kind: "success", title: "DL Projector is up to date", description: `Version ${status.currentVersion}` });
        return;
      }
      pushToast({ kind: "info", title: `Version ${status.latestVersion} is available`, description: "Opening the trusted GitHub release download." });
      if (isTauriRuntime()) {
        const { openUrl } = await import("@tauri-apps/plugin-opener");
        await openUrl(status.releaseUrl);
      } else {
        window.open(status.releaseUrl, "_blank", "noopener,noreferrer");
      }
    } catch (error) {
      pushToast({ kind: "error", title: "Update check failed", description: toErrorMessage(error) });
    } finally {
      setIsCheckingUpdates(false);
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
            <CardTitle>Scripture Library</CardTitle>
            <CardDescription>
              Install the bundled English KJV Bible for offline search and projection. This replaces demo scripture text.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            <div className="rounded-xl border border-gold-300/40 bg-gold-300/10 p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-navy-900 text-gold-300">
                  <BookOpen className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 font-black text-navy-900">
                    King James Version
                    {installedVersions.some((version) => version.abbreviation === "KJV") ? <Badge>Installed</Badge> : null}
                  </div>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    Imports all 66 books and 31,102 verses from the bundled CSV source into the local SQLite library.
                  </p>
                </div>
              </div>
            </div>
            <Button
              variant="gold"
              onClick={() => void runKjvImport()}
              disabled={isImportingKjv || installedVersions.some((version) => version.abbreviation === "KJV")}
            >
              <BookOpen className="h-4 w-4" />
              {installedVersions.some((version) => version.abbreviation === "KJV") ? "KJV Downloaded" : isImportingKjv ? "Installing KJV..." : "Install KJV Bible"}
            </Button>
            <div className="mt-3 grid gap-2">
              {downloadableBibleVersions.map((version) => (
                <div key={version.abbreviation} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-white/[0.72] px-3 py-2">
                  <div>
                    <div className="flex items-center gap-2 text-sm font-black text-navy-900">
                      {version.abbreviation}
                      {installedVersions.some((item) => item.abbreviation === version.abbreviation) ? <Badge>Installed</Badge> : null}
                    </div>
                    <div className="text-xs text-muted-foreground">{version.name}</div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => void downloadBibleVersion(version)}
                    disabled={Boolean(downloadingBibleVersion) || installedVersions.some((item) => item.abbreviation === version.abbreviation)}
                  >
                    {installedVersions.some((item) => item.abbreviation === version.abbreviation)
                      ? "Downloaded"
                      : downloadingBibleVersion === version.abbreviation
                        ? "Downloading..."
                        : "Download"}
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="dl-glass">
          <CardHeader>
            <CardTitle>Hymn Libraries</CardTitle>
            <CardDescription>
              Install bundled hymnals as separate libraries. GHS is available now; MHS can be added beside it later.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            <div className="rounded-xl border border-gold-300/40 bg-gold-300/10 p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-navy-900 text-gold-300">
                  <Music className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-black text-navy-900">Gospel Hymns and Songs</div>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    Imports 260 GHS hymns with stanzas, choruses, categories, and audio links where available.
                  </p>
                </div>
              </div>
            </div>
            <Button variant="gold" onClick={() => void runGhsImport()} disabled={isImportingGhs}>
              <Music className="h-4 w-4" />
              {isImportingGhs ? "Installing GHS..." : "Install GHS Hymnal"}
            </Button>
          </CardContent>
        </Card>

        <Card className="dl-glass">
          <CardHeader>
            <CardTitle>App Settings</CardTitle>
            <CardDescription>Stored locally in SQLite in the desktop app.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {settings.filter((setting) => !setting.key.startsWith("demo.") && !setting.key.startsWith("projection.last") && !setting.key.startsWith("projection.window")).map((setting) => (
              <SettingField key={setting.key} setting={setting} onChange={(value) => updateSetting(setting.key, value)} />
            ))}
            <Button variant="gold" onClick={() => void saveAll()}>
              <Save className="h-4 w-4" />
              Save Settings
            </Button>
            <Button variant="outline" onClick={() => void runUpdateCheck()} disabled={isCheckingUpdates}>
              <RefreshCw className={`h-4 w-4 ${isCheckingUpdates ? "animate-spin" : ""}`} />
              {isCheckingUpdates ? "Checking..." : "Check for updates"}
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

function SettingField({ setting, onChange }: { setting: AppSetting; onChange: (value: string) => void }) {
  const labels: Record<string, string> = {
    "projection.fontSize": "Projection font size",
    "projection.transition": "Slide transition",
    "projection.background": "Projection background",
    "projection.showScriptureVersion": "Show scripture version",
    "projection.showHymnTitle": "Show hymn title",
    "hymn.scrollSecondsPerLine": "Hymn scroll tempo (seconds per line)",
    "shortcut.next": "Next/project shortcut",
    "shortcut.blank": "Blank shortcut",
    "shortcut.logo": "Logo shortcut",
    "backup.autoEnabled": "Automatic backup on exit",
    "scripture.version": "Default Bible version",
    "loader.text": "Loading screen text"
  };
  const booleanSetting = setting.key === "backup.autoEnabled" || setting.key.startsWith("projection.show");
  const options =
    setting.key === "projection.transition"
      ? ["fade", "slide", "none"]
      : setting.key === "projection.background"
        ? ["navy", "black", "warm"]
        : null;

  return (
    <div className="space-y-2">
      <Label>{labels[setting.key] ?? setting.key}</Label>
      {booleanSetting ? (
        <select className="h-11 w-full rounded-lg border border-input bg-white px-3" value={setting.value} onChange={(event) => onChange(event.target.value)}>
          <option value="true">Enabled</option>
          <option value="false">Disabled</option>
        </select>
      ) : options ? (
        <select className="h-11 w-full rounded-lg border border-input bg-white px-3 capitalize" value={setting.value} onChange={(event) => onChange(event.target.value)}>
          {options.map((option) => <option key={option} value={option}>{option}</option>)}
        </select>
      ) : (
        <Input
          type={setting.key.includes("fontSize") || setting.key.includes("Seconds") ? "number" : "text"}
          min={setting.key.includes("fontSize") ? 36 : undefined}
          max={setting.key.includes("fontSize") ? 120 : undefined}
          step={setting.key.includes("Seconds") ? 0.1 : undefined}
          value={setting.value}
          onChange={(event) => onChange(event.target.value)}
        />
      )}
    </div>
  );
}
