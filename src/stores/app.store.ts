import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AppToast } from "../types/common";

export type ControlView =
  | "dashboard"
  | "scriptures"
  | "hymns"
  | "announcements"
  | "personality"
  | "service"
  | "media"
  | "settings";

interface AppStore {
  activeView: ControlView;
  toasts: AppToast[];
  setActiveView: (view: ControlView) => void;
  pushToast: (toast: Omit<AppToast, "id">) => void;
  removeToast: (id: string) => void;
}

export const useAppStore = create<AppStore>()(persist((set) => ({
  activeView: "dashboard",
  toasts: [],
  setActiveView: (activeView) => set({ activeView }),
  pushToast: (toast) =>
    set((state) => ({
      toasts: [{ ...toast, id: crypto.randomUUID() }, ...state.toasts].slice(0, 4)
    })),
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((toast) => toast.id !== id)
    }))
}), {
  name: "dlprojector:app",
  partialize: (state) => ({ activeView: state.activeView })
}));
