import { useRef, useState } from "react";
import { ConfirmDialog } from "../components/ui/confirm-dialog";

interface Confirmation {
  title: string;
  description: string;
  confirmLabel?: string;
}

export function useConfirm() {
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const resolver = useRef<((confirmed: boolean) => void) | null>(null);

  const confirm = (next: Confirmation) =>
    new Promise<boolean>((resolve) => {
      resolver.current = resolve;
      setConfirmation(next);
    });

  const close = (confirmed: boolean) => {
    resolver.current?.(confirmed);
    resolver.current = null;
    setConfirmation(null);
  };

  return {
    confirm,
    confirmationDialog: (
      <ConfirmDialog
        open={Boolean(confirmation)}
        title={confirmation?.title ?? "Confirm action"}
        description={confirmation?.description ?? ""}
        confirmLabel={confirmation?.confirmLabel}
        onOpenChange={(open) => {
          if (!open) close(false);
        }}
        onConfirm={() => close(true)}
      />
    )
  };
}
