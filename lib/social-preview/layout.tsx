import { Fragment, type ReactNode } from 'react';
import { getColorForeground } from '@/lib/content/colors';
import type { MinecraftOwner } from '@/lib/map-entry/types';
import {
  SPACE_LOGO_IMAGE_SCALE,
  clampSpaceLogoZoom,
  getSpaceInitial,
} from '@/lib/spaces/constants';
import type { SpaceReference } from '@/lib/spaces/types';
import {
  SOCIAL_PREVIEW_FOOTER_HEIGHT,
  SOCIAL_PREVIEW_FOOTER_GAP,
  SOCIAL_PREVIEW_HEADER_HEIGHT,
  SOCIAL_PREVIEW_HORIZONTAL_PADDING,
  SOCIAL_PREVIEW_IMAGE_HEIGHT,
  SOCIAL_PREVIEW_WIDTH,
} from './constants';

export const SOCIAL_PREVIEW_ICON_SIZE = 72;
export const SOCIAL_PREVIEW_SECONDARY_TEXT_SIZE = 31;

const COLORS = {
  background: '#FFFFFF',
  foreground: '#111827',
  muted: '#6B7280',
  panel: '#FFFFFF',
  overworld: { background: '#DCFCE7', foreground: '#166534' },
  nether: { background: '#FEE2E2', foreground: '#991B1B' },
  linked: { background: '#F3E8FF', foreground: '#7E22CE' },
} as const;
const META_LABEL_STYLE = {
  color: COLORS.muted,
  fontSize: 29,
  fontWeight: 400,
} as const;

interface SocialPreviewFrameProps {
  fallbackVisual?: ReactNode;
  footerLeft: ReactNode;
  footerRight?: ReactNode;
  headerLeft: ReactNode;
  headerRight?: ReactNode;
  mainImage: string | null;
}

export function SocialPreviewFrame({
  fallbackVisual,
  footerLeft,
  footerRight,
  headerLeft,
  headerRight,
  mainImage,
}: SocialPreviewFrameProps) {
  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: COLORS.background,
      color: COLORS.foreground,
      fontFamily: 'Inter',
    }}>
      <div style={{
        height: SOCIAL_PREVIEW_HEADER_HEIGHT,
        padding: `24px ${SOCIAL_PREVIEW_HORIZONTAL_PADDING}px`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 36,
        backgroundColor: COLORS.background,
      }}>
        {headerLeft}
        {headerRight}
      </div>

      <div style={{
        height: SOCIAL_PREVIEW_IMAGE_HEIGHT,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        backgroundColor: COLORS.panel,
      }}>
        {mainImage ? (
          <img
            alt=""
            src={mainImage}
            width={SOCIAL_PREVIEW_WIDTH}
            height={SOCIAL_PREVIEW_IMAGE_HEIGHT}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : fallbackVisual}
      </div>

      <div style={{
        height: SOCIAL_PREVIEW_FOOTER_HEIGHT,
        padding: `28px ${SOCIAL_PREVIEW_HORIZONTAL_PADDING}px`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: SOCIAL_PREVIEW_FOOTER_GAP,
        backgroundColor: COLORS.background,
      }}>
        {footerLeft}
        {footerRight}
      </div>
    </div>
  );
}

interface HeaderIdentityProps {
  emphasized?: boolean;
  name: string;
  prefix?: ReactNode;
  side?: 'primary' | 'secondary';
  size: number;
  visual: ReactNode;
}

export function SocialPreviewHeaderIdentity({
  emphasized = false,
  name,
  prefix,
  side = 'primary',
  size,
  visual,
}: HeaderIdentityProps) {
  const secondary = side === 'secondary';
  return (
    <div style={{
      display: 'flex',
      ...(secondary ? { width: 360, flexShrink: 0 } : { flex: 1 }),
      minWidth: 0,
      alignItems: 'center',
      justifyContent: secondary ? 'flex-end' : 'flex-start',
      gap: secondary ? 16 : 18,
    }}>
      {visual}
      <div style={{
        display: 'flex',
        minWidth: 0,
        ...(secondary ? { maxWidth: 286 } : {}),
        overflow: 'hidden',
        whiteSpace: 'nowrap',
        textOverflow: 'ellipsis',
        fontSize: size,
        fontWeight: emphasized ? 700 : 600,
        letterSpacing: 0,
        ...(prefix ? { alignItems: 'center', gap: 10 } : {}),
      }}>
        {prefix}
        {prefix ? (
          <div style={{
            display: 'flex',
            minWidth: 0,
            overflow: 'hidden',
            whiteSpace: 'nowrap',
            textOverflow: 'ellipsis',
          }}>
            {name}
          </div>
        ) : name}
      </div>
    </div>
  );
}

type SocialSpace = Pick<
  SpaceReference,
  'color' | 'logoBackground' | 'logoZoom' | 'name'
>;

export function SocialPreviewSpaceLogo({
  logo,
  size = SOCIAL_PREVIEW_ICON_SIZE,
  source,
}: {
  logo: SocialSpace;
  size?: number;
  source: string | null;
}) {
  const imageSize = Math.round(
    size * SPACE_LOGO_IMAGE_SCALE * clampSpaceLogoZoom(logo.logoZoom),
  );
  return (
    <div style={{
      width: size,
      height: size,
      display: 'flex',
      flexShrink: 0,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      borderRadius: 999,
      backgroundColor: logo.logoBackground === 'transparent' && source
        ? 'transparent'
        : logo.color,
      color: getColorForeground(logo.color),
      fontSize: Math.round(size * 0.43),
      fontWeight: 700,
    }}>
      {source ? (
        <img
          alt=""
          src={source}
          width={imageSize}
          height={imageSize}
          style={{ objectFit: 'contain' }}
        />
      ) : getSpaceInitial(logo.name)}
    </div>
  );
}

export function SocialPreviewMember({
  additionalCount,
  compact = false,
  headSource,
  member,
}: {
  additionalCount: number;
  compact?: boolean;
  headSource: string | null;
  member: MinecraftOwner | null;
}) {
  if (!member) return null;
  const showName = !compact || !headSource;
  const showDetails = showName || additionalCount > 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      {headSource && (
        <img
          alt=""
          src={headSource}
          width={76}
          height={76}
          style={{ borderRadius: 8, objectFit: 'cover' }}
        />
      )}
      {showDetails && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {showName && (
            <span style={{ fontSize: 31, fontWeight: 600, lineHeight: 1 }}>
              {member.name}
            </span>
          )}
          {additionalCount > 0 && (
            <span style={{ ...META_LABEL_STYLE, lineHeight: 1 }}>
              + {additionalCount}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

interface SocialMetric { label: string; value: number | string }

export function SocialPreviewMetrics({
  metrics,
  trailingValue,
  valueFirst = false,
}: {
  metrics: SocialMetric[];
  trailingValue?: string | null;
  valueFirst?: boolean;
}) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      fontSize: 30,
      fontWeight: 400,
    }}>
      {metrics.map(({ label, value }, index) => (
        <Fragment key={label}>
          {index > 0 && (
            <span style={{ margin: '0 9px', ...META_LABEL_STYLE }}>·</span>
          )}
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {valueFirst ? (
              <Fragment>
                <span style={{ fontWeight: 600 }}>{value}</span>
                <span style={{ marginLeft: 7, ...META_LABEL_STYLE }}>
                  {label}
                </span>
              </Fragment>
            ) : (
              <Fragment>
                <span style={META_LABEL_STYLE}>{label}</span>
                <span style={{
                  marginLeft: 7,
                  fontWeight: 600,
                  fontVariantNumeric: 'tabular-nums',
                }}>
                  {value}
                </span>
              </Fragment>
            )}
          </div>
        </Fragment>
      ))}
      {trailingValue && (
        <Fragment>
          <span style={{ margin: '0 9px', ...META_LABEL_STYLE }}>·</span>
          <span style={{ fontWeight: 600 }}>{trailingValue}</span>
        </Fragment>
      )}
    </div>
  );
}

export function SocialPreviewWorldBadge({ world }: { world: string }) {
  const colors = world === 'nether'
    ? COLORS.nether
    : world === 'over+nether'
      ? COLORS.linked
      : COLORS.overworld;
  return (
    <div style={{
      display: 'flex',
      padding: '12px 20px',
      borderRadius: 999,
      backgroundColor: colors.background,
      color: colors.foreground,
      fontSize: 26,
      fontWeight: 700,
    }}>
      {world}
    </div>
  );
}
