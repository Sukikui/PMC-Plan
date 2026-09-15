import type { SpaceReference } from '@/lib/spaces/types';
import type { ScreenMapPoint } from './map-types';
import type { MapCameraChange, MapPan, MapSize, MapViewport } from './map-view';

const CENTRAL_REGION_WIDTH_RATIO = 0.5;
const CENTRAL_REGION_HEIGHT_RATIO = 0.3;
const MINIMUM_SPACE_POINTS = 2;
const MEMORY_ANCHOR_PADDING = 1.2;
const ZOOM_RETENTION_EPSILON = 0.001;
type DominantSpaceRegion = 'central' | 'viewport';

interface DominantSpaceCandidate {
  count: number;
  space: SpaceReference;
}

export interface DominantMapSpaceView {
  centerLeft: number;
  centerTop: number;
  horizontalRadius: number;
  verticalRadius: number;
  zoom: number;
}

export interface DominantMapSpaceState {
  acquisitionZoom: number;
  anchor: DominantMapSpaceView;
  space: SpaceReference;
  status: 'active' | 'dormant';
}

export function getDominantMapSpaceView(
  viewport: MapViewport,
  baseSize: MapSize,
  pan: MapPan,
  zoom: number,
): DominantMapSpaceView | null {
  const scaledWidth = baseSize.width * zoom;
  const scaledHeight = baseSize.height * zoom;
  if (viewport.width <= 0 || viewport.height <= 0 || scaledWidth <= 0 || scaledHeight <= 0) {
    return null;
  }

  return {
    centerLeft: (0.5 - pan.x / scaledWidth) * 100,
    centerTop: (0.5 - pan.y / scaledHeight) * 100,
    horizontalRadius: viewport.width / scaledWidth * 50,
    verticalRadius: viewport.height / scaledHeight * 50,
    zoom,
  };
}

export function resolveDominantMapSpace(
  points: ScreenMapPoint[],
  viewport: MapViewport,
  state: DominantMapSpaceState | null,
  view: DominantMapSpaceView,
  cameraChange: MapCameraChange,
  region: DominantSpaceRegion = 'central',
): DominantMapSpaceState | null {
  if (viewport.width <= 0 || viewport.height <= 0) return null;

  const { candidates, visibleSpaces } = analyzeVisibleSpaces(points, viewport, region);
  const leaders = findQualifiedLeaders(candidates);
  if (leaders.length === 1) {
    return activateSpace(leaders[0].space, view, region);
  }
  if (leaders.length > 1) {
    const currentLeader = leaders.find(({ space }) => space.id === state?.space.id);
    return currentLeader
      ? activateSpace(currentLeader.space, view, region)
      : null;
  }

  return retainDominantSpace(state, visibleSpaces, view, cameraChange);
}

export function getDisplayedDominantMapSpace(state: DominantMapSpaceState | null) {
  return state?.status === 'active' ? state.space : null;
}

function analyzeVisibleSpaces(
  points: ScreenMapPoint[],
  viewport: MapViewport,
  region: DominantSpaceRegion,
) {
  const candidates = new Map<string, DominantSpaceCandidate>();
  const visibleSpaces = new Map<string, SpaceReference>();
  const horizontalMargin = region === 'viewport'
    ? 0
    : viewport.width * (1 - CENTRAL_REGION_WIDTH_RATIO) / 2;
  const verticalMargin = region === 'viewport'
    ? 0
    : viewport.height * (1 - CENTRAL_REGION_HEIGHT_RATIO) / 2;
  const right = viewport.width - horizontalMargin;
  const bottom = viewport.height - verticalMargin;

  for (const point of points) {
    const space = point.spaceLogo;
    if (!space || point.kind === 'route' || !isPointInsideViewport(point, viewport)) continue;

    visibleSpaces.set(space.id, space);
    if (
      point.screen.left < horizontalMargin
      || point.screen.left > right
      || point.screen.top < verticalMargin
      || point.screen.top > bottom
    ) continue;

    const current = candidates.get(space.id);
    candidates.set(space.id, {
      count: (current?.count ?? 0) + 1,
      space,
    });
  }

  return { candidates, visibleSpaces };
}

function findQualifiedLeaders(candidates: Map<string, DominantSpaceCandidate>) {
  let highestCount = 0;
  let leaders: DominantSpaceCandidate[] = [];
  for (const candidate of candidates.values()) {
    if (candidate.count > highestCount) {
      highestCount = candidate.count;
      leaders = [candidate];
    } else if (candidate.count === highestCount) {
      leaders.push(candidate);
    }
  }

  return highestCount >= MINIMUM_SPACE_POINTS ? leaders : [];
}

function retainDominantSpace(
  state: DominantMapSpaceState | null,
  visibleSpaces: Map<string, SpaceReference>,
  view: DominantMapSpaceView,
  cameraChange: MapCameraChange,
) {
  if (cameraChange !== 'zoom' || !state || !canRetainAtView(state, view)) return null;

  const visibleSpace = visibleSpaces.get(state.space.id);
  return visibleSpace
    ? { ...state, space: visibleSpace, status: 'active' as const }
    : { ...state, status: 'dormant' as const };
}

function activateSpace(
  space: SpaceReference,
  view: DominantMapSpaceView,
  region: DominantSpaceRegion,
): DominantMapSpaceState {
  const horizontalRatio = region === 'viewport' ? 1 : CENTRAL_REGION_WIDTH_RATIO;
  const verticalRatio = region === 'viewport' ? 1 : CENTRAL_REGION_HEIGHT_RATIO;
  return {
    acquisitionZoom: view.zoom,
    space,
    status: 'active',
    anchor: {
      centerLeft: view.centerLeft,
      centerTop: view.centerTop,
      horizontalRadius: view.horizontalRadius * horizontalRatio * MEMORY_ANCHOR_PADDING,
      verticalRadius: view.verticalRadius * verticalRatio * MEMORY_ANCHOR_PADDING,
      zoom: view.zoom,
    },
  };
}

function canRetainAtView(
  state: DominantMapSpaceState,
  view: DominantMapSpaceView,
) {
  const zoomedBeyondAcquisition = view.zoom
    > state.acquisitionZoom * (1 + ZOOM_RETENTION_EPSILON);
  return zoomedBeyondAcquisition && isViewInsideAnchor(view, state.anchor);
}

function isViewInsideAnchor(view: DominantMapSpaceView, anchor: DominantMapSpaceView) {
  return Math.abs(view.centerLeft - anchor.centerLeft) <= anchor.horizontalRadius
    && Math.abs(view.centerTop - anchor.centerTop) <= anchor.verticalRadius;
}

function isPointInsideViewport(point: ScreenMapPoint, viewport: MapViewport) {
  return point.screen.left >= 0
    && point.screen.left <= viewport.width
    && point.screen.top >= 0
    && point.screen.top <= viewport.height;
}
