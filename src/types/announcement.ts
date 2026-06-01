import type { TimestampedEntity } from "./common";

export interface Announcement extends TimestampedEntity {
  title: string;
  message: string;
  eventDate?: string | null;
  eventTime?: string | null;
  venue?: string | null;
  imagePath?: string | null;
  category?: string | null;
  isActive: boolean;
}

export interface AnnouncementInput {
  title: string;
  message: string;
  eventDate?: string;
  eventTime?: string;
  venue?: string;
  imagePath?: string;
  category?: string;
  isActive?: boolean;
}
