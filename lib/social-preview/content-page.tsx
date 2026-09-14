import { cache } from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import HomeMapApp, { type HomeMapDeepLink } from '@/components/HomeMapApp';
import { getPublicContentPath } from '@/lib/content-path';
import {
  loadSocialPreviewContent,
} from './content-data';
import {
  createMapContentSocialDescription,
  createSocialContentMetadata,
} from './metadata';
import { createSocialPreviewVersion } from './version';

type PublicContentType = HomeMapDeepLink['type'];

interface PublicContentPageProps {
  params: Promise<{ slug: string }>;
}

interface PublicContentIdentity {
  deepLink: HomeMapDeepLink;
  name: string;
  slug: string;
  socialImageVersion: string;
  socialDescription: string | null;
  socialTitle: string;
}

export function createPublicContentRoute(type: PublicContentType) {
  return {
    async generateMetadata({ params }: PublicContentPageProps): Promise<Metadata> {
      const content = await loadPublicContent(type, await readSlug(params));
      if (!content) notFound();

      return createSocialContentMetadata({
        description: content.socialDescription,
        imageAlt: getImageAlt(type, content.name),
        imageVersion: content.socialImageVersion,
        name: content.name,
        path: getPublicContentPath(type, content.slug),
        previewTitle: content.socialTitle,
      });
    },
    async Page({ params }: PublicContentPageProps) {
      const content = await loadPublicContent(type, await readSlug(params));
      if (!content) notFound();

      return <HomeMapApp initialContent={content.deepLink} />;
    },
  };
}

async function readSlug(params: PublicContentPageProps['params']) {
  return (await params).slug;
}

const loadPublicContent = cache(async function loadPublicContent(
  type: PublicContentType,
  slug: string,
): Promise<PublicContentIdentity | null> {
  const loaded = await loadSocialPreviewContent(type, slug);
  if (!loaded) return null;

  if (loaded.type === 'place') {
    const place = loaded.value;
    return {
      deepLink: { mapEntryId: place.mapEntryId, type: 'place' },
      name: place.name,
      slug: place.id,
      socialImageVersion: createSocialPreviewVersion(place),
      socialDescription: createMapContentSocialDescription({
        coordinates: place.coordinates,
        world: place.world,
      }),
      socialTitle: getMapContentSocialTitle(place.name, place.space?.name),
    };
  }
  if (loaded.type === 'portal') {
    const portal = loaded.value;
    return {
      deepLink: { mapEntryId: portal.mapEntryId, type: 'portal' },
      name: portal.name,
      slug: portal.slug,
      socialImageVersion: createSocialPreviewVersion(portal),
      socialDescription: createMapContentSocialDescription({
        coordinates: portal.coordinates,
        netherCoordinates: portal['nether-associate']?.coordinates,
        world: portal.world,
      }),
      socialTitle: getMapContentSocialTitle(portal.name, portal.space?.name),
    };
  }
  const space = loaded.value;
  return {
    deepLink: { space, type: 'space' },
    name: space.name,
    slug: space.slug,
    socialImageVersion: createSocialPreviewVersion(space),
    socialDescription: null,
    socialTitle: space.name,
  };
});

function getMapContentSocialTitle(name: string, spaceName?: string) {
  return spaceName ? `${name} • ${spaceName}` : name;
}

function getImageAlt(type: PublicContentType, name: string) {
  return type === 'space'
    ? `Aperçu de l'espace ${name} sur PMC Plan`
    : `Aperçu de ${name} sur PMC Plan`;
}
