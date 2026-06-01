import { localRepository } from "../../lib/localRepository";
import { tryInvokeCommand } from "../../lib/tauri";
import type {
  ServiceItem,
  ServiceItemInput,
  ServiceProgram,
  ServiceProgramInput
} from "../../types/service-program";

export async function getActiveServiceProgram() {
  return tryInvokeCommand<ServiceProgram | null>(
    "get_active_service_program",
    undefined,
    () => localRepository.getActiveServiceProgram()
  );
}

export async function listServicePrograms() {
  return tryInvokeCommand<ServiceProgram[]>("list_service_programs", undefined, () => localRepository.listServicePrograms());
}

export async function createServiceProgram(input: ServiceProgramInput) {
  return tryInvokeCommand<ServiceProgram>("create_service_program", { input }, () =>
    localRepository.createServiceProgram(input)
  );
}

export async function updateServiceProgram(id: number, input: ServiceProgramInput) {
  return tryInvokeCommand<ServiceProgram>("update_service_program", { id, input }, () =>
    localRepository.updateServiceProgram(id, input)
  );
}

export async function addServiceItem(input: ServiceItemInput) {
  return tryInvokeCommand<ServiceItem>("add_service_item", { input }, () => localRepository.addServiceItem(input));
}

export async function reorderServiceItems(serviceProgramId: number, itemIds: number[]) {
  return tryInvokeCommand<ServiceItem[]>(
    "reorder_service_items",
    { serviceProgramId, itemIds },
    () => localRepository.reorderServiceItems(serviceProgramId, itemIds)
  );
}
