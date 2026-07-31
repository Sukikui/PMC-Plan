'use client';

import { useState } from 'react';
import type React from 'react';
import { themeColors } from '@/lib/theme-colors';
import {
  MAP_ICON_BASE_SIZE_PX,
  MAP_ICON_HITBOX_BASE_SIZE_PX,
  MAP_ICON_REVEAL_DURATION_MS,
  MAP_ICON_TO_POINT_DURATION_MS,
  MAP_POINT_BASE_Z_INDEX,
  MAP_POINT_HOVER_Z_INDEX,
  getScaledMapIconSizePx,
  getStableRevealDelay,
} from '../core/map-constants';
import { isMapTooltipPreviewElement } from '../tooltip/map-tooltip';
import type { InteractiveMapPoint, PointRenderMode, ScreenMapPoint } from '../core/map-types';

interface MapPointsLayerProps {
  points: ScreenMapPoint[];
  pointRenderMode: PointRenderMode;
  iconScale: number;
  animatePointTransitions: boolean;
  focusedPointId?: string;
  routePointIds?: ReadonlySet<string>;
  raisedPointId: string | null;
  setRaisedPointId: (pointId: string | null) => void;
  hoveredPointRef: React.MutableRefObject<{ id: string; startedAt: number } | null>;
  preloadPreviewImage: (src: string | undefined, pointId: string) => void;
  showPointTooltip: (point: ScreenMapPoint, expanded: boolean) => void;
  updatePointTooltipPosition: (point: ScreenMapPoint) => void;
  schedulePlacePreview: (point: ScreenMapPoint) => void;
  hidePointTooltip: () => void;
  onPointSelect?: (point: InteractiveMapPoint) => void;
}

export default function MapPointsLayer({
  points,
  pointRenderMode,
  iconScale,
  animatePointTransitions,
  focusedPointId,
  routePointIds,
  raisedPointId,
  setRaisedPointId,
  hoveredPointRef,
  preloadPreviewImage,
  showPointTooltip,
  updatePointTooltipPosition,
  schedulePlacePreview,
  hidePointTooltip,
  onPointSelect,
}: MapPointsLayerProps) {
  return (
    <>
      {points.map((point) => {
        const pointShape = isPortalPoint(point) ? 'diamond' : 'circle';
        const isSelectedPoint = focusedPointId === point.id;
        const isRoutePoint = routePointIds?.has(point.id) ?? false;
        const iconSrc = point.iconSrc && (isSelectedPoint || isRoutePoint || pointRenderMode !== 'points')
          ? point.iconSrc
          : undefined;
        const isIconReveal = (isSelectedPoint || isRoutePoint || pointRenderMode === 'icons') && !!iconSrc;
        const isIconExit = !isSelectedPoint && !isRoutePoint &&
          pointRenderMode === 'icons-to-points' && !!iconSrc;
        const isPointRaised = raisedPointId === point.id || isSelectedPoint;
        const isDimmedRouteIcon = pointRenderMode === 'icons' &&
          !!routePointIds &&
          !routePointIds.has(point.id);
        const revealDelay = getStableRevealDelay(point.id);
        const pointZIndex = isPointRaised
          ? MAP_POINT_HOVER_Z_INDEX
          : MAP_POINT_BASE_Z_INDEX + Math.round(point.screen.top);

        return (
          <button
            key={point.id}
            type="button"
            className={`group absolute flex cursor-pointer items-center justify-center border-0 bg-transparent p-0 outline-none transition-opacity duration-300 ${iconSrc ? '' : 'h-3 w-3'} ${isDimmedRouteIcon ? 'opacity-40 hover:opacity-60 focus-visible:opacity-60' : 'opacity-100'}`}
            style={{
              left: `${point.screen.left}px`,
              top: `${point.screen.top}px`,
              ...(iconSrc ? getIconBoxStyle(MAP_ICON_HITBOX_BASE_SIZE_PX, iconScale) : {}),
              zIndex: pointZIndex,
              transform: 'translate3d(-50%, -50%, 0)',
              willChange: 'left, top',
            }}
            aria-label={point.label}
            aria-current={isSelectedPoint ? 'location' : undefined}
            data-map-point-id={point.id}
            onClick={(event) => {
              if (event.detail === 0) onPointSelect?.(point);
            }}
            onMouseEnter={() => {
              setRaisedPointId(point.id);
              if (point.label) {
                hoveredPointRef.current = { id: point.id, startedAt: Date.now() };
                preloadPreviewImage(point.previewImageSrc, point.id);
                showPointTooltip(point, false);
                schedulePlacePreview(point);
              }
            }}
            onMouseMove={() => {
              if (point.label) {
                updatePointTooltipPosition(point);
              }
            }}
            onMouseLeave={(event) => {
              if (!isMapTooltipPreviewElement(event.relatedTarget)) {
                hidePointTooltip();
              }
            }}
            onFocus={() => {
              setRaisedPointId(point.id);
              if (point.label) {
                showPointTooltip(point, false);
              }
            }}
            onBlur={() => {
              hidePointTooltip();
            }}
          >
            {isIconReveal ? (
              <IconPoint
                iconSrc={iconSrc}
                iconScale={iconScale}
                isFocused={isSelectedPoint}
                isRaised={isPointRaised}
                revealDelay={revealDelay}
                animateReveal={animatePointTransitions}
              />
            ) : isIconExit ? (
              <IconToPoint
                iconSrc={iconSrc}
                iconScale={iconScale}
                markerColor={point.markerColor}
                pointShape={pointShape}
                revealDelay={revealDelay}
                animateExit={animatePointTransitions}
              />
            ) : (
              <DotPoint
                markerColor={point.markerColor}
                pointShape={pointShape}
                isRaised={isPointRaised}
              />
            )}
          </button>
        );
      })}
    </>
  );
}

function IconPoint({
  iconSrc,
  iconScale,
  isFocused,
  isRaised,
  revealDelay,
  animateReveal,
}: {
  iconSrc: string;
  iconScale: number;
  isFocused: boolean;
  isRaised: boolean;
  revealDelay: number;
  animateReveal: boolean;
}) {
  const [shouldAnimate] = useState(animateReveal);

  return (
    <span
      aria-hidden="true"
      className={`${shouldAnimate ? 'map-icon-reveal' : ''} block`}
      style={{
        ...getIconBoxStyle(MAP_ICON_BASE_SIZE_PX, iconScale),
        '--map-reveal-delay': `${revealDelay}ms`,
        '--map-icon-reveal-duration': `${MAP_ICON_REVEAL_DURATION_MS}ms`,
      } as React.CSSProperties}
    >
      <span
        className={`block h-full w-full bg-contain bg-center bg-no-repeat transition-transform duration-150 ease-out ${isFocused || isRaised ? 'scale-125' : 'group-hover:scale-125 group-focus-visible:scale-125'}`}
        style={{ backgroundImage: `url(${iconSrc})` }}
      />
    </span>
  );
}

function IconToPoint({
  iconSrc,
  iconScale,
  markerColor,
  pointShape,
  revealDelay,
  animateExit,
}: {
  iconSrc: string;
  iconScale: number;
  markerColor?: string;
  pointShape: MapPointShape;
  revealDelay: number;
  animateExit: boolean;
}) {
  const [shouldAnimate] = useState(animateExit);

  return (
    <span
      aria-hidden="true"
      className="relative block"
      style={{
        ...getIconBoxStyle(MAP_ICON_BASE_SIZE_PX, iconScale),
        '--map-reveal-delay': `${revealDelay}ms`,
        '--map-icon-to-point-duration': `${MAP_ICON_TO_POINT_DURATION_MS}ms`,
      } as React.CSSProperties}
    >
      <PointMarker color={markerColor} shape={pointShape} />
      <span
        className={`${shouldAnimate ? 'map-icon-to-point' : 'opacity-0'} absolute inset-0 block bg-contain bg-center bg-no-repeat`}
        style={{ backgroundImage: `url(${iconSrc})` }}
      />
    </span>
  );
}

const getIconBoxStyle = (baseSizePx: number, iconScale: number) => {
  const sizePx = getScaledMapIconSizePx(baseSizePx, iconScale);
  return { width: `${sizePx}px`, height: `${sizePx}px` };
};

function DotPoint({
  markerColor,
  pointShape,
  isRaised,
}: {
  markerColor?: string;
  pointShape: MapPointShape;
  isRaised: boolean;
}) {
  return (
    <span className="relative block h-4 w-4">
      <PointMarker color={markerColor} shape={pointShape} isRaised={isRaised} />
    </span>
  );
}

type MapPointShape = 'circle' | 'diamond';

function PointMarker({
  color,
  shape,
  isRaised,
}: {
  color?: string;
  shape: MapPointShape;
  isRaised?: boolean;
}) {
  const shapeClass = shape === 'diamond' ? 'rotate-45 rounded-[1px]' : themeColors.util.roundedFull;
  const raisedClass = isRaised === undefined
    ? ''
    : isRaised
      ? 'scale-150'
      : 'group-hover:scale-150 group-focus-visible:scale-150';

  return (
    <span
      className={`absolute left-1/2 top-1/2 block h-2 w-2 -translate-x-1/2 -translate-y-1/2 border ${themeColors.map.pointBorder} ${themeColors.map.point} ${shapeClass} transition-transform duration-150 ease-out ${raisedClass}`}
      style={color ? { backgroundColor: color } : undefined}
    />
  );
}

const isPortalPoint = (point: InteractiveMapPoint) => (
  point.kind === 'portal-overworld' || point.kind === 'portal-nether'
);
