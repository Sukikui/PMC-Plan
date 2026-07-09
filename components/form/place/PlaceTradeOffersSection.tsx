import ItemVisualizer from '@/components/trade/ItemVisualizer';
import { themeColors } from '@/lib/theme-colors';
import type React from 'react';
import { SubHeader } from '../common/form-utils';
import type { FormTradeOffer, FormTradeItem, UpdateTradeItem } from './place-form-types';
import { placeFormInputClass } from './place-form-types';

interface PlaceTradeOffersSectionProps {
  offers: FormTradeOffer[];
  onAdd: () => void;
  onRemove: (offerId: string) => void;
  onSetNegotiable: (offerId: string, negotiable: boolean) => void;
  onUpdateItem: UpdateTradeItem;
}

export default function PlaceTradeOffersSection({
  offers,
  onAdd,
  onRemove,
  onSetNegotiable,
  onUpdateItem,
}: PlaceTradeOffersSectionProps) {
  return (
    <div className="space-y-3">
      <SubHeader
        title="Offres commerciales"
        description="Décrivez les échanges disponibles sur place pour les autres joueurs."
      />
      {offers.map((offer, index) => (
        <TradeOfferEditor
          key={offer.id}
          index={index}
          offer={offer}
          onRemove={onRemove}
          onSetNegotiable={onSetNegotiable}
          onUpdateItem={onUpdateItem}
        />
      ))}
      <button
        type="button"
        onClick={onAdd}
        className={`inline-flex items-center gap-2 px-3 py-1.5 text-sm border border-dashed ${themeColors.util.roundedLg} ${themeColors.transitionAll} ${themeColors.form.dashedAction}`}
      >
        Ajouter une offre
      </button>
    </div>
  );
}

function TradeOfferEditor({
  index,
  offer,
  onRemove,
  onSetNegotiable,
  onUpdateItem,
}: {
  index: number;
  offer: FormTradeOffer;
  onRemove: (offerId: string) => void;
  onSetNegotiable: (offerId: string, negotiable: boolean) => void;
  onUpdateItem: UpdateTradeItem;
}) {
  const wantDisabled = offer.negotiable;

  return (
    <div className={`space-y-4 p-4 border ${themeColors.border.primary} ${themeColors.panel.secondary} ${themeColors.util.roundedLg}`}>
      <div className="flex items-center justify-between gap-3">
        <span className={`text-sm font-semibold ${themeColors.text.secondary}`}>Offre #{index + 1}</span>
        <button
          type="button"
          onClick={() => onRemove(offer.id)}
          className="text-xs font-medium text-red-500 hover:text-red-400 transition-colors"
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
          disabled={wantDisabled}
          negotiable={offer.negotiable}
          onUpdateItem={onUpdateItem}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <PriceModeButton active={!offer.negotiable} onClick={() => onSetNegotiable(offer.id, false)}>
          Prix fixe
        </PriceModeButton>
        <PriceModeButton active={Boolean(offer.negotiable)} onClick={() => onSetNegotiable(offer.id, true)}>
          Négociable
        </PriceModeButton>
      </div>
    </div>
  );
}

function TradeItemEditor({
  disabled = false,
  item,
  kind,
  label,
  negotiable = false,
  offerId,
  onUpdateItem,
}: {
  disabled?: boolean;
  item: FormTradeItem;
  kind: 'gives' | 'wants';
  label: string;
  negotiable?: boolean;
  offerId: string;
  onUpdateItem: UpdateTradeItem;
}) {
  const disabledClass = disabled ? 'cursor-not-allowed opacity-60' : '';

  return (
    <div className="space-y-2">
      <label className={`text-xs font-medium ${themeColors.text.secondary}`}>{label}</label>
      <div className="flex items-center gap-2">
        <input
          className={`${placeFormInputClass} ${disabledClass}`}
          placeholder={kind === 'gives' ? 'Minecraft ID (ex : bow)' : 'Minecraft ID (ex : diamond_block)'}
          value={item.item_id}
          onChange={(event) => onUpdateItem(offerId, kind, 'item_id', event.target.value)}
          disabled={disabled}
        />
        <ItemVisualizer itemId={item.item_id} enchanted={item.enchanted} className="w-10 h-10 flex-shrink-0" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <input
          className={`${placeFormInputClass} ${disabledClass}`}
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
          className={`inline-flex items-center justify-center gap-2 text-xs font-medium px-3 py-1 ${themeColors.util.roundedLg} transition-colors duration-300 border ${disabled ? 'cursor-not-allowed opacity-60' : ''} ${
            item.enchanted ? themeColors.toggle.activePurpleStrong : themeColors.toggle.inactiveStrong
          }`}
        >
          {item.enchanted ? 'Item enchanté' : 'Item non enchanté'}
        </button>
      </div>
      <input
        className={`${placeFormInputClass} ${disabledClass}`}
        placeholder="Nom personnalisé (facultatif)"
        value={item.custom_name ?? ''}
        onChange={(event) => onUpdateItem(offerId, kind, 'custom_name', event.target.value)}
        disabled={disabled}
      />
      {negotiable && (
        <p className={`text-xs italic ${themeColors.text.tertiary}`}>
          Cette offre sera affichée comme négociable, sans prix fixe.
        </p>
      )}
    </div>
  );
}

function PriceModeButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
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
