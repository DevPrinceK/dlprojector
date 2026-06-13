import { describe, expect, it } from "vitest";
import type { ServiceItem } from "../../types/service-program";
import { adjacentServiceItem } from "./service-navigation";

const items = [1, 2, 3].map(
  (id, index) =>
    ({
      id,
      serviceProgramId: 1,
      itemType: "custom",
      title: `Item ${id}`,
      position: index,
      createdAt: "",
      updatedAt: ""
    }) satisfies ServiceItem
);

describe("adjacentServiceItem", () => {
  it("selects the first item when moving forward without a current item", () => {
    expect(adjacentServiceItem(items, null, 1)?.id).toBe(1);
  });

  it("moves in either direction and stops at the rail boundaries", () => {
    expect(adjacentServiceItem(items, 2, 1)?.id).toBe(3);
    expect(adjacentServiceItem(items, 2, -1)?.id).toBe(1);
    expect(adjacentServiceItem(items, 3, 1)?.id).toBe(3);
    expect(adjacentServiceItem(items, 1, -1)?.id).toBe(1);
  });
});
