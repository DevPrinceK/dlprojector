import type { ServiceItem } from "../../types/service-program";

export function adjacentServiceItem(
  items: ServiceItem[],
  currentItemId: number | null,
  direction: -1 | 1
) {
  if (items.length === 0) return null;
  const currentIndex = items.findIndex((item) => item.id === currentItemId);
  if (currentIndex < 0) return direction === 1 ? items[0] : items[items.length - 1];
  return items[Math.max(0, Math.min(items.length - 1, currentIndex + direction))];
}
