import { create } from "zustand";
import { emitProjectionContent, showBlank, showLoader, showLogo } from "../lib/events";
import { localRepository } from "../lib/localRepository";
import { tryInvokeCommand } from "../lib/tauri";
import { BLANK_CONTENT, LOADER_CONTENT, LOGO_CONTENT, type ProjectionContent } from "../types/projection";

interface ProjectionStore {
  previewContent: ProjectionContent | null;
  currentContent: ProjectionContent;
  previousContent: ProjectionContent | null;
  lastUpdatedAt: string | null;
  setPreviewContent: (content: ProjectionContent | null) => void;
  projectContent: (content: ProjectionContent) => Promise<void>;
  projectPreview: () => Promise<void>;
  showLogo: () => Promise<void>;
  showBlank: () => Promise<void>;
  showLoader: () => Promise<void>;
  restorePrevious: () => Promise<void>;
  emergencyReset: () => Promise<void>;
}

export const useProjectionStore = create<ProjectionStore>((set, get) => ({
  previewContent: LOGO_CONTENT,
  currentContent: LOADER_CONTENT,
  previousContent: null,
  lastUpdatedAt: null,
  setPreviewContent: (previewContent) => set({ previewContent }),
  projectContent: async (content) => {
    const previousContent = get().currentContent;
    await emitProjectionContent(content);
    try {
      await tryInvokeCommand("record_projection_history", { content }, () => localRepository.recordProjection(content));
    } catch (error) {
      console.warn("Projection history could not be recorded.", error);
    }
    set({
      currentContent: content,
      previousContent,
      lastUpdatedAt: new Date().toISOString()
    });
  },
  projectPreview: async () => {
    const preview = get().previewContent;
    if (preview) {
      await get().projectContent(preview);
    }
  },
  showLogo: async () => {
    await showLogo();
    set({
      previousContent: get().currentContent,
      currentContent: LOGO_CONTENT,
      lastUpdatedAt: new Date().toISOString()
    });
  },
  showBlank: async () => {
    await showBlank();
    set({
      previousContent: get().currentContent,
      currentContent: BLANK_CONTENT,
      lastUpdatedAt: new Date().toISOString()
    });
  },
  showLoader: async () => {
    await showLoader();
    set({
      previousContent: get().currentContent,
      currentContent: LOADER_CONTENT,
      lastUpdatedAt: new Date().toISOString()
    });
  },
  restorePrevious: async () => {
    const previous = get().previousContent;
    if (!previous) return;
    const current = get().currentContent;
    await emitProjectionContent(previous);
    set({
      previousContent: current,
      currentContent: previous,
      lastUpdatedAt: new Date().toISOString()
    });
  },
  emergencyReset: async () => {
    await showLogo();
    set({
      previewContent: LOGO_CONTENT,
      previousContent: null,
      currentContent: LOGO_CONTENT,
      lastUpdatedAt: new Date().toISOString()
    });
  }
}));
