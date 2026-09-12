import { useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type RefObject } from 'react';
import type { MapTooltip } from '../core/map-types';
import { layoutCompactLabels, layoutPermanentLabels } from '../tooltip/permanent-label-layout';
import { estimateMapTooltipSize, MAP_TOOLTIP_VIEWPORT_MARGIN_PX } from '../tooltip/map-tooltip';
import type { MapTooltipRect } from '../tooltip/map-tooltip-layout';
import type { MapViewport } from '../core/map-view';

export function usePermanentLabelLayout(
  tooltips: MapTooltip[],
  viewportRef: RefObject<HTMLDivElement | null>,
  viewport: MapViewport,
  zoom: number,
  iconScale: number,
  pointSizePx: number,
  compact = false,
) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [styles, setStyles] = useState<Map<string, CSSProperties>>(new Map());
  const cache = useRef({ key: '', offsets: new Map<string, MapTooltipRect>() });
  const compactStyles = useMemo(() => {
    if (!compact || !viewport.width || !viewport.height) {
      return new Map<string, CSSProperties>();
    }
    const margin = MAP_TOOLTIP_VIEWPORT_MARGIN_PX;
    const labels = tooltips.filter((tooltip) => tooltip.automatic).map((tooltip) => ({
      ...estimateMapTooltipSize(tooltip.label, {
        hasSpaceLogo: Boolean(tooltip.spaceLogo),
        unidentified: tooltip.unidentified,
      }),
      id: tooltip.pointId,
      offset: tooltip.offset,
      x: tooltip.pointLeft,
      y: tooltip.pointTop,
    }));
    return layoutCompactLabels(labels, {
      left: margin,
      right: viewport.width - margin,
      top: margin,
      bottom: viewport.height - margin,
    });
  }, [compact, tooltips, viewport.height, viewport.width]);
  useLayoutEffect(() => {
    if (compact) return;
    const viewport = viewportRef.current;
    const container = containerRef.current;
    if (!viewport || !container || !tooltips.some((tooltip) => tooltip.automatic)) return;
    const nodes = new Map(Array.from(container.querySelectorAll<HTMLElement>('[data-map-tooltip-label-root]'))
      .map((node) => [node.dataset.mapTooltipPointId, node]));
    const update = () => {
      const mapRect = viewport.getBoundingClientRect();
      const key = `${zoom}:${iconScale}:${pointSizePx}:${mapRect.width}:${mapRect.height}`;
      if (cache.current.key !== key) cache.current = { key, offsets: new Map() };
      const margin = MAP_TOOLTIP_VIEWPORT_MARGIN_PX;
      const bounds = {
        left: margin,
        right: mapRect.width - margin,
        top: margin,
        bottom: mapRect.height - margin,
      };
      const labels = tooltips.filter((tooltip) => tooltip.automatic).flatMap((tooltip) => {
        const node = nodes.get(tooltip.pointId);
        if (!node) return [];
        const { width, height } = node.getBoundingClientRect();
        if (!width || !height) return [];
        const radius = Math.max(0, tooltip.offset - 4);
        const saved = cache.current.offsets.get(tooltip.pointId);
        if (saved && (Math.abs(saved.right - saved.left - width) > 0.5 || Math.abs(saved.bottom - saved.top - height) > 0.5)) {
          cache.current.offsets.delete(tooltip.pointId);
        }
        return [{ id: tooltip.pointId, x: tooltip.pointLeft,
          y: tooltip.pointTop, offset: tooltip.offset, radius,
          priority: tooltip.automaticPriority, width, height }];
      });
      const obstacles = tooltips.filter((tooltip) => !tooltip.automatic).flatMap((tooltip) => {
        const rect = nodes.get(tooltip.pointId)?.getBoundingClientRect();
        return rect && rect.width > 0 && rect.height > 0 ? [{
          left: rect.left - mapRect.left,
          right: rect.right - mapRect.left,
          top: rect.top - mapRect.top,
          bottom: rect.bottom - mapRect.top,
        }] : [];
      });
      const positions = layoutPermanentLabels(labels, bounds, obstacles, cache.current.offsets);
      for (const label of labels) {
        if (cache.current.offsets.has(label.id)) continue;
        const rect = positions.get(label.id);
        if (rect) cache.current.offsets.set(label.id, {
          left: -label.width / 2, right: label.width / 2,
          top: rect.top - label.y, bottom: rect.bottom - label.y,
        });
      }
      setStyles(new Map(Array.from(positions, ([id, rect]) => [id, {
        left: rect.left, top: rect.top, transform: 'none', visibility: 'visible',
      }])));
    };
    update();
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
  }, [compact, iconScale, pointSizePx, tooltips, viewportRef, zoom]);
  return { containerRef, styles: compact ? compactStyles : styles };
}
