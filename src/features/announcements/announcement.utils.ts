import type { Announcement } from "../../types/announcement";
import type { ProjectionContent } from "../../types/projection";

export function announcementToProjection(announcement: Announcement): ProjectionContent {
  const details = [announcement.eventDate, announcement.eventTime, announcement.venue].filter(Boolean).join(" - ");
  return {
    type: "announcement",
    title: announcement.title,
    subtitle: details || announcement.category || undefined,
    body: announcement.message,
    imagePath: announcement.imagePath ?? undefined,
    metadata: { announcement }
  };
}
