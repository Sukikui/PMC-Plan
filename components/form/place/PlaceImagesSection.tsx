'use client';

import { useState } from 'react';
import CrossIcon from '@/components/icons/CrossIcon';
import PlusIcon from '@/components/icons/PlusIcon';
import { imageUrlPlaceholder } from '@/components/form/common/form-placeholders';
import { formInputClassName } from '@/components/form/common/form-styles';
import { themeColors } from '@/lib/theme-colors';
import { MAX_PLACE_IMAGE_URLS } from '@/lib/place/images';
import type { FormPlaceImage } from './place-form-types';

interface PlaceImagesSectionProps {
  images: FormPlaceImage[];
  previewErrors: Record<string, boolean>;
  onAdd: () => string;
  onPreviewError: (imageId: string) => void;
  onRemove: (imageId: string) => void;
  onUpdate: (imageId: string, url: string) => void;
}

export default function PlaceImagesSection({
  images,
  previewErrors,
  onAdd,
  onPreviewError,
  onRemove,
  onUpdate,
}: PlaceImagesSectionProps) {
  const [selectedImageId, setSelectedImageId] = useState<string | null>(
    images[0]?.id ?? null,
  );
  const selectedImage = images.find((image) => image.id === selectedImageId) ?? null;
  const selectedIndex = selectedImage
    ? images.findIndex((image) => image.id === selectedImage.id)
    : -1;

  const addImage = () => {
    setSelectedImageId(onAdd());
  };

  const removeImage = (imageId: string) => {
    onRemove(imageId);
    if (selectedImageId === imageId) {
      setSelectedImageId(images.find((image) => image.id !== imageId)?.id ?? null);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <span className={`text-xs font-medium ${themeColors.text.secondary}`}>Images (optionnel)</span>
        <span className={`text-xs tabular-nums ${themeColors.text.tertiary}`}>
          {images.length}/{MAX_PLACE_IMAGE_URLS}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
        {images.map((image, index) => (
          <PlaceImageThumbnail
            key={image.id}
            image={image}
            index={index}
            hasPreviewError={Boolean(previewErrors[image.id])}
            selected={image.id === selectedImageId}
            onPreviewError={onPreviewError}
            onRemove={removeImage}
            onSelect={setSelectedImageId}
          />
        ))}

        {images.length < MAX_PLACE_IMAGE_URLS && (
          <button
            type="button"
            onClick={addImage}
            className={`flex aspect-[4/3] flex-col items-center justify-center gap-1 border border-dashed text-xs ${themeColors.util.roundedLg} ${themeColors.transitionAll} ${themeColors.form.dashedAction}`}
          >
            <PlusIcon className="h-5 w-5" />
            Ajouter
          </button>
        )}
      </div>

      {selectedImage && (
        <div>
          <label htmlFor={`place-image-${selectedImage.id}`} className="sr-only">
            URL de l&apos;image {selectedIndex + 1}
          </label>
          <input
            id={`place-image-${selectedImage.id}`}
            className={formInputClassName}
            value={selectedImage.url}
            onChange={(event) => onUpdate(selectedImage.id, event.target.value)}
            placeholder={selectedIndex === 0
              ? imageUrlPlaceholder('image-principale')
              : imageUrlPlaceholder('image-supplementaire')}
            inputMode="url"
          />
          {previewErrors[selectedImage.id] && (
            <p className={`mt-1 text-xs ${themeColors.feedback.errorText}`}>
              Impossible de charger cette image. Vérifiez son URL ou retirez-la.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function PlaceImageThumbnail({
  image,
  index,
  hasPreviewError,
  selected,
  onPreviewError,
  onRemove,
  onSelect,
}: {
  image: FormPlaceImage;
  index: number;
  hasPreviewError: boolean;
  selected: boolean;
  onPreviewError: (imageId: string) => void;
  onRemove: (imageId: string) => void;
  onSelect: (imageId: string) => void;
}) {
  const previewUrl = image.url.trim();
  const label = index === 0 ? 'Image principale' : `Image ${index + 1}`;

  return (
    <div className="group relative">
      <button
        type="button"
        aria-label={`Modifier ${label.toLowerCase()}`}
        aria-pressed={selected}
        onClick={() => onSelect(image.id)}
        className={`relative flex aspect-[4/3] w-full items-center justify-center overflow-hidden border-2 ${themeColors.util.roundedLg} ${themeColors.transitionAll} ${themeColors.interactive.focusRing} ${
          selected
            ? themeColors.selection.place.active
            : themeColors.form.imageThumbnailInactive
        }`}
      >
        {previewUrl && !hasPreviewError ? (
          <>
            <img
              src={previewUrl}
              alt=""
              className="h-full w-full object-cover"
              onError={() => onPreviewError(image.id)}
            />
            {index === 0 && (
              <span className={`absolute bottom-1.5 left-1.5 px-2 py-1 text-xs font-medium ${themeColors.util.roundedFull} ${themeColors.panel.tertiary} ${themeColors.blurSm} ${themeColors.text.secondary}`}>
                Principale
              </span>
            )}
          </>
        ) : (
          <span className={`px-2 text-center text-xs ${hasPreviewError ? themeColors.feedback.errorText : themeColors.text.tertiary}`}>
            {hasPreviewError ? 'URL invalide' : label}
          </span>
        )}
      </button>

      <button
        type="button"
        aria-label={`Supprimer ${label.toLowerCase()}`}
        onClick={() => onRemove(image.id)}
        className={`absolute right-1 top-1 flex h-6 w-6 items-center justify-center opacity-80 hover:opacity-100 ${themeColors.util.roundedFull} ${themeColors.panel.tertiary} ${themeColors.blurSm} ${themeColors.text.secondary} ${themeColors.interactive.hoverText} ${themeColors.transitionAll}`}
      >
        <CrossIcon className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
