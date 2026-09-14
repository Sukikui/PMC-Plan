import { GET as getPlaceImage } from '@/app/lieux/[slug]/image/route';
import PlacePage, {
  generateMetadata as generatePlaceMetadata,
} from '@/app/lieux/[slug]/page';
import { GET as getPortalImage } from '@/app/portails/[slug]/image/route';
import PortalPage, {
  generateMetadata as generatePortalMetadata,
} from '@/app/portails/[slug]/page';
import { GET as getSpaceImage } from '@/app/espaces/[slug]/image/route';
import SpacePage from '@/app/espaces/[slug]/page';
import {
  loadPlaceDetailBySlug,
  loadPortalDetailBySlug,
} from '@/lib/map-content/detail-server';
import {
  SOCIAL_PREVIEW_HEIGHT,
  SOCIAL_PREVIEW_IMAGE_HEIGHT,
  SOCIAL_PREVIEW_WIDTH,
} from '@/lib/social-preview/constants';
import { shouldCompactSocialMember } from '@/lib/social-preview/format';
import {
  loadSocialImageSource,
  loadSocialUserImageSource,
} from '@/lib/social-preview/image-source';
import { createSocialContentMetadata } from '@/lib/social-preview/metadata';
import { loadSpaceSummaryBySlug } from '@/lib/spaces/summary-server';

jest.mock('next/og', () => ({
  ImageResponse: class extends Response {
    constructor(_element: unknown, options: { headers?: HeadersInit }) {
      super('image', {
        headers: {
          'Content-Type': 'image/png',
          ...options.headers,
        },
      });
    }
  },
}));

jest.mock('@/lib/map-content/detail-server', () => ({
  loadPlaceDetailBySlug: jest.fn(),
  loadPortalDetailBySlug: jest.fn(),
}));

jest.mock('@/lib/social-preview/image-source', () => ({
  loadSocialImageSource: jest.fn(() => Promise.resolve(
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAAB' +
    'CAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
  )),
  loadSocialUserImageSource: jest.fn(() => Promise.resolve(
    'data:image/png;base64,AQID',
  )),
}));

jest.mock('@/lib/spaces/summary-server', () => ({
  loadSpaceSummaryBySlug: jest.fn(),
}));

jest.mock('@/components/HomeMapApp', () => ({
  __esModule: true,
  default: 'home-map-app',
}));

jest.mock('next/navigation', () => ({
  notFound: jest.fn(() => {
    throw new Error('NEXT_NOT_FOUND');
  }),
}));

const loadPlace = loadPlaceDetailBySlug as jest.Mock;
const loadPortal = loadPortalDetailBySlug as jest.Mock;
const loadImage = loadSocialImageSource as jest.Mock;
const loadUserImage = loadSocialUserImageSource as jest.Mock;
const loadSpace = loadSpaceSummaryBySlug as jest.Mock;

describe('public content routes', () => {
  beforeEach(() => jest.clearAllMocks());

  it('uses one canonical place identity for metadata and overlay navigation', async () => {
    loadPlace.mockResolvedValue({
      description: 'Une place incontournable.',
      coordinates: { x: 13, y: 49, z: 74 },
      id: 'marche-de-valnyfrost',
      mapEntryId: 'place-entry',
      name: 'Marché de Valnyfrost',
      space: { name: 'Valnyfrost' },
      world: 'overworld',
    });
    const props = { params: Promise.resolve({ slug: 'marche-de-valnyfrost' }) };

    await expect(generatePlaceMetadata(props)).resolves.toMatchObject({
      title: 'Marché de Valnyfrost',
      description: 'overworld • X 13 • Y 49 • Z 74',
      alternates: { canonical: '/lieux/marche-de-valnyfrost' },
      openGraph: {
        description: 'overworld • X 13 • Y 49 • Z 74',
        title: 'Marché de Valnyfrost • Valnyfrost',
      },
      twitter: {
        description: 'overworld • X 13 • Y 49 • Z 74',
        title: 'Marché de Valnyfrost • Valnyfrost',
      },
    });
    const page = await PlacePage(props);

    expect(page.props.initialContent).toEqual({
      mapEntryId: 'place-entry',
      type: 'place',
    });
  });

  it('passes an existing space summary directly to the overlay', async () => {
    const space = {
      description: null,
      id: 'space-id',
      name: 'Valnyfrost',
      slug: 'valnyfrost',
    };
    loadSpace.mockResolvedValue(space);
    const page = await SpacePage({
      params: Promise.resolve({ slug: 'valnyfrost' }),
    });

    expect(page.props.initialContent).toEqual({ space, type: 'space' });
  });

  it('uses the canonical portal pair identity for metadata and navigation', async () => {
    loadPortal.mockResolvedValue({
      description: null,
      coordinates: { x: -800, y: 64, z: 1600 },
      mapEntryId: 'portal-entry',
      name: 'Portail de Valnyfrost',
      slug: 'portail-de-valnyfrost',
      space: { name: 'Valnyfrost' },
      world: 'overworld',
      'nether-associate': {
        coordinates: { x: -100, y: 71, z: 200 },
      },
    });
    const props = { params: Promise.resolve({ slug: 'portail-de-valnyfrost' }) };

    await expect(generatePortalMetadata(props)).resolves.toMatchObject({
      title: 'Portail de Valnyfrost',
      description: 'overworld • X -800 • Y 64 • Z 1600\n' +
        'nether • X -100 • Y 71 • Z 200',
      alternates: { canonical: '/portails/portail-de-valnyfrost' },
      openGraph: {
        description: 'overworld • X -800 • Y 64 • Z 1600\n' +
          'nether • X -100 • Y 71 • Z 200',
        title: 'Portail de Valnyfrost • Valnyfrost',
      },
      twitter: {
        description: 'overworld • X -800 • Y 64 • Z 1600\n' +
          'nether • X -100 • Y 71 • Z 200',
        title: 'Portail de Valnyfrost • Valnyfrost',
      },
    });
    const page = await PortalPage(props);

    expect(page.props.initialContent).toEqual({
      mapEntryId: 'portal-entry',
      type: 'portal',
    });
  });

  it('returns the Next.js not-found boundary for an unknown public slug', async () => {
    loadPlace.mockResolvedValue(null);

    await expect(PlacePage({
      params: Promise.resolve({ slug: 'lieu-inconnu' }),
    })).rejects.toThrow('NEXT_NOT_FOUND');
  });
});

describe('social content metadata', () => {
  it('references the public page and its generated large image', () => {
    const metadata = createSocialContentMetadata({
      description: 'overworld • X 13 • Y 49 • Z 74',
      imageAlt: 'Aperçu du Marché sur PMC Plan',
      imageVersion: 'version-1',
      name: 'Marché',
      path: '/lieux/marche',
      previewTitle: 'Marché • Valnyfrost',
    });

    expect(metadata).toMatchObject({
      alternates: { canonical: '/lieux/marche' },
      description: 'overworld • X 13 • Y 49 • Z 74',
      openGraph: {
        description: 'overworld • X 13 • Y 49 • Z 74',
        images: [{
          alt: 'Aperçu du Marché sur PMC Plan',
          height: 957,
          url: '/lieux/marche/image?v=version-1',
          width: 1200,
        }],
        title: 'Marché • Valnyfrost',
        url: '/lieux/marche',
      },
      twitter: {
        card: 'summary_large_image',
        description: 'overworld • X 13 • Y 49 • Z 74',
        images: ['/lieux/marche/image?v=version-1'],
        title: 'Marché • Valnyfrost',
      },
    });
  });

  it('reserves a full-width 16:9 area for the primary image', () => {
    expect(SOCIAL_PREVIEW_IMAGE_HEIGHT * 16).toBe(SOCIAL_PREVIEW_WIDTH * 9);
    expect(SOCIAL_PREVIEW_HEIGHT).toBe(957);
  });
});

describe('social preview footer layout', () => {
  it('keeps a short owner identity visible when the footer fits', () => {
    expect(shouldCompactSocialMember({
      additionalCount: 0,
      coordinateLines: ['X 13 • Y 49 • Z 74'],
      memberName: 'Suki',
      world: 'overworld',
    })).toBe(false);
  });

  it('compacts the owner when linked coordinates and address fill the footer', () => {
    expect(shouldCompactSocialMember({
      additionalCount: 3,
      coordinateLines: [
        'X -12345 • Y 64 • Z 12345',
        'X -1543 • Y 71 • Z 1543 • Axe nord, troisième sortie à droite',
      ],
      memberName: 'LongMinecraftName',
      world: 'over+nether',
    })).toBe(true);
  });
});

describe('place social image route', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 404 for an unknown place slug', async () => {
    loadPlace.mockResolvedValue(null);

    const response = await getPlaceImage(new Request('http://localhost'), {
      params: Promise.resolve({ slug: 'inconnu' }),
    });

    expect(response.status).toBe(404);
    expect(await response.text()).toBe('Lieu introuvable.');
    expect(loadImage).not.toHaveBeenCalled();
  });

  it('builds the image from the primary place, owner, and space assets', async () => {
    loadPlace.mockResolvedValue({
      category: 'commerce',
      color: '#3B82F6',
      coordinates: { x: -800, y: 64, z: 1600 },
      images: ['https://images.example/place.png'],
      name: 'Marché de Valnyfrost',
      owners: [
        { name: 'Suki', uuid: 'owner-uuid' },
        { name: 'Second', uuid: 'second-uuid' },
      ],
      space: {
        color: '#1F2A65',
        logoBackground: 'color',
        logoUrl: 'https://images.example/space.png',
        logoZoom: 1,
        name: 'Valnyfrost',
      },
      world: 'overworld',
    });

    const response = await getPlaceImage(new Request('http://localhost'), {
      params: Promise.resolve({ slug: 'marche-de-valnyfrost' }),
    });

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe('image/png');
    expect(loadPlace).toHaveBeenCalledWith('marche-de-valnyfrost');
    expect(loadUserImage).toHaveBeenCalledWith(
      'https://images.example/place.png',
      'http://localhost/',
      false,
    );
    expect(loadImage).toHaveBeenCalledWith(
      expect.stringContaining('/ioshead/owner-uuid/'),
      '/assets/minecraft/default-player-head.png',
    );
    expect(loadUserImage).toHaveBeenCalledWith(
      'https://images.example/space.png',
      'http://localhost/',
      false,
    );
  });

  it('long-caches only a versioned render with every user image available', async () => {
    loadPlace.mockResolvedValue({
      category: 'commerce',
      coordinates: { x: 13, y: 49, z: 74 },
      images: ['https://images.example/place.png'],
      name: 'Marché',
      owners: [],
      space: null,
      world: 'overworld',
    });

    const response = await getPlaceImage(new Request(
      'http://localhost/lieux/marche/image?v=content-version',
      { headers: { 'X-PMC-Social-Preview-Warm': '1' } },
    ), {
      params: Promise.resolve({ slug: 'marche' }),
    });

    expect(response.headers.get('cache-control'))
      .toBe('public, max-age=86400, immutable');
    expect(response.headers.get('vercel-cdn-cache-control'))
      .toBe('public, max-age=31536000');
    expect(loadUserImage).toHaveBeenCalledWith(
      'https://images.example/place.png',
      'http://localhost/lieux/marche/image?v=content-version',
      true,
    );
  });

  it('short-caches a versioned fallback when its user image is unavailable', async () => {
    loadPlace.mockResolvedValue({
      category: 'commerce',
      coordinates: { x: 13, y: 49, z: 74 },
      images: ['https://images.example/place.png'],
      name: 'Marché',
      owners: [],
      space: null,
      world: 'overworld',
    });
    loadUserImage.mockResolvedValueOnce(null);

    const response = await getPlaceImage(new Request(
      'http://localhost/lieux/marche/image?v=content-version',
    ), {
      params: Promise.resolve({ slug: 'marche' }),
    });

    expect(response.headers.get('cache-control'))
      .toBe('public, max-age=0, s-maxage=60, stale-while-revalidate=300');
    expect(response.headers.has('vercel-cdn-cache-control')).toBe(false);
  });

  it('does not load a fallback head when the place has no owner', async () => {
    loadPlace.mockResolvedValue({
      category: 'construction',
      coordinates: { x: 0, y: 64, z: 0 },
      images: [],
      name: 'Spawn',
      owners: [],
      space: null,
      world: 'overworld',
    });

    const response = await getPlaceImage(new Request('http://localhost'), {
      params: Promise.resolve({ slug: 'spawn' }),
    });

    expect(response.status).toBe(200);
    expect(loadImage.mock.calls.some((call) => (
      call[1] === '/assets/minecraft/default-player-head.png'
    ))).toBe(false);
  });
});

describe('space social image route', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 404 for an unknown space slug', async () => {
    loadSpace.mockResolvedValue(null);

    const response = await getSpaceImage(new Request('http://localhost'), {
      params: Promise.resolve({ slug: 'inconnu' }),
    });

    expect(response.status).toBe(404);
    expect(await response.text()).toBe('Espace introuvable.');
    expect(loadImage).not.toHaveBeenCalled();
  });

  it('builds the image from the space preview, identity, counts, and members', async () => {
    loadSpace.mockResolvedValue({
      color: '#1F2A65',
      firstMember: { name: 'Suki', uuid: 'member-uuid' },
      logoBackground: 'color',
      logoUrl: 'https://images.example/space.png',
      logoZoom: 1.5,
      memberCount: 2,
      name: 'Valnyfrost',
      offerCount: 4,
      placeCount: 3,
      portalCount: 2,
      previewImage: 'https://images.example/place.png',
    });

    const response = await getSpaceImage(new Request('http://localhost'), {
      params: Promise.resolve({ slug: 'valnyfrost' }),
    });

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe('image/png');
    expect(loadSpace).toHaveBeenCalledWith('valnyfrost');
    expect(loadUserImage).toHaveBeenCalledWith(
      'https://images.example/place.png',
      'http://localhost/',
      false,
    );
    expect(loadUserImage).toHaveBeenCalledWith(
      'https://images.example/space.png',
      'http://localhost/',
      false,
    );
    expect(loadImage).toHaveBeenCalledWith(
      expect.stringContaining('/ioshead/member-uuid/'),
      '/assets/minecraft/default-player-head.png',
    );
  });
});

describe('portal social image route', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 404 for an unknown portal slug', async () => {
    loadPortal.mockResolvedValue(null);

    const response = await getPortalImage(new Request('http://localhost'), {
      params: Promise.resolve({ slug: 'inconnu' }),
    });

    expect(response.status).toBe(404);
    expect(await response.text()).toBe('Portail introuvable.');
    expect(loadImage).not.toHaveBeenCalled();
  });

  it('builds a linked portal image from its shared assets', async () => {
    loadPortal.mockResolvedValue({
      address: '',
      coordinates: { x: -800, y: 64, z: 1600 },
      images: ['https://images.example/portal.png'],
      name: 'Portail de Valnyfrost',
      unidentified: false,
      'nether-associate': {
        address: 'Nord 5 droite',
        coordinates: { x: -100, y: 71, z: 200 },
        description: null,
      },
      owners: [
        { name: 'Suki', uuid: 'owner-uuid' },
        { name: 'Second', uuid: 'second-uuid' },
      ],
      space: {
        color: '#1F2A65',
        logoBackground: 'color',
        logoUrl: 'https://images.example/space.png',
        logoZoom: 1,
        name: 'Valnyfrost',
      },
      world: 'overworld',
    });

    const response = await getPortalImage(new Request('http://localhost'), {
      params: Promise.resolve({ slug: 'portail-de-valnyfrost' }),
    });

    expect(response.status).toBe(200);
    expect(loadPortal).toHaveBeenCalledWith('portail-de-valnyfrost');
    expect(loadUserImage).toHaveBeenCalledWith(
      'https://images.example/portal.png',
      'http://localhost/',
      false,
    );
    expect(loadImage).toHaveBeenCalledWith('/map/icons/portail_icon.png');
    expect(loadImage).toHaveBeenCalledWith(
      expect.stringContaining('/ioshead/owner-uuid/'),
      '/assets/minecraft/default-player-head.png',
    );
  });
});
