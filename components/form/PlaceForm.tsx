'use client';

import React, { useMemo, useState } from 'react';
import { themeColors } from '@/lib/theme-colors';
import ItemVisualizer from '@/components/trade/ItemVisualizer';
import { slugify, parseCoordinateTriplet, renderCoordinateInputs, CoordinatesInput, SubHeader, parseTags, generateFormId } from './form-utils';
import { TradeOffer as SharedTradeOffer, TradeItem as SharedTradeItem } from '@/app/api/utils/shared';
import { useEntityForm } from './useEntityForm';
import FormActions from './FormActions';
import CommonFields from './CommonFields';

const inputClass = `${themeColors.input.search} border ${themeColors.util.roundedLg} px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 ${themeColors.transition} ${themeColors.placeholder}`;

const createTradeItem = (): FormTradeItem => ({
  item_id: '',
  quantity: '',
  custom_name: null,
  enchanted: false,
});

const createTradeOffer = (): FormTradeOffer => ({
  id: generateFormId(),
  gives: createTradeItem(),
  wants: createTradeItem(),
  negotiable: false,
});

const blankCoords = { x: '', y: '', z: '' };

interface FormTradeItem extends Omit<SharedTradeItem, 'quantity'> {
  quantity: string | number;
}

interface FormTradeOffer extends Omit<SharedTradeOffer, 'gives' | 'wants'> {
  id: string;
  gives: FormTradeItem;
  wants: FormTradeItem;
}

export interface InitialPlaceData {
  type: 'place';
  name: string;
  id: string;
  world: string;
  coordinates: { x: number; y: number; z: number };
  owners?: string[];
  tags?: string[];
  description?: string;
  discord?: string | null;
  imageUrl?: string;
  trade?: FormTradeOffer[] | null;
}

export interface PlaceFormPayload {
  slug: string;
  name: string;
  world: 'overworld' | 'nether';
  coordinates: { x: number; y: number; z: number };
  description: string | null;
  owners: string[];
  tags: string[];
  discordUrl: string | null;
  imageUrl: string | null;
  tradeOffers: Array<{
    negotiable: boolean;
    items: Array<{
      kind: 'gives' | 'wants';
      itemId: string;
      quantity: number;
      enchanted: boolean;
      customName: string | null;
    }>;
  }>;
}

interface PlaceFormProps {
  mode?: 'add' | 'edit';
  initialData?: InitialPlaceData;
  onSubmit: (payload: PlaceFormPayload) => Promise<void>;
  onCancel: () => void;
}

export default function PlaceForm({ mode = 'add', initialData, onSubmit, onCancel }: PlaceFormProps) {
  const { name, setName, slug, setSlug, slugManuallyEdited, setSlugManuallyEdited, ownersInput, setOwnersInput, ownersList, description, setDescription } = useEntityForm(initialData?.name, initialData?.id, initialData?.owners, initialData?.description);
  const [placeWorld, setPlaceWorld] = useState<'overworld' | 'nether'>(initialData?.world === 'nether' ? 'nether' : 'overworld');
  const [placeCoords, setPlaceCoords] = useState<CoordinatesInput>(initialData?.coordinates ? { x: String(initialData.coordinates.x), y: String(initialData.coordinates.y), z: String(initialData.coordinates.z) } : blankCoords);
  const [placeTagsInput, setPlaceTagsInput] = useState(initialData?.tags?.join(', ') || '');
  const [placeDiscordUrl, setPlaceDiscordUrl] = useState(initialData?.discord || '');
  const [placeImageUrl, setPlaceImageUrl] = useState(initialData?.imageUrl || '');
  const [placeImagePreviewError, setPlaceImagePreviewError] = useState(false);
  const [placeTradeOffers, setPlaceTradeOffers] = useState<FormTradeOffer[]>(
    initialData?.trade?.map(offer => ({
      ...offer,
      id: generateFormId(),
      gives: { ...offer.gives, quantity: String(offer.gives.quantity), custom_name: offer.gives.custom_name ?? null },
      wants: { ...offer.wants, quantity: String(offer.wants.quantity), custom_name: offer.wants.custom_name ?? null },
    })) || []
  );
  const [placeSubmitting, setPlaceSubmitting] = useState(false);
  const [placeSubmitError, setPlaceSubmitError] = useState<string | null>(null);


  const placeTagsList = useMemo(() => parseTags(placeTagsInput), [placeTagsInput]);

  const addTradeOffer = () => {
    setPlaceTradeOffers((prev) => [...prev, createTradeOffer()]);
  };

  const removeTradeOffer = (offerId: string) => {
    setPlaceTradeOffers((prev) => prev.filter((offer) => offer.id !== offerId));
  };

  const updateTradeItem = <K extends keyof FormTradeItem>(
    offerId: string,
    kind: 'gives' | 'wants',
    field: K,
    value: FormTradeItem[K]
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

    if (!name.trim()) {
      setPlaceSubmitError('Le nom du lieu est requis.');
      return;
    }

    const targetSlug = slugify(slugManuallyEdited ? slug : name);
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
      const givesQty = Number.parseInt(String(offer.gives.quantity), 10);
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
        const wantsQty = Number.parseInt(String(offer.wants.quantity), 10);
        if (!Number.isFinite(wantsQty) || wantsQty <= 0) {
          setPlaceSubmitError('La quantité demandée doit être un entier positif.');
          return;
        }
      }
    }

    const tradeOffersPayload: PlaceFormPayload['tradeOffers'] = placeTradeOffers.map((offer) => {
      const items: {
        kind: 'gives' | 'wants';
        itemId: string;
        quantity: number;
        enchanted: boolean;
        customName: string | null;
      }[] = [
        {
          kind: 'gives',
          itemId: offer.gives.item_id.trim(),
          quantity: Math.max(1, Number.parseInt(String(offer.gives.quantity), 10) || 1),
          enchanted: offer.gives.enchanted,
          customName: offer.gives.custom_name?.trim() || null,
        },
      ];

      if (!offer.negotiable && offer.wants.item_id.trim()) {
        items.push({
          kind: 'wants',
          itemId: offer.wants.item_id.trim(),
          quantity: Math.max(1, Number.parseInt(String(offer.wants.quantity), 10) || 1),
          enchanted: offer.wants.enchanted,
          customName: offer.wants.custom_name?.trim() || null,
        });
      }

      return {
        negotiable: offer.negotiable ?? false,
        items,
      };
    });

    if (placeImageUrl.trim() && placeImagePreviewError) {
      setPlaceSubmitError('L\'aperçu de l\'image est invalide. Vérifiez l\'URL et essayez à nouveau.');
      return;
    }

    const payload = {
      slug: targetSlug,
      name: name.trim(),
      world: placeWorld,
      coordinates: coords,
      description: description.trim() || null,
      owners: ownersList,
      tags: placeTagsList,
      discordUrl: placeDiscordUrl.trim() || null,
      imageUrl: placeImageUrl.trim() || null,
      tradeOffers: tradeOffersPayload,
    };

    setPlaceSubmitting(true);
    await onSubmit(payload);
    setPlaceSubmitting(false);
  };



  const handlePlaceDelete = async () => {
    if (!initialData?.id) return;

    setPlaceSubmitting(true);
    try {
      const response = await fetch(`/api/places/${initialData.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la suppression du lieu.');
      }

      onCancel(); // Close the form after successful deletion
    } catch (error: unknown) {
      setPlaceSubmitError(error instanceof Error ? error.message : 'An unknown error occurred');
    } finally {
      setPlaceSubmitting(false);
    }
  };

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
                      }`}                    >
                      {offer.gives.enchanted ? 'Item enchanté' : 'Item non enchanté'}
                    </button>
                  </div>
                                      <input
                                        className={inputClass}
                                        placeholder="Nom personnalisé (facultatif)"
                                        value={offer.gives.custom_name ?? ''}
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
                                      value={offer.wants.custom_name ?? ''}
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
      <CommonFields
        name={name}
        setName={setName}
        slug={slug}
        setSlug={setSlug}
        slugManuallyEdited={slugManuallyEdited}
        setSlugManuallyEdited={setSlugManuallyEdited}
        ownersInput={ownersInput}
        setOwnersInput={setOwnersInput}
        description={description}
        setDescription={setDescription}
        namePlaceholder="Marché impérial de Valnyfrost"
        slugPlaceholder="valny-marche-imperial"
      />

      <div className="space-y-4">
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
                  Impossible de charger cette image. Vérifiez l&apos;URL ou essayez une autre source.
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

      <FormActions
        onCancel={onCancel}
        isSubmitting={placeSubmitting}
        submitText={mode === 'add' ? 'Créer le lieu' : 'Modifier le lieu'}
        submittingText={mode === 'add' ? 'Création…' : 'Modification…'}
        onDelete={mode === 'edit' ? handlePlaceDelete : undefined}
        entityType="place"
        entitySlug={initialData?.id || ''}
      />
    </form>
  );
}