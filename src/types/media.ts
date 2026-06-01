import type { TimestampedEntity } from "./common";

export interface MediaAsset extends TimestampedEntity {
  fileName: string;
  filePath: string;
  fileType: string;
  fileSize: number;
}
