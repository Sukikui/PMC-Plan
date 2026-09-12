import type React from 'react';
import type {
  MapMetadata,
  MapWorld,
  worldToMapPercent,
} from '@/lib/map/metadata';
import type { MapLineOverlay } from '@/lib/map/overlays';
import type { MapRoutePath } from '@/lib/map/route-path';
import type { SpaceReference } from '@/lib/spaces/types';
import type { MapPreviewArea } from './map-view';

type InteractiveMapPointKind = 'place' | 'portal-overworld' | 'portal-nether' | 'route';

export interface InteractiveMapRendererProps {
  previewArea?: MapPreviewArea;
  previewImagePortalRoot?: HTMLElement | null;
  activeRouteSegmentId?: string | null;
  enableGridContentCreation?: boolean;
  error?: string | null;
  focusedPointId?: string;
  lineOverlays?: MapLineOverlay[];
  linkedMinecraftUuid?: string | null;
  loading?: boolean;
  metadata: MapMetadata;
  onMapClick?: () => void;
  onPointSelect?: (point: InteractiveMapPoint) => void;
  points: InteractiveMapPoint[];
  routePath?: MapRoutePath | null;
  syncedPlayerUuid?: string | null;
  variant?: 'panel' | 'background';
  world?: MapWorld;
}

export interface InteractiveMapPoint {
  id: string;
  x: number;
  z: number;
  kind: InteractiveMapPointKind;
  label?: string;
  iconSrc?: string;
  markerColor?: string;
  previewImageSrc?: string;
  spaceLogo?: SpaceReference;
  unidentified?: boolean;
}

export type MapTooltip = {
  pointId: string;
  pointLeft: number;
  pointTop: number;
  offset: number;
  label: string;
  markerColor?: string;
  previewImageSrc?: string;
  previewImageAspectRatio?: number;
  spaceLogo?: SpaceReference;
  unidentified?: boolean;
  expanded: boolean;
  automatic?: boolean;
  automaticPriority?: boolean;
};

export type ScreenMapPoint = InteractiveMapPoint & {
  screen: {
    left: number;
    top: number;
  };
};

type MapPercentPosition = ReturnType<typeof worldToMapPercent>;

export type PositionedMapPoint = InteractiveMapPoint & {
  position: MapPercentPosition;
};

export type TooltipFixedStyle = Pick<React.CSSProperties, 'left' | 'top' | 'transform' | 'visibility'>;

export type PointRenderMode = 'points' | 'icons' | 'icons-to-points';
