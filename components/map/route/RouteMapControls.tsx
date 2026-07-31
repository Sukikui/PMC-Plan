'use client';

import { useEffect, useState, type CSSProperties } from 'react';
import CrossIcon from '@/components/icons/CrossIcon';
import MapIcon from '@/components/icons/MapIcon';
import IconButtonRound from '@/components/ui/IconButtonRound';
import type { DestinationType } from '@/lib/destination/selection';
import type { MapRoutePath, MapRouteSegment } from '@/lib/map/route-path';
import { DEFAULT_PLACE_CATEGORY, getMapIconSrc } from '@/lib/place/categories';
import { themeColors } from '@/lib/theme-colors';

interface RouteMapControlsProps {
  routePath: MapRoutePath | null;
  activeSegmentId?: string | null;
  destinationType: DestinationType;
  onSegmentSelect: (segment: MapRouteSegment | null) => void;
}

export default function RouteMapControls({
  routePath,
  activeSegmentId,
  destinationType,
  onSegmentSelect,
}: RouteMapControlsProps) {
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    setExpanded(false);
  }, [routePath?.key]);

  if (!routePath?.segments.length) return null;

  if (!expanded) {
    return (
      <div data-map-panel className="fixed bottom-5 left-1/2 z-40 -translate-x-1/2">
        <IconButtonRound
          type="button"
          className={`map-route-control-enter !w-auto gap-2 px-4 ${themeColors.text.secondary}`}
          onClick={() => {
            setExpanded(true);
            onSegmentSelect(routePath.segments[0]);
          }}
        >
          <MapIcon className="h-5 w-5" />
          <span className="whitespace-nowrap text-sm font-medium">Aperçu de l&apos;itinéraire</span>
        </IconButtonRound>
      </div>
    );
  }

  return (
    <div
      data-map-panel
      className="fixed bottom-5 left-1/2 z-40 max-w-[calc(100vw-2rem)] -translate-x-1/2"
      aria-label="Étapes de l'itinéraire"
      role="group"
    >
      <div className="map-route-control-enter flex max-w-full items-center gap-2 overflow-x-auto p-3">
        {routePath.segments.map((segment, index) => (
          <RouteStepButton
            key={segment.id}
            segment={segment}
            index={index}
            active={segment.id === activeSegmentId}
            destinationType={destinationType}
            onClick={() => onSegmentSelect(segment)}
          />
        ))}

        <IconButtonRound
          type="button"
          shadow="compact"
          className="map-route-step-enter shrink-0"
          style={{ '--route-map-step-delay': `${routePath.segments.length * 55}ms` } as CSSProperties}
          aria-label="Masquer l'itinéraire"
          title="Masquer l'itinéraire"
          onClick={() => {
            onSegmentSelect(null);
            setExpanded(false);
          }}
        >
          <CrossIcon className={`h-5 w-5 ${themeColors.text.secondary}`} />
        </IconButtonRound>
      </div>
    </div>
  );
}

function RouteStepButton({
  segment,
  index,
  active,
  destinationType,
  onClick,
}: {
  segment: MapRouteSegment;
  index: number;
  active: boolean;
  destinationType: DestinationType;
  onClick: () => void;
}) {
  const iconCategory = segment.target.kind === 'portal' || destinationType === 'portal'
    ? 'portail'
    : DEFAULT_PLACE_CATEGORY;
  const stateClassName = active
    ? themeColors.routePreview.mapStepActive
    : themeColors.routePreview.mapStepInactive;

  return (
    <IconButtonRound
      type="button"
      shadow="compact"
      className={`map-route-step-enter !w-auto min-w-12 shrink-0 overflow-hidden pl-2.5 ${active ? 'pr-4' : 'pr-2.5'} ${stateClassName}`}
      style={{ '--route-map-step-delay': `${index * 55}ms` } as CSSProperties}
      aria-label={`Afficher l'étape vers ${segment.target.label}`}
      aria-pressed={active}
      title={segment.target.label}
      onClick={onClick}
    >
      <img
        src={getMapIconSrc(iconCategory)}
        alt=""
        aria-hidden="true"
        className="h-7 w-7 shrink-0 object-contain"
      />
      <span
        className={`overflow-hidden whitespace-nowrap text-sm font-medium transition-[max-width,margin,opacity] duration-300 ease-out ${active ? 'map-route-step-label-fade ml-2 max-w-48 opacity-100' : 'ml-0 max-w-0 opacity-0'}`}
      >
        {segment.target.label}
      </span>
    </IconButtonRound>
  );
}
