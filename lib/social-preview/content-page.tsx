import { cache } from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import HomeMapApp, { type HomeMapDeepLink } from '@/components/HomeMapApp';
import { getPublicContentPath } from '@/lib/content-path';
import {
  loadPlaceDetailBySlug,
  loadPortalDetailBySlug,
} from '@/lib/map-content/detail-server';
import { loadSpaceSummaryBySlug } from '@/lib/spaces/summary-server';
import {
  createMapContentSocialDescription,
  createSocialContentMetadata,
} from './metadata';

type PublicContentType = HomeMapDeepLink['type'];

interface PublicContentPageProps {
  params: Promise<{ slug: string }>;
}

interface PublicContentIdentity {
  deepLink: HomeMapDeepLink;
  name: string;
  slug: string;
  socialDescription: string | null;
}

export function createPublicContentRoute(type: PublicContentType) {
  return {
    async generateMetadata({ params }: PublicContentPageProps): Promise<Metadata> {
      const content = await loadPublicContent(type, await readSlug(params));
      if (!content) notFound();

      return createSocialContentMetadata({
        description: content.socialDescription,
        imageAlt: getImageAlt(type, content.name),
        name: content.name,
        path: getPublicContentPath(type, content.slug),
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
  if (type === 'place') {
    const place = await loadPlaceDetailBySlug(slug);
    return place ? {
      deepLink: { mapEntryId: place.mapEntryId, type: 'place' },
      name: place.name,
      slug: place.id,
      socialDescription: createMapContentSocialDescription({
        contentType: 'Lieu',
        coordinates: place.coordinates,
        spaceName: place.space?.name,
        world: place.world,
      }),
    } : null;
  }
  if (type === 'portal') {
    const portal = await loadPortalDetailBySlug(slug);
    return portal ? {
      deepLink: { mapEntryId: portal.mapEntryId, type: 'portal' },
      name: portal.name,
      slug: portal.slug,
      socialDescription: createMapContentSocialDescription({
        contentType: 'Portail',
        coordinates: portal.coordinates,
        netherCoordinates: portal['nether-associate']?.coordinates,
        spaceName: portal.space?.name,
        world: portal.world,
      }),
    } : null;
  }
  const space = await loadSpaceSummaryBySlug(slug);
  return space ? {
    deepLink: { space, type: 'space' },
    name: space.name,
    slug: space.slug,
    socialDescription: null,
  } : null;
});

function getImageAlt(type: PublicContentType, name: string) {
  return type === 'space'
    ? `Aperçu de l'espace ${name} sur PMC Plan`
    : `Aperçu de ${name} sur PMC Plan`;
}
