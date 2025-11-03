'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { themeColors } from '@/lib/theme-colors';
import ItemVisualizer from '@/components/trade/ItemVisualizer';
import { Prisma } from '@prisma/client';

// Helper functions from AddPortalOverlay
const inputClass = `${themeColors.input.search} border ${themeColors.util.roundedLg} px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 ${themeColors.transition} ${themeColors.placeholder}`;
const sectionTitleClass = `text-sm font-semibold ${themeColors.text.secondary} ${themeColors.transition}`;

const SubHeader: React.FC<{ title: string; description?: string }> = ({ title, description }) => (
  <div className="space-y-0.5">
    <h3 className={sectionTitleClass}>{title}</h3>
    {description && (
      <p className={`text-xs ${themeColors.text.quaternary}`}>{description}</p>
    )}
  </div>
);

const slugify = (value: string) => {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);
};

const parseOwners = (input: string): string[] => {
  return input
    .split(/[\n,;]+/)
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
};

const parseTags = (input: string): string[] => {
  return Array.from(
    new Set(
      input
        .split(/[\n,;]+/)
        .map((entry) => entry.trim())
        .filter((entry) => entry.length > 0)
    )
  );
};

const parseCoordinateTriplet = (coords: any) => {
  const x = Number(coords.x);
  const y = Number(coords.y);
  const z = Number(coords.z);
  if (Number.isNaN(x) || Number.isNaN(y) || Number.isNaN(z)) {
    return null;
  }
  return { x, y, z };
};

const generateFormId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2, 10);
};

const createTradeItem = () => ({
  item_id: '',
  quantity: 0,
  custom_name: '',
  enchanted: false,
});

const createTradeOffer = () => ({
  id: generateFormId(),
  gives: createTradeItem(),
  wants: createTradeItem(),
  negotiable: false,
});

const blankCoords = { x: '', y: '', z: '' };

export default function PlaceForm({ mode = 'add', initialData, onSubmit, onCancel }) {
  const [placeName, setPlaceName] = useState(initialData?.name || '');
  const [placeSlug, setPlaceSlug] = useState(initialData?.slug || '');
  const [placeSlugManuallyEdited, setPlaceSlugManuallyEdited] = useState(!!initialData?.slug);
  const [placeWorld, setPlaceWorld] = useState(initialData?.world || 'overworld');
  const [placeCoords, setPlaceCoords] = useState(initialData?.coordinates ? { x: String(initialData.coordinates.x), y: String(initialData.coordinates.y), z: String(initialData.coordinates.z) } : blankCoords);
  const [placeOwnersInput, setPlaceOwnersInput] = useState(initialData?.owners?.join(', ') || '');
  const [placeTagsInput, setPlaceTagsInput] = useState(initialData?.tags?.join(', ') || '');
  const [placeDescription, setPlaceDescription] = useState(initialData?.description || '');
  const [placeDiscordUrl, setPlaceDiscordUrl] = useState(initialData?.discord || '');
  const [placeImageUrl, setPlaceImageUrl] = useState(initialData?.imageUrl || '');
  const [placeImagePreviewError, setPlaceImagePreviewError] = useState(false);
  const [placeTradeOffers, setPlaceTradeOffers] = useState(
    initialData?.trade?.map(offer => ({ ...offer, id: generateFormId() })) || []
  );
  const [placeSubmitting, setPlaceSubmitting] = useState(false);
  const [placeSubmitError, setPlaceSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!placeSlugManuallyEdited) {
      setPlaceSlug(slugify(placeName));
    }
  }, [placeName, placeSlugManuallyEdited]);

  useEffect(() => {
    setPlaceImagePreviewError(false);
  }, [placeImageUrl]);

  const placeOwnersList = useMemo(() => parseOwners(placeOwnersInput), [placeOwnersInput]);
  const placeTagsList = useMemo(() => parseTags(placeTagsInput), [placeTagsInput]);

  const addTradeOffer = () => {
    setPlaceTradeOffers((prev) => [...prev, createTradeOffer()]);
  };

  const removeTradeOffer = (offerId: string) => {
    setPlaceTradeOffers((prev) => prev.filter((offer) => offer.id !== offerId));
  };

  const updateTradeItem = <K extends keyof any>(
    offerId: string,
    kind: 'gives' | 'wants',
    field: K,
    value: any[K]
  ) => {
    setPlaceTradeOffers((prev) =>
      prev.map((offer) => {
        if (offer.id !== offerId) {
          return offer;
        }
        return {
          ...offer,
          [kind]: {
            ...offer[kind],
            [field]: value,
          },
        };
      })
    );
  };

  const setOfferNegotiable = (offerId: string, negotiable: boolean) => {
    setPlaceTradeOffers((prev) =>
      prev.map((offer) => (offer.id === offerId ? { ...offer, negotiable } : offer))
    );
  };

  const handlePlaceSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (placeSubmitting) return;
    setPlaceSubmitError(null);

    if (!placeName.trim()) {
      setPlaceSubmitError('Le nom du lieu est requis.');
      return;
    }

    const targetSlug = slugify(placeSlugManuallyEdited ? placeSlug : placeName);
    if (!targetSlug) {
      setPlaceSubmitError('Veuillez renseigner un identifiant valide.');
      return;
    }

    const coords = parseCoordinateTriplet(placeCoords);
    if (!coords) {
      setPlaceSubmitError('Les coordonnées du lieu sont invalides.');
      return;
    }

    for (const offer of placeTradeOffers) {
      const givesId = offer.gives.item_id.trim();
      if (!givesId) {
        setPlaceSubmitError('Chaque offre doit préciser au moins un objet proposé.');
        return;
      }
      const givesQty = Number.parseInt(offer.gives.quantity, 10);
      if (!Number.isFinite(givesQty) || givesQty <= 0) {
        setPlaceSubmitError('La quantité proposée doit être un entier positif.');
        return;
      }

      if (!offer.negotiable) {
        const wantsId = offer.wants.item_id.trim();
        if (!wantsId) {
          setPlaceSubmitError('Précisez l\'objet demandé ou marquez l\'offre comme négociable.');
          return;
        }
        const wantsQty = Number.parseInt(offer.wants.quantity, 10);
        if (!Number.isFinite(wantsQty) || wantsQty <= 0) {
          setPlaceSubmitError('La quantité demandée doit être un entier positif.');
          return;
        }
      }
    }

    const tradeOffersPayload = placeTradeOffers.map((offer) => {
      const items: Prisma.TradeItemCreateManyOfferInput[] = [
        {
          kind: 'gives',
          itemId: offer.gives.item_id.trim(),
          quantity: Math.max(1, Number.parseInt(offer.gives.quantity, 10) || 1),
          enchanted: offer.gives.enchanted,
          customName: offer.gives.custom_name?.trim() || null,
        },
      ];

      if (!offer.negotiable && offer.wants.item_id.trim()) {
        items.push({
          kind: 'wants' as const,
          itemId: offer.wants.item_id.trim(),
          quantity: Math.max(1, Number.parseInt(offer.wants.quantity, 10) || 1),
          enchanted: offer.wants.enchanted,
          customName: offer.wants.custom_name?.trim() || null,
        });
      }

      return {
        negotiable: offer.negotiable,
        items,
      };
    });

    if (placeImageUrl.trim() && placeImagePreviewError) {
      setPlaceSubmitError('L\'aperçu de l\'image est invalide. Vérifiez l\'URL et essayez à nouveau.');
      return;
    }

    const payload = {
      slug: targetSlug,
      name: placeName.trim(),
      world: placeWorld,
      coordinates: coords,
      description: placeDescription.trim() || null,
      owners: placeOwnersList,
      tags: placeTagsList,
      discordUrl: placeDiscordUrl.trim() || null,
      imageUrl: placeImageUrl.trim() || null,
      tradeOffers: tradeOffersPayload,
    };

    setPlaceSubmitting(true);
    await onSubmit(payload);
    setPlaceSubmitting(false);
  };

  const renderOwnersInput = (
    value: string,
    setValue: (next: string) => void,
    placeholder = 'Doviculus22, spacenewbie'
  ) => (
    <div className="space-y-1">
      <label className={`text-xs font-medium ${themeColors.text.secondary}`}>Propriétaires (séparés par une virgule)</label>
      <textarea
        className={`${inputClass} resize-y min-h-[40px] leading-5`}
        placeholder={placeholder}
        value={value}
        rows={1}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault();
          }
        }}
        onChange={(event) => setValue(event.target.value.replace(/\n+/g, ', '))}
      />
    </div>
  );

  const renderCoordinateInputs = (
    coords: any,
    setCoords: React.Dispatch<React.SetStateAction<any>>,
    label?: string
  ) => (
    <div className="space-y-1">
      {label && <label className={`text-xs font-medium ${themeColors.text.secondary}`}>{label}</label>}
      <div className="grid grid-cols-3 gap-2">
        {(['x', 'y', 'z'] as Array<keyof any>).map((axis) => (
          <input
            key={axis}
            type="number"
            inputMode="numeric"
            className={inputClass}
            placeholder={axis.toUpperCase()}
            value={coords[axis]}
            onChange={(event) => setCoords((prev) => ({ ...prev, [axis]: event.target.value }))}
          />
        ))}
      </div>
    </div>
  );

  const renderTradeOffersSection = () => (
    <div className="space-y-3">
      <SubHeader
        title="Offres commerciales"
        description="Décrivez les échanges disponibles sur place pour les autres joueurs."
      />
      {placeTradeOffers.map((offer, index) => {
          const wantDisabled = offer.negotiable;
          const disabledClass = wantDisabled ? 'cursor-not-allowed opacity-60' : '';
          return (
            <div
              key={offer.id}
              className={`space-y-4 p-4 border ${themeColors.border.primary} ${themeColors.panel.secondary} ${themeColors.util.roundedLg}`}
            >
              <div className="flex items-center justify-between gap-3">
                <span className={`text-sm font-semibold ${themeColors.text.secondary}`}>Offre #{index + 1}</span>
                <button
                  type="button"
                  onClick={() => removeTradeOffer(offer.id)}
                  className="text-xs font-medium text-red-500 hover:text-red-400 transition-colors"
                >
                  Supprimer
                </button>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className={`text-xs font-medium ${themeColors.text.secondary}`}>Produit proposé</label>
                  <div className="flex items-center gap-2">
                    <input
                      className={inputClass}
                      placeholder="Minecraft ID (ex : bow)"
                      value={offer.gives.item_id}
                      onChange={(event) => updateTradeItem(offer.id, 'gives', 'item_id', event.target.value)}
                    />
                    <ItemVisualizer itemId={offer.gives.item_id} enchanted={offer.gives.enchanted} className="w-10 h-10 flex-shrink-0" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      className={inputClass}
                      type="number"
                      min={1}
                      inputMode="numeric"
                      placeholder="Quantité"
                      value={offer.gives.quantity}
                      onChange={(event) => updateTradeItem(offer.id, 'gives', 'quantity', event.target.value)}
                    />
                    <button
                      type="button"
                      aria-pressed={offer.gives.enchanted}
                      onClick={() => updateTradeItem(offer.id, 'gives', 'enchanted', !offer.gives.enchanted)}
                      className={`inline-flex items-center justify-center gap-2 text-xs font-medium px-3 py-1 ${themeColors.util.roundedLg} transition-colors duration-300 border ${
                        offer.gives.enchanted
                          ? 'bg-purple-100/60 dark:bg-purple-800/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-700'
                          : 'bg-gray-100/30 dark:bg-gray-700/15 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-200/40 dark:hover:bg-gray-600/20'
                      }`}
                    >
                      {offer.gives.enchanted ? 'Item enchanté' : 'Item non enchanté'}
                    </button>
                  </div>
                                      <input
                                        className={inputClass}
                                        placeholder="Nom personnalisé (facultatif)"
                                        value={offer.gives.custom_name || ''}
                                        onChange={(event) => updateTradeItem(offer.id, 'gives', 'custom_name', event.target.value)}
                                      />
                                    </div>
                  
                                  <div className="space-y-2">
                                    <label className={`text-xs font-medium ${themeColors.text.secondary}`}>Produit demandé</label>
                                    <div className="flex items-center gap-2">
                                      <input
                                        className={`${inputClass} ${disabledClass}`}
                                        placeholder="Minecraft ID (ex : diamond_block)"
                                        value={offer.wants.item_id}
                                        onChange={(event) => updateTradeItem(offer.id, 'wants', 'item_id', event.target.value)}
                                        disabled={wantDisabled}
                                      />
                                      <ItemVisualizer itemId={offer.wants.item_id} enchanted={offer.wants.enchanted} className="w-10 h-10 flex-shrink-0" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                      <input
                                        className={`${inputClass} ${disabledClass}`}
                                        type="number"
                                        min={1}
                                        inputMode="numeric"
                                        placeholder="Quantité"
                                        value={offer.wants.quantity}
                                        onChange={(event) => updateTradeItem(offer.id, 'wants', 'quantity', event.target.value)}
                                        disabled={wantDisabled}
                                      />
                                      <button
                                        type="button"
                                        aria-pressed={offer.wants.enchanted}
                                        onClick={() => updateTradeItem(offer.id, 'wants', 'enchanted', !offer.wants.enchanted)}
                                        disabled={wantDisabled}
                                        className={`inline-flex items-center justify-center gap-2 text-xs font-medium px-3 py-1 ${themeColors.util.roundedLg} transition-colors duration-300 border ${
                                          wantDisabled
                                            ? 'cursor-not-allowed opacity-60'
                                            : ''
                                        } ${
                                          offer.wants.enchanted
                                            ? 'bg-purple-100/60 dark:bg-purple-800/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-700'
                                            : 'bg-gray-100/30 dark:bg-gray-700/15 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-700 hover:bg-gray-200/40 dark:hover:bg-gray-600/20'
                                        }`}
                                      >
                                        {offer.wants.enchanted ? 'Item enchanté' : 'Item non enchanté'}
                                      </button>
                                    </div>
                                    <input
                                      className={`${inputClass} ${disabledClass}`}
                                      placeholder="Nom personnalisé (facultatif)"
                                      value={offer.wants.custom_name || ''}
                                      onChange={(event) => updateTradeItem(offer.id, 'wants', 'custom_name', event.target.value)}
                                      disabled={wantDisabled}
                                    />                  {offer.negotiable && (
                    <p className={`text-xs italic ${themeColors.text.tertiary}`}>
                      Cette offre sera affichée comme négociable, sans prix fixe.
                    </p>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setOfferNegotiable(offer.id, false)}
                  className={`px-3 py-1 text-xs rounded-full font-medium transition-colors duration-300 ${
                    !offer.negotiable
                      ? 'bg-blue-100/50 dark:bg-blue-800/20 text-blue-700 dark:text-blue-300'
                      : 'bg-gray-100/30 dark:bg-gray-700/15 text-gray-700 dark:text-gray-300 hover:bg-gray-200/40 dark:hover:bg-gray-600/20'
                  }`}
                >
                  Prix fixe
                </button>
                <button
                  type="button"
                  onClick={() => setOfferNegotiable(offer.id, true)}
                  className={`px-3 py-1 text-xs rounded-full font-medium transition-colors duration-300 ${
                    offer.negotiable
                      ? 'bg-blue-100/50 dark:bg-blue-800/20 text-blue-700 dark:text-blue-300'
                      : 'bg-gray-100/30 dark:bg-gray-700/15 text-gray-700 dark:text-gray-300 hover:bg-gray-200/40 dark:hover:bg-gray-600/20'
                  }`}
                >
                  Négociable
                </button>
              </div>
            </div>
          );
        })}
      <button
        type="button"
        onClick={addTradeOffer}
        className={`inline-flex items-center gap-2 px-3 py-1.5 text-sm border border-dashed ${themeColors.border.primary} ${themeColors.util.roundedLg} ${themeColors.transitionAll} text-gray-700 dark:text-gray-200 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-100/20 dark:hover:bg-blue-500/10`}
      >
        Ajouter une offre
      </button>
    </div>
  );

  return (
    <form className="space-y-5" onSubmit={handlePlaceSubmit}>
      <div className="space-y-4">
        <div className="space-y-1">
          <label className={`text-xs font-medium ${themeColors.text.secondary}`}>Nom du lieu</label>
          <input
            className={inputClass}
            value={placeName}
            onChange={(event) => setPlaceName(event.target.value)}
            placeholder="Marché impérial de Valnyfrost"
          />
        </div>

        <div className="space-y-1">
          <label className={`text-xs font-medium ${themeColors.text.secondary}`}>Identifiant (slug)</label>
          <input
            className={inputClass}
            value={placeSlugManuallyEdited ? placeSlug : slugify(placeName)}
            onChange={(event) => {
              setPlaceSlug(event.target.value);
              setPlaceSlugManuallyEdited(true);
            }}
            placeholder="valny-marche-imperial"
          />
        </div>

        {renderOwnersInput(placeOwnersInput, setPlaceOwnersInput, 'Doviculus22, spacenewbie')}

        <div className="space-y-1">
          <label className={`text-xs font-medium ${themeColors.text.secondary}`}>Tags (séparés par une virgule)</label>
          <textarea
            className={`${inputClass} resize-y min-h-[40px] leading-5`}
            value={placeTagsInput}
            rows={1}
            placeholder="valny, magasin"
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
              }
            }}
            onChange={(event) => setPlaceTagsInput(event.target.value.replace(/\n+/g, ', '))}
          />
        </div>

        <div className="space-y-1">
          <label className={`text-xs font-medium ${themeColors.text.secondary}`}>Description (optionnel)</label>
          <textarea
            className={`${inputClass} min-h-[80px] resize-y`}
            value={placeDescription}
            onChange={(event) => setPlaceDescription(event.target.value)}
            placeholder="Présentez rapidement votre lieu, ses services et comment y accéder."
          />
        </div>

        <div className="space-y-1">
          <label className={`text-xs font-medium ${themeColors.text.secondary}`}>Image (optionnel)</label>
          <input
            className={inputClass}
            value={placeImageUrl}
            onChange={(event) => setPlaceImageUrl(event.target.value)}
            placeholder="https://exemple.com/votre-image.png"
            inputMode="url"
          />
          {placeImageUrl && (
            <div className={`relative mt-2 overflow-hidden border ${themeColors.border.primary} ${themeColors.util.roundedLg} ${themeColors.panel.secondary} flex items-center justify-center max-w-xs`}>
              {!placeImagePreviewError ? (
                <img
                  src={placeImageUrl}
                  alt="Aperçu du lieu"
                  className="max-h-64 w-auto object-contain"
                  onError={() => setPlaceImagePreviewError(true)}
                />
              ) : (
                <div className="p-4 text-center text-xs text-red-500">
                  Impossible de charger cette image. Vérifiez l\'URL ou essayez une autre source.
                </div>
              )}
            </div>
          )}
        </div>

        <div className="space-y-1">
          <label className={`text-xs font-medium ${themeColors.text.secondary}`}>Lien Discord (optionnel)</label>
          <input
            className={inputClass}
            value={placeDiscordUrl}
            onChange={(event) => setPlaceDiscordUrl(event.target.value)}
            placeholder="https://discord.gg/votre-serveur"
            inputMode="url"
          />
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex flex-col gap-2 md:flex-row md:items-start md:gap-3">
          <div className="space-y-1 md:mr-3">
            <label className={`text-xs font-medium ${themeColors.text.secondary}`}>Monde</label>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => setPlaceWorld('overworld')}
                className={`px-3 py-1.5 text-sm ${themeColors.util.roundedFull} font-medium ${themeColors.transition} ${
                  placeWorld === 'overworld'
                    ? themeColors.world.overworld
                    : `${themeColors.button.ghost} ${themeColors.interactive.hover}`
                }`}
              >
                overworld
              </button>
              <button
                type="button"
                onClick={() => setPlaceWorld('nether')}
                className={`px-3 py-1.5 text-sm ${themeColors.util.roundedFull} font-medium ${themeColors.transition} ${
                  placeWorld === 'nether'
                    ? themeColors.world.nether
                    : `${themeColors.button.ghost} ${themeColors.interactive.hover}`
                }`}
              >
                nether
              </button>
            </div>
          </div>
          <div className="flex-1">
            {renderCoordinateInputs(placeCoords, setPlaceCoords, 'Coordonnées du lieu')}
          </div>
        </div>
        {renderTradeOffersSection()}
      </div>

      {placeSubmitError && (
        <div className={`text-sm ${themeColors.travelPlan.errorIcon}`}>{placeSubmitError}</div>
      )}

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className={`px-4 py-2 text-sm ${themeColors.util.roundedLg} border ${themeColors.border.primary} ${themeColors.transitionAll} text-gray-700 dark:text-gray-200 bg-transparent hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-100/20 dark:hover:bg-blue-500/10`}
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={placeSubmitting}
          className={`px-4 py-2 text-sm ${placeSubmitting ? themeColors.button.primaryDisabled : themeColors.button.primary} ${themeColors.util.roundedLg} ${themeColors.transitionAll}`}
        >
          {placeSubmitting
            ? (mode === 'add' ? 'Création…' : 'Modification…')
            : (mode === 'add' ? 'Créer le lieu' : 'Modifier le lieu')}
        </button>
      </div>
    </form>
  );
}
