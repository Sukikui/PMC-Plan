import { CONTENT_FIELD_LIMITS } from '@/lib/content/constraints';

export const slugify = (value: string) => {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, CONTENT_FIELD_LIMITS.slug);
};

export interface CoordinatesInput {
  x: string | number;
  y: string | number;
  z: string | number;
}

export const parseCoordinateTriplet = (coords: CoordinatesInput) => {
  const values = [coords.x, coords.y, coords.z];
  if (values.some((value) => String(value).trim() === '')) {
    return null;
  }
  const [x, y, z] = values.map(Number);
  if (![x, y, z].every(Number.isFinite)) return null;
  return { x, y, z };
};

export const generateFormId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2, 10);
};

export function moveArrayItemById<T extends { id: string }>(
  items: T[],
  sourceId: string,
  targetId: string,
) {
  const sourceIndex = items.findIndex(({ id }) => id === sourceId);
  const targetIndex = items.findIndex(({ id }) => id === targetId);
  if (sourceIndex < 0 || targetIndex < 0 || sourceIndex === targetIndex) return items;

  const reordered = [...items];
  const [movedItem] = reordered.splice(sourceIndex, 1);
  reordered.splice(targetIndex, 0, movedItem);
  return reordered;
}
