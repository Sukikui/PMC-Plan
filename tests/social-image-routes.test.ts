import { GET as getPlaceImage } from '@/app/lieux/[slug]/image/route';
import { GET as getPortalImage } from '@/app/portails/[slug]/image/route';
import { GET as getSpaceImage } from '@/app/espaces/[slug]/image/route';
import {
  loadPlaceDetailBySlug,
  loadPortalDetailBySlug,
} from '@/lib/map-content/detail-server';
import { loadSocialImageSource } from '@/lib/social-preview/image-source';
import { createPublicContentRoute } from '@/lib/social-preview/content-page';
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
}));

jest.mock('@/lib/spaces/summary-server', () => ({
  loadSpaceSummaryBySlug: jest.fn(),
}));

jest.mock('@/components/HomeMapApp', () => ({
  __esModule: true,
  default: 'home-map-app',
}));

const loadPlace = loadPlaceDetailBySlug as jest.Mock;
const loadPortal = loadPortalDetailBySlug as jest.Mock;
const loadImage = loadSocialImageSource as jest.Mock;
const loadSpace = loadSpaceSummaryBySlug as jest.Mock;

describe('public content routes', () => {
  beforeEach(() => jest.clearAllMocks());

  it('uses one canonical place identity for metadata and overlay navigation', async () => {
    loadPlace.mockResolvedValue({
      description: 'Une place incontournable.',
      id: 'marche-de-valnyfrost',
      mapEntryId: 'place-entry',
      name: 'Marché de Valnyfrost',
    });
    const route = createPublicContentRoute('place');
    const props = { params: Promise.resolve({ slug: 'marche-de-valnyfrost' }) };

    await expect(route.generateMetadata(props)).resolves.toMatchObject({
      title: 'Marché de Valnyfrost',
      alternates: { canonical: '/lieux/marche-de-valnyfrost' },
    });
    const page = await route.Page(props);

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
    const route = createPublicContentRoute('space');
    const page = await route.Page({
      params: Promise.resolve({ slug: 'valnyfrost' }),
    });

    expect(page.props.initialContent).toEqual({ space, type: 'space' });
  });
});

describe('social content metadata', () => {
  it('references the public page and its generated large image', () => {
    const metadata = createSocialContentMetadata({
      imageAlt: 'Aperçu du Marché sur PMC Plan',
      name: 'Marché',
      path: '/lieux/marche',
    });

    expect(metadata).toMatchObject({
      alternates: { canonical: '/lieux/marche' },
      description: null,
      openGraph: {
        images: [{
          alt: 'Aperçu du Marché sur PMC Plan',
          height: 630,
          url: '/lieux/marche/image',
          width: 1200,
        }],
        title: 'Marché',
        url: '/lieux/marche',
      },
      twitter: {
        card: 'summary_large_image',
        images: ['/lieux/marche/image'],
      },
    });
    expect(metadata.openGraph).not.toHaveProperty('description');
    expect(metadata.twitter).not.toHaveProperty('description');
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
    expect(loadImage).toHaveBeenCalledWith('https://images.example/place.png');
    expect(loadImage).toHaveBeenCalledWith(
      expect.stringContaining('/ioshead/owner-uuid/'),
      '/assets/minecraft/default-player-head.png',
    );
    expect(loadImage).toHaveBeenCalledWith('https://images.example/space.png');
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
    expect(loadImage).toHaveBeenCalledWith('https://images.example/place.png');
    expect(loadImage).toHaveBeenCalledWith('https://images.example/space.png');
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
    expect(loadImage).toHaveBeenCalledWith('https://images.example/portal.png');
    expect(loadImage).toHaveBeenCalledWith('/map/icons/portail_icon.png');
    expect(loadImage).toHaveBeenCalledWith(
      expect.stringContaining('/ioshead/owner-uuid/'),
      '/assets/minecraft/default-player-head.png',
    );
  });
});
