import type { EntityId, ServiceItemType, TimestampedEntity } from "./common";
import type { ProjectionContent } from "./projection";

export interface ServiceProgram extends TimestampedEntity {
  title: string;
  serviceDate?: string | null;
  notes?: string | null;
  isActive: boolean;
  items: ServiceItem[];
}

export interface ServiceProgramInput {
  title: string;
  serviceDate?: string;
  notes?: string;
  isActive?: boolean;
}

export interface ServiceItem extends TimestampedEntity {
  serviceProgramId: EntityId;
  itemType: ServiceItemType;
  title: string;
  linkedEntityId?: EntityId | null;
  customContentJson?: ProjectionContent | null;
  position: number;
}

export interface ServiceItemInput {
  serviceProgramId: EntityId;
  itemType: ServiceItemType;
  title: string;
  linkedEntityId?: EntityId;
  customContentJson?: ProjectionContent;
  position?: number;
}
