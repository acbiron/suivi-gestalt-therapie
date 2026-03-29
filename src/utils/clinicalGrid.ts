// src/utils/clinicalGrid.ts
import { ClinicalGridItem } from "../types";

export function computeClinicalScores(
  selectedItemIds: string[],
  items: ClinicalGridItem[]
): [string, number][] {
  const scores: Record<string, number> = {};

  items
    .filter((item) => selectedItemIds.includes(item.id))
    .forEach((item) => {
      item.types.forEach((type) => {
        scores[type] = (scores[type] || 0) + 1;
      });
    });

  return Object.entries(scores).sort((a, b) => b[1] - a[1]);
}

export function getSelectedClinicalItems(
  selectedItemIds: string[],
  items: ClinicalGridItem[]
): ClinicalGridItem[] {
  return items.filter((item) => selectedItemIds.includes(item.id));
}

export function getTopClinicalTypes(
  selectedItemIds: string[],
  items: ClinicalGridItem[],
  limit = 3
): [string, number][] {
  return computeClinicalScores(selectedItemIds, items).slice(0, limit);
}
