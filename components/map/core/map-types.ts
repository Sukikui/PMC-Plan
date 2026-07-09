import type React from 'react';
import type { worldToMapPercent } from '@/lib/map/metadata';

export type InteractiveMapPointKind = 'place' | 'portal-overworld' | 'portal-nether';

export interface InteractiveMapPoint {
  id: string;
  x: number;
  z: number;
  kind: InteractiveMapPointKind;
  label?: string;
  iconSrc?: string;
  previewImageSrc?: string;
}

export type MapTooltip = {
  pointId: string;
  pointLeft: number;
  pointTop: number;
  offset: number;
  label: string;
  previewImageSrc?: string;
  previewImageAspectRatio?: number;
  expanded: boolean;
};

export type ScreenMapPoint = InteractiveMapPoint & {
  screen: {
    left: number;
    top: number;
  };
};

export type MapPercentPosition = ReturnType<typeof worldToMapPercent>;

export type PositionedMapPoint = InteractiveMapPoint & {
  position: MapPercentPosition;
};

export type TooltipFixedStyle = Pick<React.CSSProperties, 'left' | 'top' | 'transform' | 'visibility'>;

export type PointRenderMode = 'points' | 'icons' | 'icons-to-points';
