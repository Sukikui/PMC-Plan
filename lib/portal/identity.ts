export const UNIDENTIFIED_PORTAL_LABEL = 'Portail inconnu';

const GENERATED_PORTAL_SLUG_ALPHABET = 'abcdefghjkmnpqrstuvwxyz23456789';
const GENERATED_PORTAL_SLUG_LENGTH = 5;
export const UNIDENTIFIED_PORTAL_SLUG_PATTERN = new RegExp(
  `^portail-[${GENERATED_PORTAL_SLUG_ALPHABET}]{${GENERATED_PORTAL_SLUG_LENGTH}}$`,
);

export function getPortalDisplayName(name: string | null | undefined) {
  return name?.trim() || UNIDENTIFIED_PORTAL_LABEL;
}

export function isPortalUnidentified(name: string | null | undefined) {
  return !name?.trim();
}

export function generateUnidentifiedPortalSlug() {
  const values = new Uint8Array(GENERATED_PORTAL_SLUG_LENGTH);
  globalThis.crypto.getRandomValues(values);
  const suffix = Array.from(values, (value) => (
    GENERATED_PORTAL_SLUG_ALPHABET[value % GENERATED_PORTAL_SLUG_ALPHABET.length]
  )).join('');

  return `portail-${suffix}`;
}
