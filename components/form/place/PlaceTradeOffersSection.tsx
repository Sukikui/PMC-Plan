'use client';

import { useState, type ReactNode } from 'react';
import PencilIcon from '@/components/icons/PencilIcon';
import {
  TradeOfferColumnsHeader,
  TradeOfferPreview,
  tradeOfferListRowClass,
} from '@/components/trade/TradeOfferPreview';
import {
  ExpandableSection,
  expandableInteractionClassName,
} from '@/components/ui/ExpandableSection';
import FormField from '../common/FormField';
import FormSection from '../common/FormSection';
import { themeColors } from '@/lib/theme-colors';
import {
  MAX_TRADE_ITEM_CUSTOM_NAME_LENGTH,
  MAX_TRADE_OFFER_DESCRIPTION_LENGTH,
} from '@/lib/trade-offers';
import type {
  FormTradeOffer,
  FormTradeItem,
  UpdateTradeItem,
  UpdateTradeOffer,
} from './place-form-types';
import {
  formInputClassName,
  formTextareaClassName,
} from '../common/form-styles';
import { minecraftItemIdPlaceholder } from '../common/form-placeholders';

interface PlaceTradeOffersSectionProps {
  offers: FormTradeOffer[];
  onAdd: () => string;
  onRemove: (offerId: string) => void;
  onUpdateItem: UpdateTradeItem;
  onUpdateOffer: UpdateTradeOffer;
}

export default function PlaceTradeOffersSection({
  offers,
  onAdd,
  onRemove,
  onUpdateItem,
  onUpdateOffer,
}: PlaceTradeOffersSectionProps) {
  const [expandedOfferId, setExpandedOfferId] = useState<string | null>(null);

  const addOffer = () => {
    setExpandedOfferId(onAdd());
  };

  const removeOffer = (offerId: string) => {
    onRemove(offerId);
    setExpandedOfferId((current) => current === offerId ? null : current);
  };

  return (
    <FormSection
        title="Offres commerciales"
        description="Décrivez les échanges disponibles sur place pour les autres joueurs."
    >
      {offers.length > 0 && (
        <div>
          <TradeOfferColumnsHeader />
          <div>
            {offers.map((offer, index) => (
              <TradeOfferEditor
                key={offer.id}
                index={index}
                offer={offer}
                expanded={expandedOfferId === offer.id}
                onRemove={removeOffer}
                onToggle={() => setExpandedOfferId((current) => current === offer.id ? null : offer.id)}
                onUpdateItem={onUpdateItem}
                onUpdateOffer={onUpdateOffer}
              />
            ))}
          </div>
        </div>
      )}
      <button
        type="button"
        onClick={addOffer}
        className={`inline-flex items-center gap-2 px-3 py-1.5 text-sm border border-dashed ${themeColors.util.roundedLg} ${themeColors.transitionAll} ${themeColors.form.dashedAction}`}
      >
        Ajouter une offre
      </button>
    </FormSection>
  );
}

function TradeOfferEditor({
  index,
  offer,
  expanded,
  onRemove,
  onToggle,
  onUpdateItem,
  onUpdateOffer,
}: {
  index: number;
  offer: FormTradeOffer;
  expanded: boolean;
  onRemove: (offerId: string) => void;
  onToggle: () => void;
  onUpdateItem: UpdateTradeItem;
  onUpdateOffer: UpdateTradeOffer;
}) {
  const description = offer.description ?? '';

  return (
    <div className={tradeOfferListRowClass}>
      <div
        role="button"
        tabIndex={0}
        aria-expanded={expanded}
        aria-label={`${expanded ? 'Replier' : 'Modifier'} l’offre ${index + 1}`}
        onClick={onToggle}
        onKeyDown={(event) => {
          if (event.key !== 'Enter' && event.key !== ' ') return;
          event.preventDefault();
          onToggle();
        }}
        className={expandableInteractionClassName}
      >
        <TradeOfferPreview
          offer={offer}
          variant="plain"
          action={(
            <span
              aria-hidden="true"
              className={`flex h-7 w-7 items-center justify-center ${themeColors.util.roundedFull} ${themeColors.transitionAll} ${
              expanded
                ? themeColors.toggle.activeBlue
                : themeColors.text.tertiary
            }`}
            >
              <PencilIcon className="h-4 w-4" />
            </span>
          )}
        />
      </div>

      <ExpandableSection expanded={expanded}>
        <div className={`mt-3 space-y-4 border p-4 ${themeColors.border.light} ${themeColors.panel.inset} ${themeColors.util.roundedLg}`}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap gap-2">
              <PriceModeButton active={!offer.negotiable} onClick={() => onUpdateOffer(offer.id, 'negotiable', false)}>
                Prix fixe
              </PriceModeButton>
              <PriceModeButton active={Boolean(offer.negotiable)} onClick={() => onUpdateOffer(offer.id, 'negotiable', true)}>
                Négociable
              </PriceModeButton>
            </div>
            <button
              type="button"
              onClick={() => onRemove(offer.id)}
              className={`text-xs font-medium ${themeColors.feedback.errorText} ${themeColors.transition}`}
            >
              Supprimer
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <TradeItemEditor
              item={offer.gives}
              label="Produit proposé"
              offerId={offer.id}
              kind="gives"
              onUpdateItem={onUpdateItem}
            />
            <TradeItemEditor
              item={offer.wants}
              label="Produit demandé"
              offerId={offer.id}
              kind="wants"
              disabled={offer.negotiable}
              onUpdateItem={onUpdateItem}
            />
          </div>

          <FormField
            counter={{
              current: description.length,
              max: MAX_TRADE_OFFER_DESCRIPTION_LENGTH,
            }}
            label="Description (facultative)"
          >
            <textarea
              className={`${formTextareaClassName} min-h-20 resize-y`}
              maxLength={MAX_TRADE_OFFER_DESCRIPTION_LENGTH}
              rows={2}
              value={description}
              onChange={(event) => onUpdateOffer(offer.id, 'description', event.target.value)}
              placeholder="Précisions sur les conditions, disponibilités ou modalités de l’échange…"
            />
          </FormField>
        </div>
      </ExpandableSection>
    </div>
  );
}

function TradeItemEditor({
  disabled = false,
  item,
  kind,
  label,
  offerId,
  onUpdateItem,
}: {
  disabled?: boolean;
  item: FormTradeItem;
  kind: 'gives' | 'wants';
  label: string;
  offerId: string;
  onUpdateItem: UpdateTradeItem;
}) {
  const disabledClass = disabled ? 'cursor-not-allowed opacity-60' : '';

  return (
    <div className="space-y-2">
      <label className={`text-xs font-medium ${themeColors.text.secondary}`}>{label}</label>
      <input
        className={`${formInputClassName} ${disabledClass}`}
        placeholder={minecraftItemIdPlaceholder(
          kind === 'gives' ? 'bow' : 'diamond_block',
        )}
        value={item.item_id}
        onChange={(event) => onUpdateItem(offerId, kind, 'item_id', event.target.value)}
        disabled={disabled}
      />
      <div className="grid grid-cols-2 gap-2">
        <input
          className={`${formInputClassName} ${disabledClass}`}
          type="number"
          min={1}
          inputMode="numeric"
          placeholder="Quantité"
          value={item.quantity}
          onChange={(event) => onUpdateItem(offerId, kind, 'quantity', event.target.value)}
          disabled={disabled}
        />
        <button
          type="button"
          aria-pressed={item.enchanted}
          onClick={() => onUpdateItem(offerId, kind, 'enchanted', !item.enchanted)}
          disabled={disabled}
          className={`inline-flex items-center justify-center gap-2 text-xs font-medium px-3 py-1 ${themeColors.util.roundedLg} transition-colors duration-300 border ${disabledClass} ${
            item.enchanted ? themeColors.toggle.activePurpleStrong : themeColors.toggle.inactiveStrong
          }`}
        >
          {item.enchanted ? 'Item enchanté' : 'Item non enchanté'}
        </button>
      </div>
      <FormField
        counter={{
          current: item.custom_name?.length ?? 0,
          max: MAX_TRADE_ITEM_CUSTOM_NAME_LENGTH,
        }}
        label="Nom personnalisé (facultatif)"
      >
        <input
          className={`${formInputClassName} ${disabledClass}`}
          maxLength={MAX_TRADE_ITEM_CUSTOM_NAME_LENGTH}
          placeholder="Nom personnalisé (facultatif)"
          value={item.custom_name ?? ''}
          onChange={(event) => onUpdateItem(offerId, kind, 'custom_name', event.target.value)}
          disabled={disabled}
        />
      </FormField>
    </div>
  );
}

function PriceModeButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${themeColors.toggle.compactBase} ${active ? themeColors.toggle.activeBlue : themeColors.toggle.inactive}`}
    >
      {children}
    </button>
  );
}
