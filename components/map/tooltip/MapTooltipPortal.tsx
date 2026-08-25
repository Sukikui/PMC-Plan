'use client';

import React, { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import SpaceLogo from '@/components/spaces/SpaceLogo';
import { getColorForeground, getColorWithAlpha } from '@/lib/content/colors';
import { themeColors } from '@/lib/theme-colors';
import { CONTENT_PREVIEW_ANIMATION_DURATION_MS } from '../core/map-constants';
import {
  MAP_TOOLTIP_IMAGE_MAX_HEIGHT_REM,
  MAP_TOOLTIP_IMAGE_MAX_WIDTH_REM,
  MAP_TOOLTIP_LABEL_MAX_WIDTH_REM,
  getMapTooltipPreviewImageHeightRem,
  measureMapTooltipLabelWidth,
} from './map-tooltip';
import { getMapTooltipLayout, getVisiblePanelRects, getVisibleTooltipLabelRects } from './map-tooltip-layout';
import type { MapTooltip, TooltipFixedStyle } from '../core/map-types';
import PortalIdentityLabel from '@/components/portal/PortalIdentityLabel';

interface MapTooltipPortalProps {
  tooltips: MapTooltip[];
  tooltipPortalRoot: HTMLElement | null;
  viewportRef: React.RefObject<HTMLDivElement | null>;
  onPreviewMouseLeave: (pointId: string) => void;
}

export default function MapTooltipPortal({
  tooltips,
  tooltipPortalRoot,
  viewportRef,
  onPreviewMouseLeave,
}: MapTooltipPortalProps) {
  if (!tooltipPortalRoot || tooltips.length === 0) {
    return null;
  }

  return createPortal(
    <>
      {tooltips.map((tooltip, index) => (
        <MapTooltipItem
          key={`${tooltip.pointId}-${index}`}
          tooltip={tooltip}
          viewportRef={viewportRef}
          onPreviewMouseLeave={onPreviewMouseLeave}
        />
      ))}
    </>,
    tooltipPortalRoot
  );
}

function MapTooltipItem({
  tooltip,
  viewportRef,
  onPreviewMouseLeave,
}: {
  tooltip: MapTooltip;
  viewportRef: React.RefObject<HTMLDivElement | null>;
  onPreviewMouseLeave: (pointId: string) => void;
}) {
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const [tooltipFixedStyle, setTooltipFixedStyle] = useState<TooltipFixedStyle | null>(null);
  const [tooltipImageFixedStyle, setTooltipImageFixedStyle] = useState<TooltipFixedStyle | null>(null);
  const tooltipPreviewImageHeightRem = getMapTooltipPreviewImageHeightRem(tooltip.previewImageAspectRatio);
  const tooltipLabel = tooltip.label;
  const tooltipLabelStyle = useMemo<React.CSSProperties | undefined>(() => {
    const measuredWidth = measureMapTooltipLabelWidth(tooltipLabel);
    return {
      maxWidth: `${MAP_TOOLTIP_LABEL_MAX_WIDTH_REM}rem`,
      ...(measuredWidth ? { width: `${measuredWidth}px` } : {}),
      ...(tooltip.markerColor ? {
        backgroundColor: getColorWithAlpha(tooltip.markerColor, 0.75),
        color: getColorForeground(tooltip.markerColor),
      } : {}),
    };
  }, [tooltip.markerColor, tooltipLabel]);

  useLayoutEffect(() => {
    const tooltipNode = tooltipRef.current;
    const viewportNode = viewportRef.current;

    if (!tooltipNode || !viewportNode) {
      setTooltipFixedStyle(null);
      setTooltipImageFixedStyle(null);
      return;
    }

    const mapRect = viewportNode.getBoundingClientRect();
    const tooltipRect = tooltipNode.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const anchorLeft = mapRect.left + tooltip.pointLeft;
    const pointTop = mapRect.top + tooltip.pointTop;
    const rootFontSize = Number.parseFloat(window.getComputedStyle(document.documentElement).fontSize);
    const remSize = Number.isFinite(rootFontSize) ? rootFontSize : 16;
    const hasPreviewImage = Boolean(tooltip.previewImageSrc);
    const shouldShowImage = tooltip.expanded && hasPreviewImage;
    const layout = getMapTooltipLayout({
      anchorLeft,
      pointTop,
      offset: tooltip.offset,
      labelWidth: tooltipRect.width,
      labelHeight: tooltipRect.height,
      viewportWidth,
      viewportHeight,
      imageWidth: hasPreviewImage ? MAP_TOOLTIP_IMAGE_MAX_WIDTH_REM * remSize : undefined,
      imageHeight: hasPreviewImage ? (tooltipPreviewImageHeightRem ?? MAP_TOOLTIP_IMAGE_MAX_WIDTH_REM) * remSize : undefined,
      panelRects: hasPreviewImage ? getVisiblePanelRects() : [],
      avoidLabelRects: getVisibleTooltipLabelRects(tooltip.pointId),
    });

    setTooltipFixedStyle(layout.labelStyle);
    setTooltipImageFixedStyle(shouldShowImage ? layout.imageStyle : null);
  }, [tooltip, tooltipLabelStyle, tooltipPreviewImageHeightRem, viewportRef]);

  return (
    <>
      {tooltip.expanded && tooltip.previewImageSrc && (
        <div
          className="pointer-events-auto fixed z-[60]"
          data-map-tooltip-preview-root
          onPointerDown={(event) => event.stopPropagation()}
          onPointerMove={(event) => event.stopPropagation()}
          onMouseLeave={() => onPreviewMouseLeave(tooltip.pointId)}
          style={tooltipImageFixedStyle ?? { left: 0, top: 0, transform: 'translate3d(-50%, 0, 0)', visibility: 'hidden' }}
        >
          <div
            className={`map-tooltip-preview-card-enter ${themeColors.util.rounded2Xl} ${themeColors.map.tooltipPreviewImageShadow}`}
            data-map-tooltip-preview-image
            style={{
              width: `${MAP_TOOLTIP_IMAGE_MAX_WIDTH_REM}rem`,
              height: tooltipPreviewImageHeightRem ? `${tooltipPreviewImageHeightRem}rem` : undefined,
              maxHeight: `${MAP_TOOLTIP_IMAGE_MAX_HEIGHT_REM}rem`,
              '--map-tooltip-preview-duration': `${CONTENT_PREVIEW_ANIMATION_DURATION_MS}ms`,
            } as React.CSSProperties}
          >
            <div className={`h-full overflow-hidden ${themeColors.util.rounded2Xl} ${themeColors.map.tooltipPreviewImageFrame}`}>
              <img
                src={tooltip.previewImageSrc}
                alt=""
                className="block h-full w-full object-contain"
                style={{ maxHeight: `${MAP_TOOLTIP_IMAGE_MAX_HEIGHT_REM}rem` }}
                draggable={false}
                onError={(event) => {
                  const preview = event.currentTarget.closest<HTMLElement>('[data-map-tooltip-preview-image]');
                  if (preview) {
                    preview.style.display = 'none';
                  }
                }}
              />
            </div>
          </div>
        </div>
      )}
      <div
        ref={tooltipRef}
        className="pointer-events-none fixed z-30"
        data-map-tooltip-label-root
        data-map-tooltip-point-id={tooltip.pointId}
        style={tooltipFixedStyle ?? { left: 0, top: 0, transform: 'translate3d(-50%, -100%, 0)', visibility: 'hidden' }}
      >
        <div className="flex items-center gap-1.5">
          {tooltip.spaceLogo && (
            <SpaceLogo
              color={tooltip.spaceLogo.color}
              logoBackground={tooltip.spaceLogo.logoBackground}
              logoUrl={tooltip.spaceLogo.logoSrc}
              logoZoom={tooltip.spaceLogo.logoZoom}
              name={tooltip.spaceLogo.name}
              size="tooltip"
            />
          )}
          <div
            className={`break-words px-2.5 py-1 text-center text-xs font-medium leading-snug ${tooltip.unidentified ? 'flex items-center justify-center' : ''} ${themeColors.util.roundedXl} ${themeColors.map.tooltip}`}
            style={tooltipLabelStyle}
          >
            {tooltip.unidentified
              ? <PortalIdentityLabel iconClassName="h-[1em] w-[1em] scale-[1.17]" />
              : tooltip.label}
          </div>
        </div>
      </div>
    </>
  );
}
