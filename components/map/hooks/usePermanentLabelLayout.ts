import { useLayoutEffect, useRef, useState, type CSSProperties, type RefObject } from 'react';
import type { MapTooltip } from '../core/map-types';
import {
  hasLabelZoomRelayoutThreshold,
  layoutCompactLabels,
  layoutPermanentLabels,
  projectRetainedLabels,
} from '../tooltip/permanent-label-layout';
import { estimateMapTooltipSize, MAP_TOOLTIP_VIEWPORT_MARGIN_PX } from '../tooltip/map-tooltip';
import type { MapTooltipRect } from '../tooltip/map-tooltip-layout';

export function usePermanentLabelLayout(
  tooltips: MapTooltip[],
  viewportRef: RefObject<HTMLDivElement | null>,
  zoom: number,
  pointSizePx: number,
  isZooming: boolean,
  compact = false,
) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [styles, setStyles] = useState<Map<string, CSSProperties>>(new Map());
  const cache = useRef({
    key: '',
    layoutZoom: zoom,
    offsets: new Map<string, MapTooltipRect>(),
    wasZooming: false,
  });
  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    const container = containerRef.current;
    if (!viewport || !container || !tooltips.some((tooltip) => tooltip.automatic)) return;
    const nodes = new Map(Array.from(container.querySelectorAll<HTMLElement>('[data-map-tooltip-label-root]'))
      .map((node) => [node.dataset.mapTooltipPointId, node]));
    const update = () => {
      const mapRect = viewport.getBoundingClientRect();
      const key = `${compact}:${pointSizePx}:${mapRect.width}:${mapRect.height}`;
      const structureChanged = cache.current.key !== key;
      if (structureChanged) {
        cache.current.key = key;
        cache.current.layoutZoom = zoom;
        cache.current.offsets.clear();
      }
      const margin = MAP_TOOLTIP_VIEWPORT_MARGIN_PX;
      const bounds = {
        left: margin,
        right: mapRect.width - margin,
        top: margin,
        bottom: mapRect.height - margin,
      };
      let labelSizeChanged = false;
      const labels = tooltips.filter((tooltip) => tooltip.automatic).flatMap((tooltip) => {
        const size = compact
          ? estimateMapTooltipSize(tooltip.label, { unidentified: tooltip.unidentified })
          : nodes.get(tooltip.pointId)?.getBoundingClientRect();
        if (!size?.width || !size.height) return [];
        const { width, height } = size;
        if (!width || !height) return [];
        const radius = Math.max(0, tooltip.offset - 4);
        const saved = cache.current.offsets.get(tooltip.pointId);
        if (saved && (Math.abs(saved.right - saved.left - width) > 0.5 || Math.abs(saved.bottom - saved.top - height) > 0.5)) {
          cache.current.offsets.delete(tooltip.pointId);
          labelSizeChanged = true;
        }
        return [{ id: tooltip.pointId, x: tooltip.pointLeft,
          y: tooltip.pointTop, offset: tooltip.offset, radius,
          priority: tooltip.automaticPriority, width, height }];
      });
      const labelIds = new Set(labels.map((label) => label.id));
      for (const pointId of cache.current.offsets.keys()) {
        if (!labelIds.has(pointId)) cache.current.offsets.delete(pointId);
      }
      const obstacles = tooltips.filter((tooltip) => !tooltip.automatic).flatMap((tooltip) => {
        const rect = nodes.get(tooltip.pointId)?.getBoundingClientRect();
        return rect && rect.width > 0 && rect.height > 0 ? [{
          left: rect.left - mapRect.left,
          right: rect.right - mapRect.left,
          top: rect.top - mapRect.top,
          bottom: rect.bottom - mapRect.top,
        }] : [];
      });
      const zoomStepChanged = isZooming
        && hasLabelZoomRelayoutThreshold(cache.current.layoutZoom, zoom);
      const zoomEnded = cache.current.wasZooming && !isZooming;
      const shouldRelayout = !isZooming
        || structureChanged
        || labelSizeChanged
        || zoomStepChanged
        || cache.current.offsets.size === 0;
      const positions = shouldRelayout
        ? compact
          ? layoutCompactLabels(labels, bounds)
          : layoutPermanentLabels(labels, bounds, obstacles, cache.current.offsets)
        : projectRetainedLabels(labels, bounds, cache.current.offsets);
      const replaceOffsets = zoomStepChanged || zoomEnded || (isZooming && labelSizeChanged);
      for (const label of labels) {
        if (!replaceOffsets && cache.current.offsets.has(label.id)) continue;
        const rect = positions.get(label.id);
        if (rect) {
          cache.current.offsets.set(label.id, {
            left: rect.left - label.x,
            right: rect.right - label.x,
            top: rect.top - label.y,
            bottom: rect.bottom - label.y,
          });
        } else if (replaceOffsets) {
          cache.current.offsets.delete(label.id);
        }
      }
      if (structureChanged || zoomStepChanged || zoomEnded) cache.current.layoutZoom = zoom;
      cache.current.wasZooming = isZooming;
      setStyles(new Map(Array.from(positions, ([id, rect]) => [id, {
        left: rect.left, top: rect.top, transform: 'none', visibility: 'visible',
      }])));
    };
    update();
    if (isZooming) return;
    const frame = requestAnimationFrame(update);
    const observer = new ResizeObserver(update);
    observer.observe(viewport);
    nodes.forEach((node) => observer.observe(node));
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [compact, isZooming, pointSizePx, tooltips, viewportRef, zoom]);
  return { containerRef, styles };
}
