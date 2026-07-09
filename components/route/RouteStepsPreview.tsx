'use client';

import type { CSSProperties } from 'react';
import { themeColors } from '@/lib/theme-colors';
import {
  buildRouteBreadcrumb,
  formatRouteCoordinates,
  type RouteBreadcrumbItem,
  type RouteData,
  type RouteWorldCoordinates,
} from '@/lib/route-planning';

interface RouteStepsPreviewProps {
  route: RouteData | null;
  loading: boolean;
  error: string | null;
  hasOrigin: boolean;
}

type RouteRevealStyle = CSSProperties & {
  '--route-step-delay'?: string;
};

const getWorldTextClass = (world?: string) => {
  if (world === 'overworld') {
    return themeColors.worldText.overworld;
  }

  if (world === 'nether') {
    return themeColors.worldText.nether;
  }

  return themeColors.worldText.unknown;
};

const getRouteCoordinateItems = (item: RouteBreadcrumbItem): RouteWorldCoordinates[] => {
  if (item.coordinateItems?.length) {
    return item.coordinateItems;
  }

  if (!item.coordinates) {
    return [];
  }

  return [{
    world: item.world ?? 'unknown',
    coordinates: item.coordinates,
  }];
};

function RouteCoordinateStack({ item }: { item: RouteBreadcrumbItem }) {
  const coordinateItems = getRouteCoordinateItems(item);

  if (coordinateItems.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col items-end gap-0.5">
      {coordinateItems.map(({ world, coordinates }) => (
        <span
          key={`${world}-${coordinates.x}-${coordinates.y}-${coordinates.z}`}
          className={`whitespace-nowrap text-xs font-medium opacity-70 ${getWorldTextClass(world)}`}
        >
          {formatRouteCoordinates(coordinates, false)}
        </span>
      ))}
    </div>
  );
}

function NetherAddressBadge({ address, className = '' }: { address: string; className?: string }) {
  return (
    <span className={`inline-flex min-h-5 items-center whitespace-nowrap px-2 py-0.5 leading-none ${themeColors.util.roundedFull} ${themeColors.routePreview.netherAddress} text-[10px] font-semibold ${className}`}>
      {address}
    </span>
  );
}

function StatusCard({ title, description, tone = 'default' }: { title: string; description: string; tone?: 'default' | 'error' }) {
  return (
    <div className={`${themeColors.panel.secondary} border ${tone === 'error' ? themeColors.syncNotification.errorBorder : themeColors.border.secondary} ${themeColors.util.roundedLg} p-4 ${themeColors.transition}`}>
      <div className={`text-sm font-semibold ${tone === 'error' ? themeColors.feedback.errorText : themeColors.text.primary}`}>
        {title}
      </div>
      <p className={`mt-1 text-xs ${themeColors.text.secondary}`}>
        {description}
      </p>
    </div>
  );
}

function getRouteRevealStyle(index: number): RouteRevealStyle {
  return {
    '--route-step-delay': `${index * 80}ms`,
  };
}

function RouteStatusLine({ label, value, revealIndex }: { label: string; value: string; revealIndex?: number }) {
  return (
    <div
      className={`flex items-center justify-between gap-3 ${revealIndex !== undefined ? 'route-step-reveal' : ''}`}
      style={revealIndex !== undefined ? getRouteRevealStyle(revealIndex) : undefined}
    >
      <span className={`text-xs font-medium ${themeColors.routePreview.playerPosition}`}>
        {label}
      </span>
      <span className={`shrink-0 text-xs font-semibold ${themeColors.text.primary} ${themeColors.panel.secondary} border ${themeColors.border.primary} ${themeColors.util.roundedFull} px-2.5 py-1`}>
        {value}
      </span>
    </div>
  );
}

function RouteHeader({ route }: { route: RouteData }) {
  return (
    <RouteStatusLine
      label="Position du joueur"
      value={`${route.total_distance.toFixed(0)} blocs`}
      revealIndex={0}
    />
  );
}

function TimelineSegment({ distance }: { distance?: number }) {
  return (
    <div className="grid grid-cols-[1rem_minmax(0,1fr)] gap-3">
      <div className="flex h-12 justify-center">
        <div className={`w-0.5 ${themeColors.ui.stepConnector}`} />
      </div>
      <div className="flex h-12 items-center">
        {distance && (
          <span className={`text-[10px] ${themeColors.text.muted}`}>
            {distance.toFixed(0)} blocs
          </span>
        )}
      </div>
    </div>
  );
}

function BreadcrumbLoop({ isLast }: { isLast: boolean }) {
  const loopPath = 'M 8 0 V 0 C 8 10 13 13 16 12 C 19 11 19 8 16 7 C 13 6 8 9 8 19';
  const path = isLast ? 'M 8 0 V 3 C 8 10 13 13 16 12' : `${loopPath} V 24`;

  return (
    <svg
      aria-hidden="true"
      className={`relative z-10 h-6 w-4 overflow-visible ${themeColors.ui.stepConnectorStroke}`}
      focusable="false"
      viewBox="0 0 16 24"
    >
      <path
        d={path}
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

function TimelinePoint({ item, isLast }: { item: RouteBreadcrumbItem; isLast: boolean }) {
  const hasCoordinates = getRouteCoordinateItems(item).length > 0;

  return (
    <div className="grid grid-cols-[1rem_minmax(0,1fr)] gap-3">
      <div className="relative flex justify-center">
        {!isLast && (
          <div className={`absolute left-1/2 top-6 bottom-0 w-0.5 -translate-x-1/2 ${themeColors.ui.stepConnector}`} />
        )}
        <BreadcrumbLoop isLast={isLast} />
      </div>

      <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] gap-x-3">
        <div className="min-w-0">
          <div className={`min-w-0 text-sm font-medium ${item.kind === 'unknown' ? themeColors.routePreview.unknownPortal : themeColors.text.primary}`}>
            {item.label}
          </div>
          {item.address && (
            <div className="-mt-px">
              <NetherAddressBadge address={item.address} />
            </div>
          )}
        </div>
        {hasCoordinates && (
          <div className="flex justify-end">
            <RouteCoordinateStack item={item} />
          </div>
        )}
      </div>
    </div>
  );
}

function Timeline({ waypoints }: { waypoints: RouteBreadcrumbItem[] }) {
  return (
    <div>
      {waypoints.map((item, index) => (
        <div
          key={`${item.key}-${index}`}
          className="route-step-reveal"
          style={getRouteRevealStyle(index + 1)}
        >
          <TimelineSegment distance={item.distanceFromPrevious} />
          <TimelinePoint item={item} isLast={index === waypoints.length - 1} />
        </div>
      ))}
    </div>
  );
}

export default function RouteStepsPreview({ route, loading, error, hasOrigin }: RouteStepsPreviewProps) {
  if (!hasOrigin) {
    return (
      <StatusCard
        title="Position requise"
        description="Synchronisez-vous avec le mod PlayerCoordsAPI ou indiquez manuellement vos coordonnées."
      />
    );
  }

  if (loading) {
    return (
      <RouteStatusLine label="Calcul en cours..." value="..." />
    );
  }

  if (error) {
    return (
      <StatusCard
        title="Erreur de calcul"
        description={error}
        tone="error"
      />
    );
  }

  if (!route) {
    return (
      <StatusCard
        title="Itinéraire en attente"
        description="Sélectionnez une destination et une position pour lancer le calcul."
      />
    );
  }

  const [, ...waypoints] = buildRouteBreadcrumb(route);

  if (waypoints.length === 0) {
    return (
      <div className="space-y-4">
        <RouteHeader route={route} />
        <StatusCard
          title="Déjà sur place"
          description="Aucune étape de déplacement n'est nécessaire."
        />
      </div>
    );
  }

  return (
    <div className="space-y-0">
      <RouteHeader route={route} />
      <Timeline waypoints={waypoints} />
    </div>
  );
}
