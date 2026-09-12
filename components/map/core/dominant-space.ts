import type { SpaceReference } from '@/lib/spaces/types';
import type { ScreenMapPoint } from './map-types';
import type { MapViewport } from './map-view';

const CENTRAL_REGION_WIDTH_RATIO = 0.5;
const CENTRAL_REGION_HEIGHT_RATIO = 0.4;
const MINIMUM_SPACE_POINTS = 2;

export function findDominantMapSpace(
  points: ScreenMapPoint[],
  viewport: MapViewport,
): SpaceReference | null {
  if (viewport.width <= 0 || viewport.height <= 0) return null;

  // The centered 50% by 40% rectangle covers 20% of the viewport area.
  const horizontalMargin = viewport.width * (1 - CENTRAL_REGION_WIDTH_RATIO) / 2;
  const verticalMargin = viewport.height * (1 - CENTRAL_REGION_HEIGHT_RATIO) / 2;
  const right = viewport.width - horizontalMargin;
  const bottom = viewport.height - verticalMargin;
  const counts = new Map<string, { count: number; space: SpaceReference }>();

  for (const point of points) {
    const space = point.spaceLogo;
    if (
      !space
      || point.kind === 'route'
      || point.screen.left < horizontalMargin
      || point.screen.left > right
      || point.screen.top < verticalMargin
      || point.screen.top > bottom
    ) continue;

    const current = counts.get(space.id);
    counts.set(space.id, {
      count: (current?.count ?? 0) + 1,
      space,
    });
  }

  let dominant: { count: number; space: SpaceReference } | null = null;
  let tied = false;
  for (const candidate of counts.values()) {
    if (!dominant || candidate.count > dominant.count) {
      dominant = candidate;
      tied = false;
    } else if (candidate.count === dominant.count) {
      tied = true;
    }
  }

  return dominant && dominant.count >= MINIMUM_SPACE_POINTS && !tied
    ? dominant.space
    : null;
}
