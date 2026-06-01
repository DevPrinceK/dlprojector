import type { Announcement, AnnouncementInput } from "../types/announcement";
import type { EntityId } from "../types/common";
import type { Hymn, HymnInput } from "../types/hymn";
import type { MediaAsset } from "../types/media";
import type { Personality, PersonalityInput } from "../types/personality";
import type { ProjectionContent } from "../types/projection";
import type { BibleVerse, ScriptureSearchResult } from "../types/scripture";
import type {
  ServiceItem,
  ServiceItemInput,
  ServiceProgram,
  ServiceProgramInput
} from "../types/service-program";
import { nowIso } from "./utils";
import { parseScriptureReference } from "../features/scriptures/scripture.utils";

interface LocalDb {
  hymns: Hymn[];
  announcements: Announcement[];
  personalities: Personality[];
  servicePrograms: ServiceProgram[];
  mediaAssets: MediaAsset[];
  recentScriptures: ScriptureSearchResult[];
  projectionHistory: ProjectionContent[];
  nextId: number;
}

const key = "dlprojector:local-db:v1";

const seedVerses: BibleVerse[] = [
  verse(1, "Genesis", 1, 1, "In the beginning God created the heaven and the earth."),
  verse(2, "Genesis", 1, 2, "And the earth was without form, and void; and darkness was upon the face of the deep."),
  verse(3, "Genesis", 1, 3, "And God said, Let there be light: and there was light."),
  verse(4, "Genesis", 1, 4, "And God saw the light, that it was good: and God divided the light from the darkness."),
  verse(5, "Genesis", 1, 5, "And God called the light Day, and the darkness he called Night."),
  verse(6, "Psalm", 23, 1, "The LORD is my shepherd; I shall not want."),
  verse(7, "Psalm", 23, 2, "He maketh me to lie down in green pastures: he leadeth me beside the still waters."),
  verse(8, "Psalm", 23, 3, "He restoreth my soul: he leadeth me in the paths of righteousness for his name's sake."),
  verse(9, "John", 3, 16, "For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life."),
  verse(10, "Romans", 8, 28, "And we know that all things work together for good to them that love God, to them who are the called according to his purpose.")
];

function verse(id: number, bookName: string, chapter: number, verseNumber: number, text: string): BibleVerse {
  return {
    id,
    versionId: 1,
    bookId: id,
    bookName,
    chapter,
    verse: verseNumber,
    text,
    version: "KJV"
  };
}

function seedDb(): LocalDb {
  const createdAt = nowIso();
  return {
    nextId: 100,
    hymns: [
      {
        id: 1,
        number: "001",
        title: "Amazing Grace",
        category: "Worship",
        author: "John Newton",
        lyricsJson: {
          title: "Amazing Grace",
          number: "001",
          stanzas: [
            "Amazing grace, how sweet the sound\nThat saved a wretch like me\nI once was lost, but now am found\nWas blind, but now I see",
            "'Twas grace that taught my heart to fear\nAnd grace my fears relieved\nHow precious did that grace appear\nThe hour I first believed"
          ],
          chorus: ""
        },
        isActive: true,
        createdAt,
        updatedAt: createdAt
      }
    ],
    announcements: [
      {
        id: 2,
        title: "Midweek Bible Study",
        message: "Join us this Wednesday as we study the Word and pray together.",
        eventDate: createdAt.slice(0, 10),
        eventTime: "18:30",
        venue: "DLCF Legon Auditorium",
        imagePath: null,
        category: "Fellowship",
        isActive: true,
        createdAt,
        updatedAt: createdAt
      }
    ],
    personalities: [
      {
        id: 3,
        fullName: "DLCF Legon Member",
        department: "Choir",
        role: "Vocalist",
        favoriteScripture: "Romans 8:28",
        shortBio: "Serving joyfully and encouraging the fellowship through music.",
        photoPath: null,
        weekDate: createdAt.slice(0, 10),
        isActive: true,
        createdAt,
        updatedAt: createdAt
      }
    ],
    servicePrograms: [
      {
        id: 4,
        title: "Sunday Worship Service",
        serviceDate: createdAt.slice(0, 10),
        notes: "Default service flow.",
        isActive: true,
        createdAt,
        updatedAt: createdAt,
        items: [
          serviceItem(5, 4, "logo", "Welcome / Logo", { type: "logo", title: "DLCF Legon" }, 1),
          serviceItem(6, 4, "text", "Opening Prayer", { type: "custom", title: "Opening Prayer", body: "Let us pray." }, 2),
          serviceItem(7, 4, "blank", "Blank Screen", { type: "blank" }, 3)
        ]
      }
    ],
    mediaAssets: [],
    recentScriptures: [],
    projectionHistory: []
  };
}

function serviceItem(
  id: number,
  serviceProgramId: number,
  itemType: ServiceItem["itemType"],
  title: string,
  customContentJson: ProjectionContent,
  position: number
): ServiceItem {
  const createdAt = nowIso();
  return {
    id,
    serviceProgramId,
    itemType,
    title,
    linkedEntityId: null,
    customContentJson,
    position,
    createdAt,
    updatedAt: createdAt
  };
}

function loadDb() {
  const raw = localStorage.getItem(key);
  if (!raw) {
    const seeded = seedDb();
    saveDb(seeded);
    return seeded;
  }

  try {
    return JSON.parse(raw) as LocalDb;
  } catch {
    const seeded = seedDb();
    saveDb(seeded);
    return seeded;
  }
}

function saveDb(db: LocalDb) {
  localStorage.setItem(key, JSON.stringify(db));
}

function nextId(db: LocalDb) {
  db.nextId += 1;
  return db.nextId;
}

export const localRepository = {
  searchScriptures(query: string): ScriptureSearchResult[] {
    const parsed = parseScriptureReference(query);
    const normalized = query.trim().toLowerCase();
    let verses = seedVerses;

    if (parsed) {
      verses = seedVerses.filter((item) => {
        const bookMatches = item.bookName.toLowerCase() === parsed.book.toLowerCase();
        const chapterMatches = item.chapter === parsed.chapter;
        const start = parsed.verseStart ?? 1;
        const end = parsed.verseEnd ?? parsed.verseStart ?? Number.MAX_SAFE_INTEGER;
        return bookMatches && chapterMatches && item.verse >= start && item.verse <= end;
      });
    } else if (normalized) {
      verses = seedVerses.filter((item) => {
        const haystack = `${item.bookName} ${item.chapter}:${item.verse} ${item.text}`.toLowerCase();
        return haystack.includes(normalized);
      });
    }

    const grouped = groupScriptureResults(verses);
    if (grouped[0]) {
      const db = loadDb();
      db.recentScriptures = [grouped[0], ...db.recentScriptures.filter((item) => item.reference !== grouped[0].reference)].slice(0, 8);
      saveDb(db);
    }

    return grouped;
  },

  getRecentScriptures() {
    return loadDb().recentScriptures;
  },

  listHymns() {
    return loadDb().hymns.filter((item) => !item.deletedAt);
  },

  searchHymns(query: string) {
    const normalized = query.trim().toLowerCase();
    return this.listHymns().filter((hymn) => {
      const lyrics = hymn.lyricsJson.stanzas.join(" ");
      return `${hymn.number} ${hymn.title} ${lyrics}`.toLowerCase().includes(normalized);
    });
  },

  createHymn(input: HymnInput) {
    const db = loadDb();
    const timestamp = nowIso();
    const hymn: Hymn = {
      id: nextId(db),
      number: input.number,
      title: input.title,
      category: input.category,
      author: input.author,
      lyricsJson: input.lyricsJson,
      isActive: input.isActive ?? true,
      createdAt: timestamp,
      updatedAt: timestamp
    };
    db.hymns.unshift(hymn);
    saveDb(db);
    return hymn;
  },

  updateHymn(id: EntityId, input: HymnInput) {
    const db = loadDb();
    const hymn = db.hymns.find((item) => item.id === id);
    if (!hymn) throw new Error("Hymn not found.");
    Object.assign(hymn, input, { updatedAt: nowIso() });
    saveDb(db);
    return hymn;
  },

  deleteHymn(id: EntityId) {
    const db = loadDb();
    const hymn = db.hymns.find((item) => item.id === id);
    if (hymn) hymn.deletedAt = nowIso();
    saveDb(db);
  },

  listAnnouncements() {
    return loadDb().announcements.filter((item) => !item.deletedAt);
  },

  createAnnouncement(input: AnnouncementInput) {
    const db = loadDb();
    const timestamp = nowIso();
    const announcement: Announcement = {
      id: nextId(db),
      title: input.title,
      message: input.message,
      eventDate: input.eventDate,
      eventTime: input.eventTime,
      venue: input.venue,
      imagePath: input.imagePath,
      category: input.category,
      isActive: input.isActive ?? true,
      createdAt: timestamp,
      updatedAt: timestamp
    };
    db.announcements.unshift(announcement);
    saveDb(db);
    return announcement;
  },

  updateAnnouncement(id: EntityId, input: AnnouncementInput) {
    const db = loadDb();
    const announcement = db.announcements.find((item) => item.id === id);
    if (!announcement) throw new Error("Announcement not found.");
    Object.assign(announcement, input, { updatedAt: nowIso() });
    saveDb(db);
    return announcement;
  },

  deleteAnnouncement(id: EntityId) {
    const db = loadDb();
    const announcement = db.announcements.find((item) => item.id === id);
    if (announcement) announcement.deletedAt = nowIso();
    saveDb(db);
  },

  listPersonalities() {
    return loadDb().personalities.filter((item) => !item.deletedAt);
  },

  createPersonality(input: PersonalityInput) {
    const db = loadDb();
    const timestamp = nowIso();
    const personality: Personality = {
      id: nextId(db),
      fullName: input.fullName,
      department: input.department,
      role: input.role,
      favoriteScripture: input.favoriteScripture,
      shortBio: input.shortBio,
      photoPath: input.photoPath,
      weekDate: input.weekDate,
      isActive: input.isActive ?? true,
      createdAt: timestamp,
      updatedAt: timestamp
    };
    db.personalities.unshift(personality);
    saveDb(db);
    return personality;
  },

  updatePersonality(id: EntityId, input: PersonalityInput) {
    const db = loadDb();
    const personality = db.personalities.find((item) => item.id === id);
    if (!personality) throw new Error("Personality not found.");
    Object.assign(personality, input, { updatedAt: nowIso() });
    saveDb(db);
    return personality;
  },

  deletePersonality(id: EntityId) {
    const db = loadDb();
    const personality = db.personalities.find((item) => item.id === id);
    if (personality) personality.deletedAt = nowIso();
    saveDb(db);
  },

  getActiveServiceProgram() {
    return loadDb().servicePrograms.find((item) => item.isActive) ?? loadDb().servicePrograms[0] ?? null;
  },

  listServicePrograms() {
    return loadDb().servicePrograms.filter((program) => !program.deletedAt);
  },

  createServiceProgram(input: ServiceProgramInput) {
    const db = loadDb();
    const timestamp = nowIso();
    if (input.isActive ?? true) {
      db.servicePrograms.forEach((program) => {
        program.isActive = false;
      });
    }
    const program: ServiceProgram = {
      id: nextId(db),
      title: input.title,
      serviceDate: input.serviceDate,
      notes: input.notes,
      isActive: input.isActive ?? true,
      createdAt: timestamp,
      updatedAt: timestamp,
      items: []
    };
    db.servicePrograms.unshift(program);
    saveDb(db);
    return program;
  },

  updateServiceProgram(id: EntityId, input: ServiceProgramInput) {
    const db = loadDb();
    const program = db.servicePrograms.find((item) => item.id === id);
    if (!program) throw new Error("Service program not found.");
    if (input.isActive ?? false) {
      db.servicePrograms.forEach((candidate) => {
        candidate.isActive = candidate.id === id;
      });
    }
    program.title = input.title;
    program.serviceDate = input.serviceDate;
    program.notes = input.notes;
    program.isActive = input.isActive ?? program.isActive;
    program.updatedAt = nowIso();
    saveDb(db);
    return program;
  },

  deleteServiceProgram(id: EntityId) {
    const db = loadDb();
    const program = db.servicePrograms.find((item) => item.id === id);
    if (program) program.deletedAt = nowIso();
    saveDb(db);
  },

  addServiceItem(input: ServiceItemInput) {
    const db = loadDb();
    const program = db.servicePrograms.find((item) => item.id === input.serviceProgramId);
    if (!program) throw new Error("Service program not found.");
    const timestamp = nowIso();
    const item: ServiceItem = {
      id: nextId(db),
      serviceProgramId: input.serviceProgramId,
      itemType: input.itemType,
      title: input.title,
      linkedEntityId: input.linkedEntityId,
      customContentJson: input.customContentJson,
      position: input.position ?? program.items.length + 1,
      createdAt: timestamp,
      updatedAt: timestamp
    };
    program.items.push(item);
    program.items.sort((a, b) => a.position - b.position);
    saveDb(db);
    return item;
  },

  updateServiceItem(id: EntityId, input: ServiceItemInput) {
    const db = loadDb();
    const program = db.servicePrograms.find((item) => item.id === input.serviceProgramId);
    if (!program) throw new Error("Service program not found.");
    const item = program.items.find((candidate) => candidate.id === id);
    if (!item) throw new Error("Service item not found.");
    Object.assign(item, {
      itemType: input.itemType,
      title: input.title,
      linkedEntityId: input.linkedEntityId,
      customContentJson: input.customContentJson,
      position: input.position ?? item.position,
      updatedAt: nowIso()
    });
    saveDb(db);
    return item;
  },

  deleteServiceItem(id: EntityId) {
    const db = loadDb();
    db.servicePrograms.forEach((program) => {
      program.items = program.items.filter((item) => item.id !== id);
    });
    saveDb(db);
  },

  reorderServiceItems(serviceProgramId: EntityId, itemIds: EntityId[]) {
    const db = loadDb();
    const program = db.servicePrograms.find((item) => item.id === serviceProgramId);
    if (!program) throw new Error("Service program not found.");
    program.items.forEach((item) => {
      const index = itemIds.indexOf(item.id);
      item.position = index >= 0 ? index + 1 : item.position;
      item.updatedAt = nowIso();
    });
    program.items.sort((a, b) => a.position - b.position);
    saveDb(db);
    return program.items;
  },

  listMediaAssets() {
    return loadDb().mediaAssets;
  },

  recordProjection(content: ProjectionContent) {
    const db = loadDb();
    db.projectionHistory.unshift(content);
    db.projectionHistory = db.projectionHistory.slice(0, 30);
    saveDb(db);
  }
};

function groupScriptureResults(verses: BibleVerse[]): ScriptureSearchResult[] {
  const groups = new Map<string, BibleVerse[]>();

  for (const item of verses) {
    const key = `${item.bookName} ${item.chapter}`;
    groups.set(key, [...(groups.get(key) ?? []), item]);
  }

  return Array.from(groups.entries()).map(([key, group]) => {
    const sorted = group.sort((a, b) => a.verse - b.verse);
    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    return {
      reference: first === last ? `${key}:${first.verse}` : `${key}:${first.verse}-${last.verse}`,
      version: first?.version ?? "KJV",
      verses: sorted
    };
  });
}
