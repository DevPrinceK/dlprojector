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

export async function duplicateServiceProgram(id: number, title: string) {
  return tryInvokeCommand<ServiceProgram>("duplicate_service_program", { id, title }, () =>
    localRepository.duplicateServiceProgram(id, title)
  );
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

export async function deleteServiceProgram(id: number) {
  return tryInvokeCommand<void>("delete_service_program", { id }, () => localRepository.deleteServiceProgram(id));
}

export async function addServiceItem(input: ServiceItemInput) {
  return tryInvokeCommand<ServiceItem>("add_service_item", { input }, () => localRepository.addServiceItem(input));
}

export async function updateServiceItem(id: number, input: ServiceItemInput) {
  return tryInvokeCommand<ServiceItem>("update_service_item", { id, input }, () => localRepository.updateServiceItem(id, input));
}

export async function deleteServiceItem(id: number) {
  return tryInvokeCommand<void>("delete_service_item", { id }, () => localRepository.deleteServiceItem(id));
}

export async function reorderServiceItems(serviceProgramId: number, itemIds: number[]) {
  return tryInvokeCommand<ServiceItem[]>(
    "reorder_service_items",
    { serviceProgramId, itemIds },
    () => localRepository.reorderServiceItems(serviceProgramId, itemIds)
  );
}
