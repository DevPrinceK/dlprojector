import { create } from "zustand";

interface UiStore {
  isPreviewPinned: boolean;
  setPreviewPinned: (value: boolean) => void;
}

export const useUiStore = create<UiStore>((set) => ({
  isPreviewPinned: true,
  setPreviewPinned: (isPreviewPinned) => set({ isPreviewPinned })
}));
