import type { TimestampedEntity } from "./common";

export interface Personality extends TimestampedEntity {
  fullName: string;
  department?: string | null;
  role?: string | null;
  favoriteScripture?: string | null;
  shortBio?: string | null;
  photoPath?: string | null;
  weekDate?: string | null;
  isActive: boolean;
}

export interface PersonalityInput {
  fullName: string;
  department?: string;
  role?: string;
  favoriteScripture?: string;
  shortBio?: string;
  photoPath?: string;
  weekDate?: string;
  isActive?: boolean;
}
