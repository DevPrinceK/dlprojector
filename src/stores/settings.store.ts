import { create } from "zustand";
import { getSettings, type AppSetting } from "../features/settings/settings.api";

export interface ProjectionPreferences {
  fontSize: number;
  transition: "fade" | "slide" | "none";
  background: "navy" | "black" | "warm";
  showScriptureVersion: boolean;
  showHymnTitle: boolean;
  autoBackup: boolean;
  defaultBibleVersion: string;
  hymnScrollSecondsPerLine: number;
  shortcutNext: string;
  shortcutBlank: string;
  shortcutLogo: string;
  loaderText: string;
}

const defaults: ProjectionPreferences = {
  fontSize: 72,
  transition: "fade",
  background: "navy",
  showScriptureVersion: true,
  showHymnTitle: true,
  autoBackup: true,
  defaultBibleVersion: "KJV",
  hymnScrollSecondsPerLine: 4.2,
  shortcutNext: "Space",
  shortcutBlank: "b",
  shortcutLogo: "l",
  loaderText: "DLCF Legon"
};

interface SettingsStore {
  preferences: ProjectionPreferences;
  loaded: boolean;
  load: () => Promise<void>;
  apply: (settings: AppSetting[]) => void;
}

export const useSettingsStore = create<SettingsStore>((set) => ({
  preferences: defaults,
  loaded: false,
  load: async () => {
    try {
      const settings = await getSettings();
      set({ preferences: parseSettings(settings), loaded: true });
    } catch {
      set({ preferences: defaults, loaded: true });
    }
  },
  apply: (settings) => set({ preferences: parseSettings(settings), loaded: true })
}));

export function parseSettings(settings: AppSetting[]): ProjectionPreferences {
  const values = new Map(settings.map((setting) => [setting.key, setting.value]));
  const numberValue = (key: string, fallback: number) => {
    const parsed = Number(values.get(key));
    return Number.isFinite(parsed) ? parsed : fallback;
  };
  return {
    fontSize: Math.max(36, Math.min(120, numberValue("projection.fontSize", defaults.fontSize))),
    transition: oneOf(values.get("projection.transition"), ["fade", "slide", "none"], defaults.transition),
    background: oneOf(values.get("projection.background"), ["navy", "black", "warm"], defaults.background),
    showScriptureVersion: values.get("projection.showScriptureVersion") !== "false",
    showHymnTitle: values.get("projection.showHymnTitle") !== "false",
    autoBackup: values.get("backup.autoEnabled") !== "false",
    defaultBibleVersion: values.get("scripture.version") || defaults.defaultBibleVersion,
    hymnScrollSecondsPerLine: Math.max(2, Math.min(10, numberValue("hymn.scrollSecondsPerLine", defaults.hymnScrollSecondsPerLine))),
    shortcutNext: values.get("shortcut.next") || defaults.shortcutNext,
    shortcutBlank: values.get("shortcut.blank") || defaults.shortcutBlank,
    shortcutLogo: values.get("shortcut.logo") || defaults.shortcutLogo,
    loaderText: values.get("loader.text")?.trim() || defaults.loaderText
  };
}

function oneOf<T extends string>(value: string | undefined, values: readonly T[], fallback: T): T {
  return values.includes(value as T) ? (value as T) : fallback;
}
