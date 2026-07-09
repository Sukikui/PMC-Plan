'use client';

import { useState } from 'react';
import type React from 'react';
import { themeColors } from '@/lib/theme-colors';
import {
  MAP_ICON_REVEAL_DURATION_MS,
  MAP_ICON_TO_POINT_DURATION_MS,
  MAP_POINT_BASE_Z_INDEX,
  MAP_POINT_HOVER_Z_INDEX,
  getStableRevealDelay,
} from '../core/map-constants';
import { isMapTooltipPreviewElement } from '../tooltip/map-tooltip';
import type { InteractiveMapPoint, PointRenderMode, ScreenMapPoint } from '../core/map-types';

const ICON_BASE_SIZE_REM = 2.33;
const ICON_HITBOX_BASE_SIZE_REM = 2.67;

interface MapPointsLayerProps {
  points: ScreenMapPoint[];
  pointRenderMode: PointRenderMode;
  iconScale: number;
  animatePointTransitions: boolean;
  focusedPointId?: string;
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
        const pointClass = point.kind === 'place'
          ? themeColors.map.pointPlace
          : themeColors.map.pointNether;
        const isSelectedPoint = focusedPointId === point.id;
        const iconSrc = point.iconSrc && (isSelectedPoint || pointRenderMode !== 'points')
          ? point.iconSrc
          : undefined;
        const isIconReveal = (isSelectedPoint || pointRenderMode === 'icons') && !!iconSrc;
        const isIconExit = !isSelectedPoint && pointRenderMode === 'icons-to-points' && !!iconSrc;
        const isPointRaised = raisedPointId === point.id || isSelectedPoint;
        const revealDelay = getStableRevealDelay(point.id);
        const pointZIndex = isPointRaised
          ? MAP_POINT_HOVER_Z_INDEX
          : MAP_POINT_BASE_Z_INDEX + Math.round(point.screen.top);

        return (
          <div
            key={point.id}
            className={`group absolute flex cursor-pointer items-center justify-center outline-none ${iconSrc ? '' : 'h-3 w-3'}`}
            style={{
              left: `${point.screen.left}px`,
              top: `${point.screen.top}px`,
              ...(iconSrc ? getIconBoxStyle(ICON_HITBOX_BASE_SIZE_REM, iconScale) : {}),
              zIndex: pointZIndex,
              transform: 'translate3d(-50%, -50%, 0)',
              willChange: 'left, top',
            }}
            aria-label={point.label}
            aria-current={isSelectedPoint ? 'location' : undefined}
            role="button"
            tabIndex={0}
            data-map-point-id={point.id}
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
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                onPointSelect?.(point);
              }
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
                pointClass={pointClass}
                revealDelay={revealDelay}
                animateExit={animatePointTransitions}
              />
            ) : (
              <DotPoint
                pointClass={pointClass}
                isRaised={isPointRaised}
              />
            )}
          </div>
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
        ...getIconBoxStyle(ICON_BASE_SIZE_REM, iconScale),
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
  pointClass,
  revealDelay,
  animateExit,
}: {
  iconSrc: string;
  iconScale: number;
  pointClass: string;
  revealDelay: number;
  animateExit: boolean;
}) {
  const [shouldAnimate] = useState(animateExit);

  return (
    <span
      aria-hidden="true"
      className="relative block"
      style={{
        ...getIconBoxStyle(ICON_BASE_SIZE_REM, iconScale),
        '--map-reveal-delay': `${revealDelay}ms`,
        '--map-icon-to-point-duration': `${MAP_ICON_TO_POINT_DURATION_MS}ms`,
      } as React.CSSProperties}
    >
      <span className={`absolute left-1/2 top-1/2 block h-2 w-2 -translate-x-1/2 -translate-y-1/2 border border-white ${pointClass} ${themeColors.util.roundedFull}`} />
      <span
        className={`${shouldAnimate ? 'map-icon-to-point' : 'opacity-0'} absolute inset-0 block bg-contain bg-center bg-no-repeat`}
        style={{ backgroundImage: `url(${iconSrc})` }}
      />
    </span>
  );
}

const getIconBoxStyle = (baseSizeRem: number, iconScale: number) => {
  const sizePx = Math.round(baseSizeRem * 16 * iconScale);
  return { width: `${sizePx}px`, height: `${sizePx}px` };
};

function DotPoint({
  pointClass,
  isRaised,
}: {
  pointClass: string;
  isRaised: boolean;
}) {
  return (
    <span className="relative block h-4 w-4">
      <span className={`absolute left-1/2 top-1/2 block h-2 w-2 -translate-x-1/2 -translate-y-1/2 border border-white ${pointClass} ${themeColors.util.roundedFull} transition-transform duration-150 ease-out ${isRaised ? 'scale-150' : 'group-hover:scale-150 group-focus-visible:scale-150'}`} />
    </span>
  );
}
