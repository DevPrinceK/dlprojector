import { ToastRegion } from "../../components/common/ToastRegion";
import { useKeyboardShortcuts } from "../../hooks/useKeyboardShortcuts";
import { ControlConsole } from "./ControlConsole";

export function ControlApp() {
  useKeyboardShortcuts();

  return (
    <>
      <ControlConsole />
      <ToastRegion />
    </>
  );
}
