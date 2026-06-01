import { BLANK_CONTENT, LOADER_CONTENT, LOGO_CONTENT, type ProjectionContent } from "../types/projection";
import { isTauriRuntime } from "./tauri";

export const PROJECTION_CONTENT_EVENT = "projection:content";
export const PROJECTION_CLEAR_EVENT = "projection:clear";

const channelName = "dlprojector:projection";

function getBrowserChannel() {
  if (typeof BroadcastChannel === "undefined") return null;
  return new BroadcastChannel(channelName);
}

export async function emitProjectionContent(content: ProjectionContent) {
  if (isTauriRuntime()) {
    const { emit } = await import("@tauri-apps/api/event");
    await emit(PROJECTION_CONTENT_EVENT, content);
    return;
  }

  const payload = JSON.stringify(content);
  localStorage.setItem(channelName, payload);
  const channel = getBrowserChannel();
  channel?.postMessage(content);
  channel?.close();
}

export async function listenProjectionContent(onContent: (content: ProjectionContent) => void) {
  if (isTauriRuntime()) {
    const { listen } = await import("@tauri-apps/api/event");
    const unlisten = await listen<ProjectionContent>(PROJECTION_CONTENT_EVENT, (event) => {
      onContent(event.payload);
    });
    return unlisten;
  }

  const channel = getBrowserChannel();
  channel?.addEventListener("message", (event: MessageEvent<ProjectionContent>) => {
    onContent(event.data);
  });

  const storageListener = (event: StorageEvent) => {
    if (event.key !== channelName || !event.newValue) return;

    try {
      onContent(JSON.parse(event.newValue) as ProjectionContent);
    } catch {
      onContent(LOGO_CONTENT);
    }
  };

  window.addEventListener("storage", storageListener);

  return () => {
    channel?.close();
    window.removeEventListener("storage", storageListener);
  };
}

export async function showLogo() {
  await emitProjectionContent(LOGO_CONTENT);
}

export async function showBlank() {
  await emitProjectionContent(BLANK_CONTENT);
}

export async function showLoader() {
  await emitProjectionContent(LOADER_CONTENT);
}
