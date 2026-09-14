/* eslint-disable @next/next/no-img-element -- ImageResponse requires standard image elements. */
import {
  getDefaultMinecraftHeadUrl,
  getMinecraftHeadUrl,
} from '@/lib/minecraft-head-service';
import QuestionMarkIcon from '@/components/icons/QuestionMarkIcon';
import { loadPortalDetailBySlug } from '@/lib/map-content/detail-server';
import { getMapIconSrc } from '@/lib/place/categories';
import { loadSocialImageSource } from '@/lib/social-preview/image-source';
import { createSocialImageResponse } from '@/lib/social-preview/image-response';
import {
  formatSocialCoordinates,
  getSocialHeaderTextSize,
  shouldCompactSocialMember,
} from '@/lib/social-preview/format';
import {
  SOCIAL_PREVIEW_SECONDARY_TEXT_SIZE,
  SocialPreviewFrame,
  SocialPreviewHeaderIdentity,
  SocialPreviewMember,
  SocialPreviewMetrics,
  SocialPreviewSpaceLogo,
  SocialPreviewWorldBadge,
} from '@/lib/social-preview/layout';

const PORTAL_HEADER_ICON_SIZE = 88;

interface RouteContext {
  params: Promise<{ slug: string }>;
}

export const runtime = 'nodejs';
export const revalidate = 300;

export async function GET(_request: Request, context: RouteContext) {
  const { slug } = await context.params;
  const portal = await loadPortalDetailBySlug(slug);
  if (!portal) return new Response('Portail introuvable.', { status: 404 });

  const owner = portal.owners[0] ?? null;
  const [mainImage, portalIcon, ownerHead, spaceLogo] = await Promise.all([
    loadSocialImageSource(portal.images[0]),
    loadSocialImageSource(getMapIconSrc('portail')),
    owner
      ? loadSocialImageSource(
        getMinecraftHeadUrl(owner.uuid, 128),
        getDefaultMinecraftHeadUrl(),
      )
      : Promise.resolve(null),
    portal.space?.logoUrl
      ? loadSocialImageSource(portal.space.logoUrl)
      : Promise.resolve(null),
  ]);
  const netherAssociate = portal['nether-associate'];
  const linked = Boolean(netherAssociate);
  const standaloneNetherAddress = portal.world === 'nether'
    ? portal.address
    : null;
  const titleSize = getSocialHeaderTextSize(portal.name, Boolean(portal.space));
  const primaryMetrics = toCoordinateMetrics(portal.coordinates);
  const secondaryMetrics = netherAssociate
    ? toAlignedCoordinateMetrics(portal.coordinates, netherAssociate.coordinates)
    : null;
  const coordinateLines = [formatSocialCoordinates(portal.coordinates)];
  const secondaryAddress = netherAssociate?.address ?? standaloneNetherAddress;
  if (netherAssociate) {
    coordinateLines.push(
      formatSocialCoordinates(netherAssociate.coordinates)
      + `${secondaryAddress ? ` • ${secondaryAddress}` : ''}`,
    );
  } else if (secondaryAddress) {
    coordinateLines[0] += ` • ${secondaryAddress}`;
  }
  const compactOwner = owner ? shouldCompactSocialMember({
    additionalCount: Math.max(0, portal.owners.length - 1),
    coordinateLines,
    memberName: owner.name,
    world: linked ? 'over+nether' : portal.world,
  }) : false;

  return createSocialImageResponse(
    <SocialPreviewFrame
      fallbackVisual={portalIcon ? (
        <img
          alt=""
          src={portalIcon}
          width={150}
          height={150}
          style={{ objectFit: 'contain', opacity: 0.85 }}
        />
      ) : null}
      footerLeft={(
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <SocialPreviewWorldBadge world={linked ? 'over+nether' : portal.world} />
          {netherAssociate ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              lineHeight: 1,
            }}>
              <SocialPreviewMetrics metrics={primaryMetrics} />
              <div style={{ display: 'flex', marginTop: 10 }}>
                <SocialPreviewMetrics
                  metrics={secondaryMetrics ?? []}
                  trailingValue={netherAssociate.address}
                />
              </div>
            </div>
          ) : (
            <SocialPreviewMetrics
              metrics={toCoordinateMetrics(portal.coordinates)}
              trailingValue={standaloneNetherAddress}
            />
          )}
        </div>
      )}
      footerRight={(
        <SocialPreviewMember
          additionalCount={Math.max(0, portal.owners.length - 1)}
          compact={compactOwner}
          headSource={ownerHead}
          member={owner}
        />
      )}
      headerLeft={(
        <SocialPreviewHeaderIdentity
          emphasized
          name={portal.name}
          prefix={portal.unidentified ? (
            <QuestionMarkIcon style={{
              width: titleSize,
              height: titleSize,
              flexShrink: 0,
            }} />
          ) : undefined}
          size={titleSize}
          visual={portalIcon ? (
            <img
              alt=""
              src={portalIcon}
              width={PORTAL_HEADER_ICON_SIZE}
              height={PORTAL_HEADER_ICON_SIZE}
              style={{ flexShrink: 0, objectFit: 'contain' }}
            />
          ) : null}
        />
      )}
      headerRight={portal.space ? (
        <SocialPreviewHeaderIdentity
          name={portal.space.name}
          side="secondary"
          size={SOCIAL_PREVIEW_SECONDARY_TEXT_SIZE}
          visual={<SocialPreviewSpaceLogo logo={portal.space} source={spaceLogo} />}
        />
      ) : undefined}
      mainImage={mainImage}
    />,
  );
}

function toCoordinateMetrics(coordinates: { x: number; y: number; z: number }) {
  return [
    { label: 'X', value: coordinates.x },
    { label: 'Y', value: coordinates.y },
    { label: 'Z', value: coordinates.z },
  ];
}

function toAlignedCoordinateMetrics(
  reference: { x: number; y: number; z: number },
  coordinates: { x: number; y: number; z: number },
) {
  return (['x', 'y', 'z'] as const).map((axis) => {
    const referenceValue = String(reference[axis]);
    const value = String(coordinates[axis]);
    return {
      label: axis.toUpperCase(),
      value: value.padEnd(Math.max(value.length, referenceValue.length), '\u2007'),
    };
  });
}
