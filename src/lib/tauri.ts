export function isTauriRuntime() {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

export async function invokeCommand<T>(command: string, args?: Record<string, unknown>) {
  if (!isTauriRuntime()) {
    throw new Error("Tauri runtime is unavailable.");
  }

  const { invoke } = await import("@tauri-apps/api/core");
  return invoke<T>(command, args);
}

export async function tryInvokeCommand<T>(
  command: string,
  args: Record<string, unknown> | undefined,
  fallback: () => Promise<T> | T
) {
  if (!isTauriRuntime()) {
    return fallback();
  }
  return invokeCommand<T>(command, args);
}
