'use client';

import React, { useState } from 'react';
import { themeColors } from '@/lib/theme-colors';
import { generateFormId, slugify, parseCoordinateTriplet, type CoordinatesInput } from '../common/form-utils';
import { useEntityForm } from '../common/useEntityForm';
import FormActions from '../common/FormActions';
import CommonFields from '../common/CommonFields';
import TagInput from '../common/TagInput';
import { useExistingTags } from '../common/useExistingTags';
import { useNetherAddress } from '../nether/NetherAddressField';
import PlaceCategorySelector from './PlaceCategorySelector';
import PlaceImagesSection from './PlaceImagesSection';
import PlaceTradeOffersSection from './PlaceTradeOffersSection';
import PlaceWorldFields from './PlaceWorldFields';
import {
  DEFAULT_PLACE_CATEGORY,
  isPlaceCategory,
  type PlaceCategory,
} from '@/lib/place/categories';
import { MAX_PLACE_IMAGE_URLS, normalizePlaceImages } from '@/lib/place/images';
import {
  blankCoords,
  createImageInput,
  createTradeOffer,
  type FormPlaceImage,
  type FormTradeItem,
  type FormTradeOffer,
  type InitialPlaceData,
  type PlaceFormPayload,
} from './place-form-types';

export type { InitialPlaceData, PlaceFormPayload } from './place-form-types';

interface PlaceFormProps {
  mode?: 'add' | 'edit';
  initialData?: InitialPlaceData;
  onSubmit: (payload: PlaceFormPayload) => Promise<void>;
  onCancel: () => void;
}

export default function PlaceForm({ mode = 'add', initialData, onSubmit, onCancel }: PlaceFormProps) {
  const { name, setName, slug, setSlug, slugManuallyEdited, setSlugManuallyEdited, ownersInput, setOwnersInput, ownersList, description, setDescription } = useEntityForm(initialData?.name, initialData?.id, initialData?.owners, initialData?.description);
  const [placeWorld, setPlaceWorld] = useState<'overworld' | 'nether'>(initialData?.world === 'nether' ? 'nether' : 'overworld');
  const [placeCategory, setPlaceCategory] = useState<PlaceCategory>(
    initialData?.category && isPlaceCategory(initialData.category)
      ? initialData.category
      : DEFAULT_PLACE_CATEGORY
  );
  const [placeCoords, setPlaceCoords] = useState<CoordinatesInput>(initialData?.coordinates ? {
    x: String(initialData.coordinates.x),
    y: String(initialData.coordinates.y),
    z: String(initialData.coordinates.z),
  } : blankCoords);
  const placeAddress = useNetherAddress({
    enabled: placeWorld === 'nether',
    coords: placeCoords,
    initialValue: initialData?.address,
  });
  const [placeTags, setPlaceTags] = useState<string[]>(
    initialData?.tags?.map((tag) => tag.trim()).filter((tag) => tag.length > 0) || []
  );
  const { suggestions: existingTags } = useExistingTags();
  const [placeDiscordUrl, setPlaceDiscordUrl] = useState(initialData?.discord || '');
  const [placeImageInputs, setPlaceImageInputs] = useState<FormPlaceImage[]>(() => {
    const images = normalizePlaceImages(initialData?.images);
    return images.length > 0 ? images.map((url) => createImageInput(url)) : [createImageInput()];
  });
  const [placeImagePreviewErrors, setPlaceImagePreviewErrors] = useState<Record<string, boolean>>({});
  const [placeTradeOffers, setPlaceTradeOffers] = useState<FormTradeOffer[]>(
    initialData?.trade?.map((offer) => ({
      ...offer,
      id: generateFormId(),
      gives: { ...offer.gives, quantity: String(offer.gives.quantity), custom_name: offer.gives.custom_name ?? null },
      wants: { ...offer.wants, quantity: String(offer.wants.quantity), custom_name: offer.wants.custom_name ?? null },
    })) || []
  );
  const [placeSubmitting, setPlaceSubmitting] = useState(false);
  const [placeSubmitError, setPlaceSubmitError] = useState<string | null>(null);

  const updatePlaceImageUrl = (imageId: string, url: string) => {
    setPlaceImageInputs((prev) => prev.map((image) => image.id === imageId ? { ...image, url } : image));
    setPlaceImagePreviewErrors((prev) => ({ ...prev, [imageId]: false }));
  };

  const addPlaceImage = () => {
    setPlaceImageInputs((prev) => (
      prev.length >= MAX_PLACE_IMAGE_URLS ? prev : [...prev, createImageInput()]
    ));
  };

  const removePlaceImage = (imageId: string) => {
    setPlaceImageInputs((prev) => (
      prev.length === 1 ? [createImageInput()] : prev.filter((image) => image.id !== imageId)
    ));
    setPlaceImagePreviewErrors((prev) => {
      const next = { ...prev };
      delete next[imageId];
      return next;
    });
  };

  const updateTradeItem = <K extends keyof FormTradeItem>(
    offerId: string,
    kind: 'gives' | 'wants',
    field: K,
    value: FormTradeItem[K]
  ) => {
    setPlaceTradeOffers((prev) => prev.map((offer) => (
      offer.id === offerId
        ? { ...offer, [kind]: { ...offer[kind], [field]: value } }
        : offer
    )));
  };

  const handlePlaceSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (placeSubmitting) return;
    setPlaceSubmitError(null);

    const formPayload = buildPlacePayload();
    if (!formPayload) return;

    setPlaceSubmitting(true);
    await onSubmit(formPayload);
    setPlaceSubmitting(false);
  };

  const buildPlacePayload = (): PlaceFormPayload | null => {
    if (!name.trim()) {
      setPlaceSubmitError('Le nom du lieu est requis.');
      return null;
    }

    const targetSlug = slugify(slugManuallyEdited ? slug : name);
    if (!targetSlug) {
      setPlaceSubmitError('Veuillez renseigner un identifiant valide.');
      return null;
    }

    const coords = parseCoordinateTriplet(placeCoords);
    if (!coords) {
      setPlaceSubmitError('Les coordonnées du lieu sont invalides.');
      return null;
    }

    const tradeOffersPayload = buildTradeOffersPayload(placeTradeOffers, setPlaceSubmitError);
    if (!tradeOffersPayload) return null;

    const images = normalizePlaceImages(placeImageInputs.map((image) => image.url));
    const hasInvalidImagePreview = placeImageInputs.some((image) =>
      image.url.trim() && placeImagePreviewErrors[image.id]
    );
    if (hasInvalidImagePreview) {
      setPlaceSubmitError('L\'aperçu d\'une image est invalide. Vérifiez l\'URL ou retirez l\'image concernée.');
      return null;
    }

    return {
      slug: targetSlug,
      name: name.trim(),
      world: placeWorld,
      category: placeCategory,
      coordinates: coords,
      description: description.trim() || null,
      address: placeWorld === 'nether' ? (placeAddress.value.trim() || null) : null,
      owners: ownersList,
      tags: placeTags,
      discordUrl: placeDiscordUrl.trim() || null,
      images,
      tradeOffers: tradeOffersPayload,
    };
  };

  const handlePlaceDelete = async () => {
    if (!initialData?.id) return;

    setPlaceSubmitting(true);
    try {
      const response = await fetch(`/api/places/${initialData.id}`, { method: 'DELETE' });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la suppression du lieu.');
      }
      onCancel();
    } catch (error: unknown) {
      setPlaceSubmitError(error instanceof Error ? error.message : 'An unknown error occurred');
    } finally {
      setPlaceSubmitting(false);
    }
  };

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
        <PlaceCategorySelector value={placeCategory} onChange={setPlaceCategory} />
        <TagInput
          label="Tags"
          placeholder="Ajouter un tag..."
          value={placeTags}
          onChange={setPlaceTags}
          suggestions={existingTags}
        />
        <PlaceImagesSection
          images={placeImageInputs}
          previewErrors={placeImagePreviewErrors}
          onAdd={addPlaceImage}
          onPreviewError={(imageId) => setPlaceImagePreviewErrors((prev) => ({ ...prev, [imageId]: true }))}
          onRemove={removePlaceImage}
          onUpdate={updatePlaceImageUrl}
        />
        <div className="space-y-1">
          <label className={`text-xs font-medium ${themeColors.text.secondary}`}>Lien Discord (optionnel)</label>
          <input
            className={`${themeColors.input.search} border ${themeColors.util.roundedLg} px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 ${themeColors.transition} ${themeColors.placeholder}`}
            value={placeDiscordUrl}
            onChange={(event) => setPlaceDiscordUrl(event.target.value)}
            placeholder="https://discord.gg/votre-serveur"
            inputMode="url"
          />
        </div>
      </div>

      <PlaceWorldFields
        address={placeAddress}
        coords={placeCoords}
        setCoords={setPlaceCoords}
        world={placeWorld}
        setWorld={setPlaceWorld}
      />
      <PlaceTradeOffersSection
        offers={placeTradeOffers}
        onAdd={() => setPlaceTradeOffers((prev) => [...prev, createTradeOffer()])}
        onRemove={(offerId) => setPlaceTradeOffers((prev) => prev.filter((offer) => offer.id !== offerId))}
        onSetNegotiable={(offerId, negotiable) => {
          setPlaceTradeOffers((prev) => prev.map((offer) => offer.id === offerId ? { ...offer, negotiable } : offer));
        }}
        onUpdateItem={updateTradeItem}
      />

      {placeSubmitError && (
        <div className={`text-sm ${themeColors.feedback.errorText}`}>{placeSubmitError}</div>
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

function buildTradeOffersPayload(
  offers: FormTradeOffer[],
  setError: (message: string) => void
): PlaceFormPayload['tradeOffers'] | null {
  for (const offer of offers) {
    const givesId = offer.gives.item_id.trim();
    const givesQty = Number.parseInt(String(offer.gives.quantity), 10);
    if (!givesId) {
      setError('Chaque offre doit préciser au moins un objet proposé.');
      return null;
    }
    if (!Number.isFinite(givesQty) || givesQty <= 0) {
      setError('La quantité proposée doit être un entier positif.');
      return null;
    }

    if (!offer.negotiable) {
      const wantsId = offer.wants.item_id.trim();
      const wantsQty = Number.parseInt(String(offer.wants.quantity), 10);
      if (!wantsId) {
        setError('Précisez l\'objet demandé ou marquez l\'offre comme négociable.');
        return null;
      }
      if (!Number.isFinite(wantsQty) || wantsQty <= 0) {
        setError('La quantité demandée doit être un entier positif.');
        return null;
      }
    }
  }

  return offers.map((offer) => ({
    negotiable: offer.negotiable ?? false,
    items: [
      {
        kind: 'gives',
        itemId: offer.gives.item_id.trim(),
        quantity: Math.max(1, Number.parseInt(String(offer.gives.quantity), 10) || 1),
        enchanted: offer.gives.enchanted,
        customName: offer.gives.custom_name?.trim() || null,
      },
      ...(!offer.negotiable && offer.wants.item_id.trim()
        ? [{
            kind: 'wants' as const,
            itemId: offer.wants.item_id.trim(),
            quantity: Math.max(1, Number.parseInt(String(offer.wants.quantity), 10) || 1),
            enchanted: offer.wants.enchanted,
            customName: offer.wants.custom_name?.trim() || null,
          }]
        : []),
    ],
  }));
}
