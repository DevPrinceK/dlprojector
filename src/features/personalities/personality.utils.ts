import type { Personality } from "../../types/personality";
import type { ProjectionContent } from "../../types/projection";

export function personalityToProjection(personality: Personality): ProjectionContent {
  return {
    type: "personality",
    title: personality.fullName,
    subtitle: [personality.department, personality.role].filter(Boolean).join(" - "),
    body: personality.shortBio ?? undefined,
    reference: personality.favoriteScripture ?? undefined,
    imagePath: personality.photoPath ?? undefined,
    metadata: { personality }
  };
}
