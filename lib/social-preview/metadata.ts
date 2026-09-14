import type { Metadata } from 'next';
import {
  SOCIAL_PREVIEW_HEIGHT,
  SOCIAL_PREVIEW_WIDTH,
} from './constants';
import {
  formatSocialCoordinateLine,
  type SocialCoordinates,
} from './format';

interface SocialContentMetadataOptions {
  description: string | null;
  imageAlt: string;
  name: string;
  path: string;
}

interface MapContentSocialDescriptionOptions {
  contentType: 'Lieu' | 'Portail';
  coordinates: SocialCoordinates;
  netherCoordinates?: SocialCoordinates | null;
  spaceName?: string;
  world: string;
}

export function createSocialContentMetadata({
  description,
  imageAlt,
  name,
  path,
}: SocialContentMetadataOptions): Metadata {
  const imageUrl = `${path}/image`;

  return {
    title: name,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: 'website',
      locale: 'fr_FR',
      siteName: 'PMC Plan',
      url: path,
      title: name,
      ...(description ? { description } : {}),
      images: [{
        url: imageUrl,
        width: SOCIAL_PREVIEW_WIDTH,
        height: SOCIAL_PREVIEW_HEIGHT,
        alt: imageAlt,
      }],
    },
    twitter: {
      card: 'summary_large_image',
      title: name,
      ...(description ? { description } : {}),
      images: [imageUrl],
    },
  };
}

export function createMapContentSocialDescription({
  contentType,
  coordinates,
  netherCoordinates,
  spaceName,
  world,
}: MapContentSocialDescriptionOptions) {
  const identity = spaceName ? `${contentType} • ${spaceName}` : contentType;
  const coordinateLines = [formatSocialCoordinateLine(world, coordinates)];
  if (netherCoordinates) {
    coordinateLines.push(formatSocialCoordinateLine('nether', netherCoordinates));
  }
  return [identity, ...coordinateLines].join('\n');
}
