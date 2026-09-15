/* eslint-disable @next/next/no-img-element -- ImageResponse requires standard image elements. */
import {
  getDefaultMinecraftHeadUrl,
  getMinecraftHeadUrl,
} from '@/lib/minecraft-head-service';
import { loadPlaceDetailBySlug } from '@/lib/map-content/detail-server';
import { getMapIconSrc } from '@/lib/place/categories';
import {
  loadSocialImageSource,
  loadSocialUserImageSource,
} from '@/lib/social-preview/image-source';
import {
  canLongCacheSocialPreview,
  createSocialImageResponse,
  isSocialPreviewWarmRequest,
} from '@/lib/social-preview/image-response';
import {
  formatSocialCoordinates,
  getSocialHeaderTextSize,
  shouldCompactSocialMember,
} from '@/lib/social-preview/format';
import {
  SOCIAL_PREVIEW_ICON_SIZE,
  SOCIAL_PREVIEW_SECONDARY_TEXT_SIZE,
  SocialPreviewFrame,
  SocialPreviewHeaderIdentity,
  SocialPreviewMember,
  SocialPreviewMetrics,
  SocialPreviewSpaceLogo,
  SocialPreviewWorldBadge,
} from '@/lib/social-preview/layout';

interface RouteContext {
  params: Promise<{ slug: string }>;
}

export const runtime = 'nodejs';
export const revalidate = 300;

export async function GET(request: Request, context: RouteContext) {
  const { slug } = await context.params;
  const place = await loadPlaceDetailBySlug(slug);
  if (!place) return new Response('Lieu introuvable.', { status: 404 });

  const owner = place.owners[0] ?? null;
  const mainImageSource = place.images[0];
  const spaceLogoSource = place.space?.logoUrl;
  const warm = isSocialPreviewWarmRequest(request);
  const [mainImage, categoryIcon, ownerHead, spaceLogo] = await Promise.all([
    loadSocialUserImageSource(mainImageSource, request.url, warm),
    loadSocialImageSource(getMapIconSrc(place.category)),
    owner
      ? loadSocialImageSource(
        getMinecraftHeadUrl(owner.uuid, 128),
        getDefaultMinecraftHeadUrl(),
      )
      : Promise.resolve(null),
    spaceLogoSource
      ? loadSocialUserImageSource(spaceLogoSource, request.url, warm)
      : Promise.resolve(null),
  ]);
  const netherAddress = place.world === 'nether' ? place.address : null;
  const compactOwner = owner ? shouldCompactSocialMember({
    additionalCount: Math.max(0, place.owners.length - 1),
    coordinateLines: [
      formatSocialCoordinates(place.coordinates)
      + `${netherAddress ? ` • ${netherAddress}` : ''}`,
    ],
    memberName: owner.name,
    world: place.world,
  }) : false;
  const titleSize = getSocialHeaderTextSize(place.name, Boolean(place.space));

  return createSocialImageResponse(
    <SocialPreviewFrame
      fallbackVisual={categoryIcon ? (
        <img
          alt=""
          src={categoryIcon}
          width={150}
          height={150}
          style={{ objectFit: 'contain', opacity: 0.85 }}
        />
      ) : null}
      footerLeft={(
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <SocialPreviewWorldBadge world={place.world} />
          <SocialPreviewMetrics metrics={[
            { label: 'X', value: place.coordinates.x },
            { label: 'Y', value: place.coordinates.y },
            { label: 'Z', value: place.coordinates.z },
          ]} trailingValue={netherAddress} />
        </div>
      )}
      footerRight={(
        <SocialPreviewMember
          additionalCount={Math.max(0, place.owners.length - 1)}
          compact={compactOwner}
          headSource={ownerHead}
          member={owner}
        />
      )}
      headerLeft={(
        <SocialPreviewHeaderIdentity
          emphasized
          name={place.name}
          size={titleSize}
          visual={categoryIcon ? (
            <img
              alt=""
              src={categoryIcon}
              width={SOCIAL_PREVIEW_ICON_SIZE}
              height={SOCIAL_PREVIEW_ICON_SIZE}
              style={{ flexShrink: 0, objectFit: 'contain' }}
            />
          ) : null}
        />
      )}
      headerRight={place.space ? (
        <SocialPreviewHeaderIdentity
          name={place.space.name}
          side="secondary"
          size={SOCIAL_PREVIEW_SECONDARY_TEXT_SIZE}
          visual={<SocialPreviewSpaceLogo logo={place.space} source={spaceLogo} />}
        />
      ) : undefined}
      mainImage={mainImage}
    />,
    canLongCacheSocialPreview(request, [
      [mainImageSource, mainImage],
      [spaceLogoSource, spaceLogo],
    ]),
  );
}
