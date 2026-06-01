import { localRepository } from "../../lib/localRepository";
import { tryInvokeCommand } from "../../lib/tauri";
import type { Personality, PersonalityInput } from "../../types/personality";

export async function listPersonalities() {
  return tryInvokeCommand<Personality[]>("list_personalities", undefined, () => localRepository.listPersonalities());
}

export async function createPersonality(input: PersonalityInput) {
  return tryInvokeCommand<Personality>("create_personality", { input }, () => localRepository.createPersonality(input));
}

export async function updatePersonality(id: number, input: PersonalityInput) {
  return tryInvokeCommand<Personality>("update_personality", { id, input }, () =>
    localRepository.updatePersonality(id, input)
  );
}

export async function deletePersonality(id: number) {
  return tryInvokeCommand<void>("delete_personality", { id }, () => localRepository.deletePersonality(id));
}
