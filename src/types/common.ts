export type EntityId = number;

export interface TimestampedEntity {
  id: EntityId;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export type ToastKind = "success" | "info" | "warning" | "error";

export interface AppToast {
  id: string;
  kind: ToastKind;
  title: string;
  description?: string;
}

export type ServiceItemType =
  | "text"
  | "scripture"
  | "hymn"
  | "announcement"
  | "personality"
  | "blank"
  | "logo"
  | "custom";
