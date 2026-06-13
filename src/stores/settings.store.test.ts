import { describe, expect, it } from "vitest";
import { parseSettings } from "./settings.store";

describe("projection settings", () => {
  it("parses saved preferences and clamps unsafe values", () => {
    const settings = parseSettings([
      { key: "projection.fontSize", value: "500" },
      { key: "projection.transition", value: "none" },
      { key: "projection.background", value: "black" },
      { key: "projection.showHymnTitle", value: "false" },
      { key: "hymn.scrollSecondsPerLine", value: "1" },
      { key: "shortcut.next", value: "Enter" },
      { key: "loader.text", value: "Evening Worship" },
      { key: "scripture.referencePosition", value: "bottom" },
      { key: "hymn.textAlign", value: "left" },
      { key: "backup.retention", value: "500" }
    ]);

    expect(settings.fontSize).toBe(120);
    expect(settings.transition).toBe("none");
    expect(settings.background).toBe("black");
    expect(settings.showHymnTitle).toBe(false);
    expect(settings.hymnScrollSecondsPerLine).toBe(2);
    expect(settings.shortcutNext).toBe("Enter");
    expect(settings.loaderText).toBe("Evening Worship");
    expect(settings.scriptureReferencePosition).toBe("bottom");
    expect(settings.hymnTextAlign).toBe("left");
    expect(settings.backupRetention).toBe(50);
  });

  it("falls back when persisted settings are malformed", () => {
    const settings = parseSettings([
      { key: "projection.fontSize", value: "not-a-number" },
      { key: "projection.transition", value: "explode" }
    ]);

    expect(settings.fontSize).toBe(72);
    expect(settings.transition).toBe("fade");
    expect(settings.autoBackup).toBe(true);
    expect(settings.loaderText).toBe("DLCF Legon");
  });
});
