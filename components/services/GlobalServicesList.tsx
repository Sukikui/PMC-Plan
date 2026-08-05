'use client';

import { useState } from 'react';
import ServiceIllustration, {
  ServiceItemVisual,
} from '@/components/services/ServiceIllustration';
import IdentitySummary from '@/components/settings/IdentitySummary';
import {
  ContentSummaryIdentityView,
} from '@/components/content/ContentSummaryRow';
import { TradeOfferColumnHeader } from '@/components/trade/TradeOfferPreview';
import ExpandableDescription from '@/components/ui/ExpandableDescription';
import DiscordLink from '@/components/ui/DiscordLink';
import MinecraftHeadImage from '@/components/ui/MinecraftHeadImage';
import { listRowClassName } from '@/components/ui/ListRow';
import UserAvatar from '@/components/ui/UserAvatar';
import { getServiceContactHref } from '@/lib/services/contact';
import type { ServiceListItem } from '@/lib/services/types';
import { themeColors } from '@/lib/theme-colors';

const serviceLayoutClassName = 'flex min-w-0 items-center gap-4';
const providerColumnsClassName =
  'grid min-w-0 flex-[7] self-stretch grid-cols-2 items-center gap-3 pr-4';
const detailsColumnsClassName =
  'grid min-w-0 flex-[13] grid-cols-2 items-center gap-8';

export default function GlobalServicesList({
  services,
}: {
  services: ServiceListItem[];
}) {
  const [expandedServiceId, setExpandedServiceId] = useState<string | null>(
    null,
  );

  return (
    <div>
      <div className={`${serviceLayoutClassName} pb-2 pl-2 pr-9`}>
        <div className={providerColumnsClassName}>
          <TradeOfferColumnHeader className="text-center">
            Contact
          </TradeOfferColumnHeader>
          <TradeOfferColumnHeader className="text-center">
            Prestataire
          </TradeOfferColumnHeader>
        </div>
        <div className={detailsColumnsClassName}>
          <TradeOfferColumnHeader className="text-center">
            Service
          </TradeOfferColumnHeader>
          <TradeOfferColumnHeader className="text-center">
            Modalités de paiement
          </TradeOfferColumnHeader>
        </div>
      </div>
      <div>
        {services.map((service) => (
          <ServiceRow
            expanded={expandedServiceId === service.id}
            key={service.id}
            onExpandedChange={(expanded) => (
              setExpandedServiceId(expanded ? service.id : null)
            )}
            service={service}
          />
        ))}
      </div>
    </div>
  );
}

function ServiceRow({
  expanded,
  onExpandedChange,
  service,
}: {
  expanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
  service: ServiceListItem;
}) {
  const provider = service.owners[0] ?? null;
  const additionalProviderCount = Math.max(0, service.owners.length - 1);

  return (
    <ExpandableDescription
      className={`${listRowClassName} px-2`}
      description={service.description}
      expanded={expanded}
      onExpandedChange={onExpandedChange}
    >
      <div className={serviceLayoutClassName}>
        <div className={`${providerColumnsClassName} border-r ${themeColors.border.light}`}>
          <div className="flex min-w-0 items-center">
            <ServiceContact service={service} />
          </div>
          <div className="min-w-0">
            <ContentSummaryIdentityView
              avatar={provider ? (
                <MinecraftHeadImage
                  alt=""
                  className="h-8 w-8 object-contain"
                  loading="lazy"
                  playerIdentifier={provider.uuid}
                />
              ) : undefined}
              label={provider?.name ?? 'Prestataire non renseigné'}
              suffix={additionalProviderCount > 0
                ? `+ ${additionalProviderCount}`
                : undefined}
            />
          </div>
        </div>
        <div className={detailsColumnsClassName}>
          <div className="flex min-w-0 items-center gap-3">
            <ServiceIllustration itemId={service.illustrationItemId} />
            <div className="min-w-0">
              <div className={`truncate text-sm font-medium ${themeColors.text.primary}`}>
                {service.name}
              </div>
              <div className={`whitespace-normal break-words text-xs leading-4 ${themeColors.text.tertiary}`}>
                {service.subtitle}
              </div>
            </div>
          </div>
          <div className="flex min-w-0 items-center gap-3">
            {service.paymentItemId && (
              <ServiceItemVisual
                className="h-10 w-10"
                fallback="payment"
                itemId={service.paymentItemId}
              />
            )}
            {service.paymentDescription ? (
              <span
                className={`min-w-0 whitespace-normal break-words text-xs leading-4 ${themeColors.text.tertiary}`}
              >
                {service.paymentDescription}
              </span>
            ) : !service.paymentItemId ? (
              <span className={themeColors.text.muted}>—</span>
            ) : null}
          </div>
        </div>
      </div>
    </ExpandableDescription>
  );
}

function ServiceContact({ service }: { service: ServiceListItem }) {
  const contactHref = getServiceContactHref(service);
  if (service.contactType === 'primary_manager' && contactHref) {
    const manager = service.primaryManager;
    return (
      <a
        aria-label={`Contacter ${manager.name ?? manager.username ?? 'le gestionnaire principal'} sur Discord`}
        className={`group/interactive block min-w-0 ${themeColors.interactive.focusRing}`}
        href={contactHref}
        rel="noopener noreferrer"
        target="_blank"
      >
        <IdentitySummary
          accentOnScopedGroupHover
          avatar={(
            <UserAvatar
              alt=""
              className="h-9 w-9"
              src={manager.image}
            />
          )}
          subtitle={manager.username ? `@${manager.username}` : manager.id}
          title={manager.name ?? manager.username ?? 'Utilisateur Discord'}
        />
      </a>
    );
  }

  if (contactHref) {
    return (
      <DiscordLink
        ariaLabel="Ouvrir le contact Discord"
        href={contactHref}
        label="Serveur"
      />
    );
  }

  return null;
}
