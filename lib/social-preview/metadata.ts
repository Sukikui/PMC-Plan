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
  imageVersion: string;
  name: string;
  path: string;
  previewTitle?: string;
}

interface MapContentSocialDescriptionOptions {
  coordinates: SocialCoordinates;
  netherCoordinates?: SocialCoordinates | null;
  world: string;
}

export function createSocialContentMetadata({
  description,
  imageAlt,
  imageVersion,
  name,
  path,
  previewTitle = name,
}: SocialContentMetadataOptions): Metadata {
  const imageUrl = `${path}/image?v=${imageVersion}`;

  return {
    title: name,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: 'website',
      locale: 'fr_FR',
      siteName: 'PMC Plan',
      url: path,
      title: previewTitle,
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
      title: previewTitle,
      ...(description ? { description } : {}),
      images: [imageUrl],
    },
  };
}

export function createMapContentSocialDescription({
  coordinates,
  netherCoordinates,
  world,
}: MapContentSocialDescriptionOptions) {
  const coordinateLines = [formatSocialCoordinateLine(world, coordinates)];
  if (netherCoordinates) {
    coordinateLines.push(formatSocialCoordinateLine('nether', netherCoordinates));
  }
  return coordinateLines.join('\n');
}
