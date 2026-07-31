'use client';

import React, { useState } from 'react';
import { createPlaceSnapshot } from '../common/form-change-detection';
import { generateFormId, parseCoordinateTriplet, type CoordinatesInput } from '../common/form-utils';
import { useEntityForm } from '../common/useEntityForm';
import { useFormSubmission } from '../common/useFormSubmission';
import FormActions from '../common/FormActions';
import CommonFields from '../common/CommonFields';
import FormSection from '../common/FormSection';
import SpaceAssociationField from '../association/SpaceAssociationField';
import TagInput from '../common/TagInput';
import { useExistingTags } from '../common/useExistingTags';
import { useNetherAddress } from '../nether/NetherAddressField';
import MapEntryManagementFields from '../management/MapEntryManagementFields';
import PlaceCategorySelector from './PlaceCategorySelector';
import PlaceImagesSection from './PlaceImagesSection';
import PlaceTradeOffersSection from './PlaceTradeOffersSection';
import PlaceDiscordField from './PlaceDiscordField';
import PlaceWorldFields from './PlaceWorldFields';
import {
  DEFAULT_PLACE_CATEGORY,
  isPlaceCategory,
  type PlaceCategory,
} from '@/lib/place/categories';
import { MAX_PLACE_IMAGE_URLS, normalizePlaceImages } from '@/lib/place/images';
import {
  emptyMapEntryDraft,
  getMapEntryDraftSnapshot,
  toMapEntryCreationPayload,
  toMapEntryUpdatePayload,
} from '@/lib/map-entry/types';
import {
  buildTradeOffersPayload,
  getTradeOffersValidationError,
} from './place-offer-payload';
import {
  blankCoords,
  createImageInput,
  createTradeOffer,
  type FormPlaceImage,
  type FormTradeItem,
  type FormTradeOffer,
  type InitialPlaceData,
  type PlaceFormPayload,
  type UpdateTradeOffer,
} from './place-form-types';
import type { SpaceReference } from '@/lib/spaces/types';

export type { InitialPlaceData, PlaceFormPayload } from './place-form-types';

interface PlaceFormProps {
  mode?: 'add' | 'edit';
  initialData?: InitialPlaceData;
  onSubmit: (payload: PlaceFormPayload) => Promise<void>;
  onCancel: () => void;
  onDelete?: () => Promise<void>;
}

export default function PlaceForm({
  mode = 'add',
  initialData,
  onSubmit,
  onCancel,
  onDelete,
}: PlaceFormProps) {
  const fields = useEntityForm(
    initialData?.name,
    initialData?.id,
    initialData?.description,
  );
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
  const [selectedSpace, setSelectedSpace] = useState<SpaceReference | null>(
    initialData?.space ?? null,
  );
  const [placeDiscordUrl, setPlaceDiscordUrl] = useState(
    initialData?.discordOverride
      ?? (initialData?.space ? '' : initialData?.discord ?? ''),
  );
  const [discordOverrideEnabled, setDiscordOverrideEnabled] = useState(
    Boolean(initialData?.discordOverride) || !initialData?.space?.discordUrl,
  );
  const [placeImageInputs, setPlaceImageInputs] = useState<FormPlaceImage[]>(() => {
    const images = normalizePlaceImages(initialData?.images);
    return images.map((url) => createImageInput(url));
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
  const [managementDraft, setManagementDraft] = useState(emptyMapEntryDraft);
  const [managementReady, setManagementReady] = useState(mode === 'add');
  const discordOverrideUrl = selectedSpace?.discordUrl && !discordOverrideEnabled
    ? null
    : placeDiscordUrl.trim() || null;
  const snapshot = {
    ...createPlaceSnapshot({
      address: placeAddress.value,
      category: placeCategory,
      coordinates: placeCoords,
      description: fields.description,
      discordUrl: discordOverrideUrl ?? '',
      images: placeImageInputs,
      name: fields.name,
      offers: placeTradeOffers,
      slugSource: fields.input.slug,
      spaceId: selectedSpace?.id ?? null,
      tags: placeTags,
      world: placeWorld,
    }),
    management: getMapEntryDraftSnapshot(managementDraft),
  };
  const parsedCoords = parseCoordinateTriplet(placeCoords);
  const hasInvalidImage = placeImageInputs.some((image) => (
    image.url.trim() && placeImagePreviewErrors[image.id]
  ));
  const tradeOffersError = getTradeOffersValidationError(placeTradeOffers);
  const submission = useFormSubmission({
    isReady: managementReady,
    isValid: fields.isValid
      && parsedCoords !== null
      && !hasInvalidImage
      && tradeOffersError === null,
    mode,
    snapshot,
  });

  const updatePlaceImageUrl = (imageId: string, url: string) => {
    setPlaceImageInputs((prev) => prev.map((image) => image.id === imageId ? { ...image, url } : image));
    setPlaceImagePreviewErrors((prev) => ({ ...prev, [imageId]: false }));
  };

  const addPlaceImage = () => {
    const image = createImageInput();
    setPlaceImageInputs((prev) => (
      prev.length >= MAX_PLACE_IMAGE_URLS ? prev : [...prev, image]
    ));
    return image.id;
  };

  const removePlaceImage = (imageId: string) => {
    setPlaceImageInputs((prev) => prev.filter((image) => image.id !== imageId));
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

  const updateTradeOffer: UpdateTradeOffer = (offerId, field, value) => {
    setPlaceTradeOffers((prev) => prev.map((offer) => (
      offer.id === offerId ? { ...offer, [field]: value } : offer
    )));
  };

  const handlePlaceSubmit = async (event: React.FormEvent) => {
    await submission.submit(event, () => onSubmit(buildPlacePayload()));
  };

  const changeSpace = (space: SpaceReference | null) => {
    setSelectedSpace(space);
    if (!space?.discordUrl) {
      setDiscordOverrideEnabled(true);
    } else if (!placeDiscordUrl.trim()) {
      setDiscordOverrideEnabled(false);
    }
  };

  const buildPlacePayload = (): PlaceFormPayload => {
    if (!parsedCoords) {
      throw new Error('Les coordonnées du lieu sont invalides.');
    }

    const images = normalizePlaceImages(placeImageInputs.map((image) => image.url));
    if (hasInvalidImage) {
      throw new Error(
        'L’aperçu d’une image est invalide. Vérifiez l’URL ou retirez l’image concernée.',
      );
    }

    return {
      slug: fields.input.slug,
      name: fields.input.name,
      world: placeWorld,
      category: placeCategory,
      coordinates: parsedCoords,
      description: fields.input.description || null,
      address: placeWorld === 'nether' ? (placeAddress.value.trim() || null) : null,
      tags: placeTags,
      discordUrl: discordOverrideUrl,
      spaceId: selectedSpace?.id ?? null,
      images,
      management: mode === 'add'
        ? toMapEntryCreationPayload(managementDraft)
        : toMapEntryUpdatePayload(managementDraft),
      tradeOffers: buildTradeOffersPayload(placeTradeOffers),
    };
  };

  const handlePlaceDelete = async () => {
    if (!onDelete) return;
    await submission.execute(onDelete);
  };

  return (
    <form className="space-y-5" onSubmit={handlePlaceSubmit}>
      <FormSection title="Informations générales">
        <CommonFields
          afterSlug={(
            <>
              <SpaceAssociationField
                disabled={submission.isSubmitting}
                onChange={changeSpace}
                value={selectedSpace}
              />
              <PlaceDiscordField
                disabled={submission.isSubmitting}
                onModeChange={setDiscordOverrideEnabled}
                onValueChange={setPlaceDiscordUrl}
                overrideEnabled={discordOverrideEnabled}
                space={selectedSpace}
                value={placeDiscordUrl}
              />
            </>
          )}
          descriptionPlaceholder="Présentez rapidement votre lieu, ses services et comment y accéder."
          disabled={submission.isSubmitting}
          form={fields}
          namePlaceholder="Marché impérial de Valnyfrost"
          slugPlaceholder="valny-marche-imperial"
        />
      </FormSection>

      <FormSection title="Gestion">
        <MapEntryManagementFields
          disabled={submission.isSubmitting}
          mapEntryId={initialData?.mapEntryId}
          mode={mode}
          draft={managementDraft}
          onDraftChange={setManagementDraft}
          onReadyChange={setManagementReady}
        />
      </FormSection>

      <FormSection title="Présentation">
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
      </FormSection>

      <FormSection title="Localisation">
        <PlaceWorldFields
          address={placeAddress}
          coords={placeCoords}
          setCoords={setPlaceCoords}
          world={placeWorld}
          setWorld={setPlaceWorld}
        />
      </FormSection>
      <PlaceTradeOffersSection
        offers={placeTradeOffers}
        onAdd={() => {
          const offer = createTradeOffer();
          setPlaceTradeOffers((prev) => [...prev, offer]);
          return offer.id;
        }}
        onRemove={(offerId) => setPlaceTradeOffers((prev) => prev.filter((offer) => offer.id !== offerId))}
        onUpdateOffer={updateTradeOffer}
        onUpdateItem={updateTradeItem}
      />

      <FormActions
        canSubmit={submission.canSubmit}
        error={submission.error}
        onCancel={onCancel}
        isSubmitting={submission.isSubmitting}
        mode={mode}
        onDelete={mode === 'edit' && onDelete ? handlePlaceDelete : undefined}
        entityType="place"
        entitySlug={initialData?.id || ''}
      />
    </form>
  );
}
