import {
  getDefaultMinecraftHeadUrl,
  getMinecraftHeadUrl,
} from '@/lib/minecraft-head-service';
import { loadSocialImageSource } from '@/lib/social-preview/image-source';
import { createSocialImageResponse } from '@/lib/social-preview/image-response';
import {
  SocialPreviewFrame,
  SocialPreviewHeaderIdentity,
  SocialPreviewMember,
  SocialPreviewMetrics,
  SocialPreviewSpaceLogo,
  getSocialCountLabel,
  getSocialHeaderTextSize,
} from '@/lib/social-preview/layout';
import { loadSpaceSummaryBySlug } from '@/lib/spaces/summary-server';

interface RouteContext {
  params: Promise<{ slug: string }>;
}

export const runtime = 'nodejs';
export const revalidate = 300;

export async function GET(_request: Request, context: RouteContext) {
  const { slug } = await context.params;
  const space = await loadSpaceSummaryBySlug(slug);
  if (!space) return new Response('Espace introuvable.', { status: 404 });

  const member = space.firstMember;
  const [mainImage, spaceLogo, memberHead] = await Promise.all([
    loadSocialImageSource(space.previewImage),
    space.logoUrl ? loadSocialImageSource(space.logoUrl) : Promise.resolve(null),
    member
      ? loadSocialImageSource(
        getMinecraftHeadUrl(member.uuid, 128),
        getDefaultMinecraftHeadUrl(),
      )
      : Promise.resolve(null),
  ]);
  const titleSize = getSocialHeaderTextSize(space.name);
  const logo = <SocialPreviewSpaceLogo logo={space} size={70} source={spaceLogo} />;
  const metrics = [
    {
      label: getSocialCountLabel(space.placeCount, 'lieu', 'lieux'),
      value: space.placeCount,
    },
    {
      label: getSocialCountLabel(space.portalCount, 'portail', 'portails'),
      value: space.portalCount,
    },
    {
      label: getSocialCountLabel(space.offerCount, 'offre', 'offres'),
      value: space.offerCount,
    },
  ].filter(({ value }) => value > 0);

  return createSocialImageResponse(
    <SocialPreviewFrame
      fallbackVisual={(
        <SocialPreviewSpaceLogo logo={space} size={150} source={spaceLogo} />
      )}
      footerLeft={metrics.length > 0 ? (
        <SocialPreviewMetrics
          valueFirst
          metrics={metrics}
        />
      ) : null}
      footerRight={(
        <SocialPreviewMember
          additionalCount={Math.max(0, space.memberCount - 1)}
          headSource={memberHead}
          member={member}
        />
      )}
      headerLeft={(
        <SocialPreviewHeaderIdentity
          emphasized
          name={space.name}
          size={titleSize}
          visual={logo}
        />
      )}
      mainImage={mainImage}
    />,
  );
}
