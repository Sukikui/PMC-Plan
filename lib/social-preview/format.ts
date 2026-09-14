import {
  SOCIAL_PREVIEW_FOOTER_GAP,
  SOCIAL_PREVIEW_HORIZONTAL_PADDING,
  SOCIAL_PREVIEW_WIDTH,
} from './constants';

export interface SocialCoordinates {
  x: number;
  y: number;
  z: number;
}

const HEADER_TEXT_SIZES = {
  large: 48,
  medium: 40,
  compact: 34,
} as const;
const WORLD_BADGE_HORIZONTAL_PADDING = 40;
const WORLD_BADGE_FONT_SIZE = 26;
const METRICS_FONT_SIZE = 30;
const MEMBER_HEAD_SIZE = 76;
const MEMBER_CONTENT_GAP = 16;
const MEMBER_NAME_FONT_SIZE = 31;
const MEMBER_COUNT_FONT_SIZE = 29;

export function formatSocialCoordinates(coordinates: SocialCoordinates) {
  return `X ${coordinates.x} • Y ${coordinates.y} • Z ${coordinates.z}`;
}

export function formatSocialCoordinateLine(
  world: string,
  coordinates: SocialCoordinates,
) {
  return `${world} • ${formatSocialCoordinates(coordinates)}`;
}

export function getSocialHeaderTextSize(
  primaryName: string,
  hasSecondaryIdentity = false,
) {
  const primaryLength = Array.from(primaryName.trim()).length;
  if (!hasSecondaryIdentity) {
    if (primaryLength <= 28) return HEADER_TEXT_SIZES.large;
    if (primaryLength <= 44) return HEADER_TEXT_SIZES.medium;
    return HEADER_TEXT_SIZES.compact;
  }

  if (primaryLength <= 18) return HEADER_TEXT_SIZES.large;
  if (primaryLength <= 30) return HEADER_TEXT_SIZES.medium;
  return HEADER_TEXT_SIZES.compact;
}

export function getSocialCountLabel(
  count: number,
  singular: string,
  plural: string,
) {
  return count === 1 ? singular : plural;
}

export function shouldCompactSocialMember({
  additionalCount,
  coordinateLines,
  memberName,
  world,
}: {
  additionalCount: number;
  coordinateLines: string[];
  memberName: string;
  world: string;
}) {
  const availableWidth = SOCIAL_PREVIEW_WIDTH
    - (SOCIAL_PREVIEW_HORIZONTAL_PADDING * 2);
  const badgeWidth = estimateTextWidth(world, WORLD_BADGE_FONT_SIZE)
    + WORLD_BADGE_HORIZONTAL_PADDING;
  const metricsWidth = Math.max(
    ...coordinateLines.map((line) => estimateTextWidth(line, METRICS_FONT_SIZE)),
  );
  const memberCountWidth = additionalCount > 0
    ? MEMBER_CONTENT_GAP
      + estimateTextWidth(`+ ${additionalCount}`, MEMBER_COUNT_FONT_SIZE)
    : 0;
  const memberWidth = MEMBER_HEAD_SIZE
    + MEMBER_CONTENT_GAP
    + estimateTextWidth(memberName, MEMBER_NAME_FONT_SIZE)
    + memberCountWidth;

  return badgeWidth + 24 + metricsWidth + SOCIAL_PREVIEW_FOOTER_GAP + memberWidth
    > availableWidth;
}

function estimateTextWidth(text: string, fontSize: number) {
  return Array.from(text).reduce((width, character) => {
    if (character === ' ') return width + (fontSize * 0.28);
    if (/[ilI1|]/.test(character)) return width + (fontSize * 0.3);
    if (/[MW@]/.test(character)) return width + (fontSize * 0.82);
    return width + (fontSize * 0.56);
  }, 0);
}
