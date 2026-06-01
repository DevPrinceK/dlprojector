import { localRepository } from "../../lib/localRepository";
import { tryInvokeCommand } from "../../lib/tauri";
import type { Announcement, AnnouncementInput } from "../../types/announcement";

export async function listAnnouncements() {
  return tryInvokeCommand<Announcement[]>("list_announcements", undefined, () => localRepository.listAnnouncements());
}

export async function createAnnouncement(input: AnnouncementInput) {
  return tryInvokeCommand<Announcement>("create_announcement", { input }, () => localRepository.createAnnouncement(input));
}

export async function updateAnnouncement(id: number, input: AnnouncementInput) {
  return tryInvokeCommand<Announcement>("update_announcement", { id, input }, () =>
    localRepository.updateAnnouncement(id, input)
  );
}

export async function deleteAnnouncement(id: number) {
  return tryInvokeCommand<void>("delete_announcement", { id }, () => localRepository.deleteAnnouncement(id));
}
