export type ProjectionContentType =
  | "scripture"
  | "hymn"
  | "announcement"
  | "personality"
  | "logo"
  | "blank"
  | "loader"
  | "custom";

export interface ProjectionContent {
  type: ProjectionContentType;
  title?: string;
  subtitle?: string;
  body?: string;
  reference?: string;
  imagePath?: string;
  metadata?: Record<string, unknown>;
}

export interface ProjectionState {
  currentContent: ProjectionContent | null;
  previousContent: ProjectionContent | null;
  isBlank: boolean;
  isProjectorConnected: boolean;
  lastUpdatedAt: string | null;
}

export const LOGO_CONTENT: ProjectionContent = {
  type: "logo",
  title: "DLCF Legon",
  subtitle: "Deeper Life Campus Fellowship"
};

export const BLANK_CONTENT: ProjectionContent = {
  type: "blank"
};

export const LOADER_CONTENT: ProjectionContent = {
  type: "loader",
  title: "DLCF Legon",
  subtitle: "Preparing Projection..."
};
