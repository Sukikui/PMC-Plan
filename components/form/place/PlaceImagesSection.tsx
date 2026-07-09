import { themeColors } from '@/lib/theme-colors';
import { MAX_PLACE_IMAGE_URLS } from '@/lib/place/images';
import type { FormPlaceImage } from './place-form-types';
import { placeFormInputClass } from './place-form-types';

interface PlaceImagesSectionProps {
  images: FormPlaceImage[];
  previewErrors: Record<string, boolean>;
  onAdd: () => void;
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
  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <label className={`text-xs font-medium ${themeColors.text.secondary}`}>Images (optionnel)</label>
        <p className={`text-xs ${themeColors.text.tertiary}`}>
          Jusqu&apos;à {MAX_PLACE_IMAGE_URLS} images. La première image renseignée sera utilisée comme aperçu principal.
        </p>
      </div>
      <div className="space-y-3">
        {images.map((image, index) => (
          <PlaceImageInput
            key={image.id}
            image={image}
            index={index}
            hasPreviewError={Boolean(previewErrors[image.id])}
            onPreviewError={onPreviewError}
            onRemove={onRemove}
            onUpdate={onUpdate}
          />
        ))}
      </div>
      <button
        type="button"
        onClick={onAdd}
        disabled={images.length >= MAX_PLACE_IMAGE_URLS}
        className={`inline-flex items-center gap-2 px-3 py-1.5 text-sm border border-dashed ${themeColors.util.roundedLg} ${themeColors.transitionAll} ${
          images.length >= MAX_PLACE_IMAGE_URLS
            ? themeColors.form.dashedActionDisabled
            : themeColors.form.dashedAction
        }`}
      >
        Ajouter une image
      </button>
    </div>
  );
}

function PlaceImageInput({
  image,
  index,
  hasPreviewError,
  onPreviewError,
  onRemove,
  onUpdate,
}: {
  image: FormPlaceImage;
  index: number;
  hasPreviewError: boolean;
  onPreviewError: (imageId: string) => void;
  onRemove: (imageId: string) => void;
  onUpdate: (imageId: string, url: string) => void;
}) {
  const previewUrl = image.url.trim();

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input
          className={placeFormInputClass}
          value={image.url}
          onChange={(event) => onUpdate(image.id, event.target.value)}
          placeholder={index === 0 ? 'https://exemple.com/votre-image.png' : 'https://exemple.com/image-supplementaire.png'}
          inputMode="url"
        />
        <button
          type="button"
          onClick={() => onRemove(image.id)}
          className={`shrink-0 px-3 py-2 text-sm ${themeColors.button.ghost} ${themeColors.util.roundedLg} ${themeColors.transitionAll}`}
        >
          Retirer
        </button>
      </div>
      {previewUrl && (
        <div className={`relative overflow-hidden border ${themeColors.border.primary} ${themeColors.util.roundedLg} ${themeColors.panel.secondary} flex items-center justify-center max-w-xs`}>
          {!hasPreviewError ? (
            <img
              src={previewUrl}
              alt={`Aperçu ${index + 1} du lieu`}
              className="max-h-64 w-auto object-contain"
              onError={() => onPreviewError(image.id)}
            />
          ) : (
            <div className={`p-4 text-center text-xs ${themeColors.feedback.errorText}`}>
              Impossible de charger cette image. Vérifiez l&apos;URL ou essayez une autre source.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
