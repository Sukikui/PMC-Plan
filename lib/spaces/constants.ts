export const SPACE_LOGO_URL_MAX_LENGTH = 512;
export const DEFAULT_SPACE_LOGO_BACKGROUND = 'color' as const;
export const DEFAULT_SPACE_LOGO_ZOOM = 1;
export const MAX_SPACE_LOGO_ZOOM = 3;
export const MIN_SPACE_LOGO_ZOOM = 1;
export const SPACE_LOGO_IMAGE_SCALE = Math.SQRT1_2;
export const SPACE_LOGO_ZOOM_STEP = 0.05;

export function clampSpaceLogoZoom(zoom: number) {
  return Math.min(MAX_SPACE_LOGO_ZOOM, Math.max(MIN_SPACE_LOGO_ZOOM, zoom));
}

export function getSpaceInitial(name: string) {
  return Array.from(name.trim())[0]?.toLocaleUpperCase('fr-FR') ?? '?';
}
