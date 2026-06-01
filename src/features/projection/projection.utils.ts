import { BLANK_CONTENT, LOADER_CONTENT, LOGO_CONTENT, type ProjectionContent } from "../../types/projection";

export function coerceProjectionContent(content: ProjectionContent | null | undefined): ProjectionContent {
  if (!content || !content.type) return LOGO_CONTENT;
  if (content.type === "blank") return BLANK_CONTENT;
  if (content.type === "loader") return LOADER_CONTENT;
  return content;
}

export function getProjectionTitle(content: ProjectionContent) {
  return content.title ?? content.reference ?? content.subtitle ?? content.type;
}
