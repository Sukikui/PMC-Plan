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
  hideDominantSpaceLogos,
  measureMapTooltipLabelWidth,
} from './map-tooltip';
import { getMapTooltipLayout, getVisiblePanelRects, getVisibleTooltipLabelRects, type MapTooltipRect } from './map-tooltip-layout';
import type { MapTooltip, TooltipFixedStyle } from '../core/map-types';
import PortalIdentityLabel from '@/components/portal/PortalIdentityLabel';
import { usePermanentLabelLayout } from '../hooks/usePermanentLabelLayout';
import { MAP_TOOLTIP_LABEL_Z_INDEX } from '../core/map-constants';
import type { MapViewport } from '../core/map-view';

interface MapTooltipPortalProps {
  compact?: boolean;
  dominantSpaceId?: string;
  tooltips: MapTooltip[];
  viewportRef: React.RefObject<HTMLDivElement | null>;
  viewport: MapViewport;
  onPreviewMouseLeave: (pointId: string) => void;
  zoom: number;
  iconScale: number;
  pointSizePx: number;
  previewImagePortalRoot?: HTMLElement | null;
}

export default function MapTooltipPortal({
  compact = false,
  dominantSpaceId,
  tooltips,
  viewportRef,
  viewport,
  onPreviewMouseLeave,
  zoom,
  iconScale,
  pointSizePx,
  previewImagePortalRoot,
}: MapTooltipPortalProps) {
  const displayedTooltips = useMemo(
    () => hideDominantSpaceLogos(tooltips, dominantSpaceId),
    [dominantSpaceId, tooltips],
  );
  const permanent = usePermanentLabelLayout(
    displayedTooltips,
    viewportRef,
    viewport,
    zoom,
    iconScale,
    pointSizePx,
    compact,
  );
  const renderedTooltips = compact
    ? displayedTooltips.filter((tooltip) => (
      !tooltip.automatic
      || tooltip.automaticPriority
      || permanent.styles.has(tooltip.pointId)
    ))
    : displayedTooltips;
  if (renderedTooltips.length === 0) {
    return null;
  }

  return (
    <div
      ref={permanent.containerRef}
      className="pointer-events-none absolute inset-0"
      style={{ zIndex: MAP_TOOLTIP_LABEL_Z_INDEX }}
    >
      {renderedTooltips.map((tooltip) => (
        <MapTooltipItem
          key={tooltip.pointId}
          tooltip={tooltip}
          permanentStyle={tooltip.automatic ? permanent.styles.get(tooltip.pointId) : undefined}
          hideWithoutPermanentStyle={Boolean(tooltip.automatic && !tooltip.automaticPriority)}
          viewportRef={viewportRef}
          previewImagePortalRoot={previewImagePortalRoot}
          onPreviewMouseLeave={onPreviewMouseLeave}
        />
      ))}
    </div>
  );
}

function MapTooltipItem({
  tooltip,
  viewportRef,
  onPreviewMouseLeave,
  permanentStyle,
  hideWithoutPermanentStyle,
  previewImagePortalRoot,
}: {
  tooltip: MapTooltip;
  viewportRef: React.RefObject<HTMLDivElement | null>;
  onPreviewMouseLeave: (pointId: string) => void;
  permanentStyle?: React.CSSProperties;
  hideWithoutPermanentStyle: boolean;
  previewImagePortalRoot?: HTMLElement | null;
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
    if (tooltip.automatic && !tooltip.expanded && (permanentStyle || hideWithoutPermanentStyle)) return;
    const tooltipNode = tooltipRef.current;
    const viewportNode = viewportRef.current;

    if (!tooltipNode || !viewportNode) {
      setTooltipFixedStyle(null);
      setTooltipImageFixedStyle(null);
      return;
    }

    const mapRect = viewportNode.getBoundingClientRect();
    const tooltipRect = tooltipNode.getBoundingClientRect();
    const imagePortalRect = previewImagePortalRoot?.getBoundingClientRect();
    const hasExternalImageLayer = Boolean(
      imagePortalRect?.width && imagePortalRect.height,
    );
    const layoutRect = hasExternalImageLayer ? imagePortalRect! : mapRect;
    const originLeft = mapRect.left - layoutRect.left;
    const originTop = mapRect.top - layoutRect.top;
    const anchorLeft = tooltip.pointLeft + originLeft;
    const pointTop = tooltip.pointTop + originTop;
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
      viewportWidth: layoutRect.width,
      viewportHeight: layoutRect.height,
      imageWidth: hasPreviewImage ? MAP_TOOLTIP_IMAGE_MAX_WIDTH_REM * remSize : undefined,
      imageHeight: hasPreviewImage ? (tooltipPreviewImageHeightRem ?? MAP_TOOLTIP_IMAGE_MAX_WIDTH_REM) * remSize : undefined,
      panelRects: hasPreviewImage ? localizeRects(getVisiblePanelRects(), layoutRect) : [],
      avoidLabelRects: localizeRects(
        getVisibleTooltipLabelRects(tooltip.pointId, tooltip.automatic),
        layoutRect,
      ),
    });

    const labelLayout = hasExternalImageLayer
      ? getMapTooltipLayout({
          anchorLeft: tooltip.pointLeft,
          pointTop: tooltip.pointTop,
          offset: tooltip.offset,
          labelWidth: tooltipRect.width,
          labelHeight: tooltipRect.height,
          viewportWidth: mapRect.width,
          viewportHeight: mapRect.height,
          panelRects: [],
          avoidLabelRects: localizeRects(
            getVisibleTooltipLabelRects(tooltip.pointId, tooltip.automatic),
            mapRect,
          ),
        })
      : layout;
    setTooltipFixedStyle(labelLayout.labelStyle);
    setTooltipImageFixedStyle(shouldShowImage ? layout.imageStyle : null);
  }, [hideWithoutPermanentStyle, permanentStyle, previewImagePortalRoot, tooltip,
    tooltipLabelStyle, tooltipPreviewImageHeightRem, viewportRef]);

  const previewImage = tooltip.expanded && tooltip.previewImageSrc ? (
    <div
      className="pointer-events-auto absolute z-10"
      data-map-tooltip-preview-root
      onPointerDown={(event) => event.stopPropagation()}
      onPointerMove={(event) => event.stopPropagation()}
      onMouseLeave={() => onPreviewMouseLeave(tooltip.pointId)}
      style={{
        ...tooltipImageFixedStyle,
        visibility: tooltipImageFixedStyle ? undefined : 'hidden',
      }}
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
              if (preview) preview.style.display = 'none';
            }}
          />
        </div>
      </div>
    </div>
  ) : null;

  return (
    <>
      {previewImagePortalRoot && previewImage
        ? createPortal(previewImage, previewImagePortalRoot)
        : previewImage}
      <div
        ref={tooltipRef}
        className="pointer-events-none absolute z-0 w-max"
        data-map-tooltip-label-root
        data-map-tooltip-point-id={tooltip.pointId}
        data-map-tooltip-automatic={tooltip.automatic ? 'true' : undefined}
        style={permanentStyle ?? (hideWithoutPermanentStyle
          ? { visibility: 'hidden' }
          : { ...tooltipFixedStyle, visibility: tooltipFixedStyle ? undefined : 'hidden' })}
      >
        <div className="flex w-max items-center gap-1.5">
          {tooltip.spaceLogo && (
            <SpaceLogo
              color={tooltip.spaceLogo.color}
              logoBackground={tooltip.spaceLogo.logoBackground}
              logoUrl={tooltip.spaceLogo.logoUrl}
              logoZoom={tooltip.spaceLogo.logoZoom}
              name={tooltip.spaceLogo.name}
              size="tooltip"
            />
          )}
          <div
            className={`shrink-0 break-words px-2.5 py-1 text-center text-xs font-medium leading-snug ${tooltip.unidentified ? 'flex items-center justify-center' : ''} ${themeColors.util.roundedXl} ${themeColors.map.tooltip}`}
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

function localizeRects(rects: MapTooltipRect[], viewport: DOMRect): MapTooltipRect[] {
  return rects.map((rect) => ({
    left: rect.left - viewport.left,
    right: rect.right - viewport.left,
    top: rect.top - viewport.top,
    bottom: rect.bottom - viewport.top,
  }));
}
