'use client';

import AddPlaceButton from '@/components/AddPlaceButton';
import RouteStepsPreview from '@/components/route/RouteStepsPreview';
import type { Place, Portal } from '@/app/api/utils/shared';
import type { RouteData } from '@/lib/route-planning';
import { themeColors } from '@/lib/theme-colors';
import { PlaceDestinationCard, PortalDestinationCard } from './DestinationCards';
import type { DestinationCardActions } from './destination-panel-types';

interface DestinationPanelContentProps {
  actions: DestinationCardActions;
  filteredPlaces: Place[];
  filteredPortals: Portal[];
  hasOrigin: boolean;
  loading: boolean;
  route: RouteData | null;
  routeError: string | null;
  routeLoading: boolean;
  selectedPlace?: Place;
  selectedPortal?: Portal;
}

export default function DestinationPanelContent({
  actions,
  filteredPlaces,
  filteredPortals,
  hasOrigin,
  loading,
  route,
  routeError,
  routeLoading,
  selectedPlace,
  selectedPortal,
}: DestinationPanelContentProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className={`${themeColors.text.tertiary} ${themeColors.transition}`}>Chargement...</div>
      </div>
    );
  }

  if (selectedPlace || selectedPortal) {
    return (
      <div className="space-y-6">
        <div>
          <h3 className={`text-xs font-semibold ${themeColors.text.secondary} mb-3 ${themeColors.util.uppercase} ${themeColors.transition}`}>Destination sélectionnée</h3>
          <div className="space-y-2">
            {selectedPlace && <PlaceDestinationCard place={selectedPlace} actions={actions} />}
            {selectedPortal && <PortalDestinationCard portal={selectedPortal} actions={actions} />}
          </div>
        </div>
        <RouteStepsPreview
          route={route}
          loading={routeLoading}
          error={routeError}
          hasOrigin={hasOrigin}
        />
      </div>
    );
  }

  if (filteredPlaces.length === 0 && filteredPortals.length === 0) {
    return (
      <div className={`flex flex-col items-center justify-center py-12 ${themeColors.destinationPanel.emptyStateText} text-center space-y-4`}>
        <p>Aucun résultat. (｡•́︿•̀｡)</p>
        <AddPlaceButton className={`${themeColors.link} pl-3 pr-4 py-2 ${themeColors.util.roundedFull} ${themeColors.transitionAll} flex items-center gap-2`}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v12m-6-6h12" />
          </svg>
          Ajouter un lieu ou un portail
        </AddPlaceButton>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {filteredPlaces.length > 0 && (
        <div>
          <h3 className={`text-xs font-semibold ${themeColors.text.secondary} mb-3 ${themeColors.util.uppercase} ${themeColors.transition}`}>Lieux</h3>
          <div className="space-y-2">
            {filteredPlaces.map((place) => (
              <PlaceDestinationCard key={place.id} place={place} actions={actions} />
            ))}
          </div>
        </div>
      )}

      {filteredPortals.length > 0 && (
        <div>
          <h3 className={`text-xs font-semibold ${themeColors.text.secondary} mb-3 ${themeColors.util.uppercase} ${themeColors.transition}`}>Portails</h3>
          <div className="space-y-2">
            {filteredPortals.map((portal) => (
              <PortalDestinationCard key={portal.id} portal={portal} actions={actions} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
