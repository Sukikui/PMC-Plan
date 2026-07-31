'use client';

import { useEffect, useState } from 'react';
import type { Place, Portal } from '@/lib/api/types';
import {
  MapEntrySummaryIcon,
  MapEntryWorldBadge,
} from '@/components/content/MapEntrySummaryPresentation';
import AccountContentRow from '@/components/settings/account/AccountContentRow';
import SpaceLogo from '@/components/spaces/SpaceLogo';
import ServiceIllustration from '@/components/services/ServiceIllustration';
import { interactiveListGroupClassName } from '@/components/ui/ListRow';
import { subscribeToInvalidations } from '@/lib/client/cached-list';
import {
  loadPlacesData,
  loadPortalsData,
  subscribeToMainScreenDataInvalidation,
  subscribeToMapEntryManagementUpdates,
} from '@/lib/preload/main-screen';
import { sortByLocalizedName } from '@/lib/content/sorting';
import { themeColors } from '@/lib/theme-colors';
import type { DestinationType } from '@/lib/destination/selection';
import {
  fetchSpaces,
  subscribeToSpacesInvalidation,
} from '@/lib/spaces/client';
import type { Space } from '@/lib/spaces/types';
import {
  fetchServices,
  subscribeToServicesInvalidation,
} from '@/lib/services/client';
import type { Service } from '@/lib/services/types';

interface AccountContentListProps {
  userId: string;
  onOpenContent: (item: Place | Portal, type: DestinationType) => void;
  onOpenService: (service: Service) => void;
  onOpenSpace: (space: Space) => void;
}

interface OwnedContent {
  places: Place[];
  portals: Portal[];
  services: Service[];
  spaces: Space[];
}

const emptyContent: OwnedContent = {
  places: [],
  portals: [],
  services: [],
  spaces: [],
};

export default function AccountContentList({
  userId,
  onOpenContent,
  onOpenService,
  onOpenSpace,
}: AccountContentListProps) {
  const [content, setContent] = useState(emptyContent);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadContent = async (showLoading = true) => {
      if (showLoading) setLoading(true);
      setError(false);

      try {
        const [places, portals, services, spaces] = await Promise.all([
          loadPlacesData(),
          loadPortalsData({ mergeNetherPortals: true }),
          fetchServices(),
          fetchSpaces(),
        ]);
        if (!cancelled) {
          setContent({
            places: sortByLocalizedName(
              places.filter((place) => isManagedBy(place, userId)),
            ),
            portals: sortByLocalizedName(
              portals.filter((portal) => isManagedBy(portal, userId)),
            ),
            services: sortByLocalizedName(
              services.filter((service) => isManagedBy(service, userId)),
            ),
            spaces: sortByLocalizedName(
              spaces.filter((space) => isManagedBy(space, userId)),
            ),
          });
        }
      } catch {
        if (!cancelled) {
          setContent(emptyContent);
          setError(true);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void loadContent();
    const unsubscribe = subscribeToInvalidations([
      subscribeToMainScreenDataInvalidation,
      subscribeToMapEntryManagementUpdates,
      subscribeToSpacesInvalidation,
      subscribeToServicesInvalidation,
    ], () => {
      void loadContent(false);
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [userId]);

  const total = content.places.length
    + content.portals.length
    + content.services.length
    + content.spaces.length;

  return (
    <section aria-labelledby="account-content-title">
      <h3
        id="account-content-title"
        className={`text-sm font-semibold ${themeColors.text.primary}`}
      >
        Gérer mon contenu
      </h3>

      {loading ? (
        <p className={`py-6 text-center text-sm ${themeColors.text.tertiary}`}>
          Chargement...
        </p>
      ) : error ? (
        <p className={`py-6 text-center text-sm ${themeColors.feedback.errorText}`}>
          Impossible de charger ton contenu.
        </p>
      ) : total === 0 ? (
        <p className={`py-6 text-center text-sm ${themeColors.text.tertiary}`}>
          Tu ne gères encore aucun contenu.
        </p>
      ) : (
        <div className="mt-4 space-y-5">
          <ContentGroup
            items={content.places}
            label="Lieux"
            type="place"
            onOpenContent={onOpenContent}
          />
          <ContentGroup
            items={content.portals}
            label="Portails"
            type="portal"
            onOpenContent={onOpenContent}
          />
          <SpaceGroup
            onOpenSpace={onOpenSpace}
            spaces={content.spaces}
          />
          <ServiceGroup
            onOpenService={onOpenService}
            services={content.services}
          />
        </div>
      )}
    </section>
  );
}

const isManagedBy = (
  item: Pick<
    Place | Portal | Service | Space,
    'primaryManagerId' | 'managerIds'
  >,
  userId: string,
) => item.primaryManagerId === userId || item.managerIds.includes(userId);

function ContentGroup({
  items,
  label,
  type,
  onOpenContent,
}: {
  items: Array<Place | Portal>;
  label: string;
  type: DestinationType;
  onOpenContent: AccountContentListProps['onOpenContent'];
}) {
  if (items.length === 0) return null;

  return (
    <div>
      <p className={`mb-1 px-2 text-[11px] font-semibold ${themeColors.text.secondary} ${themeColors.util.uppercase}`}>
        {label} ({items.length})
      </p>
      <div className={interactiveListGroupClassName}>
        {items.map((item) => (
          <ContentRow
            key={`${type}-${item.id}-${item.world}`}
            item={item}
            type={type}
            onOpen={() => onOpenContent(item, type)}
          />
        ))}
      </div>
    </div>
  );
}

function ContentRow({
  item,
  type,
  onOpen,
}: {
  item: Place | Portal;
  type: DestinationType;
  onOpen: () => void;
}) {
  const linkedPortal = type === 'portal'
    && Boolean((item as Portal)['nether-associate']);

  return (
    <AccountContentRow
      additionalManagerCount={item.managerIds.length}
      association={item.space}
      identity={(
        <MapEntrySummaryIcon
          category={type === 'place' ? (item as Place).category : undefined}
          type={type}
        />
      )}
      manager={item.primaryManager}
      metadata={(
        <MapEntryWorldBadge
          linked={linkedPortal}
          type={type}
          world={item.world}
        />
      )}
      name={item.name}
      onOpen={onOpen}
    />
  );
}

function SpaceGroup({
  onOpenSpace,
  spaces,
}: {
  onOpenSpace: AccountContentListProps['onOpenSpace'];
  spaces: Space[];
}) {
  if (spaces.length === 0) return null;

  return (
    <div>
      <p className={`mb-1 px-2 text-[11px] font-semibold ${themeColors.text.secondary} ${themeColors.util.uppercase}`}>
        Espaces ({spaces.length})
      </p>
      <div className={interactiveListGroupClassName}>
        {spaces.map((space) => (
          <AccountContentRow
            additionalManagerCount={space.managerIds.length}
            association={null}
            identity={(
              <SpaceLogo
                color={space.color}
                logoBackground={space.logoBackground}
                logoUrl={space.logoUrl}
                logoZoom={space.logoZoom}
                name={space.name}
                size="compact"
              />
            )}
            key={space.id}
            manager={space.primaryManager}
            metadata={(
              <span className={`justify-self-end text-xs ${themeColors.text.tertiary}`}>
                #{space.slug}
              </span>
            )}
            name={space.name}
            onOpen={() => onOpenSpace(space)}
          />
        ))}
      </div>
    </div>
  );
}

function ServiceGroup({
  onOpenService,
  services,
}: {
  onOpenService: AccountContentListProps['onOpenService'];
  services: Service[];
}) {
  if (services.length === 0) return null;

  return (
    <div>
      <p className={`mb-1 px-2 text-[11px] font-semibold ${themeColors.text.secondary} ${themeColors.util.uppercase}`}>
        Services ({services.length})
      </p>
      <div className={interactiveListGroupClassName}>
        {services.map((service) => (
          <AccountContentRow
            additionalManagerCount={service.managerIds.length}
            association={null}
            identity={(
              <ServiceIllustration
                className="h-9 w-9"
                itemId={service.illustrationItemId}
              />
            )}
            key={service.id}
            manager={service.primaryManager}
            name={service.name}
            onOpen={() => onOpenService(service)}
          />
        ))}
      </div>
    </div>
  );
}
