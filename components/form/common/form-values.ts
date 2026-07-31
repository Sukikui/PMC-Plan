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
