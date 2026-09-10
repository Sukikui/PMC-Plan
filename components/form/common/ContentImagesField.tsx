'use client';

import { useState, type DragEvent } from 'react';
import CrossIcon from '@/components/icons/CrossIcon';
import PlusIcon from '@/components/icons/PlusIcon';
import { ImageHostingHint } from '@/components/form/common/FormHint';
import { imageUrlPlaceholder } from '@/components/form/common/form-placeholders';
import { formInputClassName } from '@/components/form/common/form-styles';
import { themeColors } from '@/lib/theme-colors';
import { MAX_CONTENT_IMAGE_URLS } from '@/lib/content/images';
import type {
  ContentImagesController,
  FormContentImage,
} from './useContentImages';

interface ContentImagesFieldProps {
  controller: ContentImagesController;
  reorderable: boolean;
}

export default function ContentImagesField({
  controller,
  reorderable,
}: ContentImagesFieldProps) {
  const {
    images,
    previewErrors,
    add,
    markPreviewError,
    remove,
    reorder,
    update,
  } = controller;
  const [selectedImageId, setSelectedImageId] = useState<string | null>(
    images[0]?.id ?? null,
  );
  const [draggedImageId, setDraggedImageId] = useState<string | null>(null);
  const [dropTargetImageId, setDropTargetImageId] = useState<string | null>(null);
  const selectedImage = images.find((image) => image.id === selectedImageId) ?? null;
  const selectedIndex = selectedImage
    ? images.findIndex((image) => image.id === selectedImage.id)
    : -1;

  const addImage = () => {
    setSelectedImageId(add());
  };

  const removeImage = (imageId: string) => {
    remove(imageId);
    if (selectedImageId === imageId) {
      setSelectedImageId(images.find((image) => image.id !== imageId)?.id ?? null);
    }
  };

  const endDrag = () => {
    setDraggedImageId(null);
    setDropTargetImageId(null);
  };

  const startDrag = (event: DragEvent<HTMLDivElement>, imageId: string) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const dragPreview = event.currentTarget.cloneNode(true) as HTMLElement;
    Object.assign(dragPreview.style, {
      height: `${bounds.height}px`,
      left: '-10000px',
      opacity: '1',
      pointerEvents: 'none',
      position: 'fixed',
      top: '-10000px',
      transform: 'none',
      width: `${bounds.width}px`,
    });
    document.body.appendChild(dragPreview);
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', imageId);
    event.dataTransfer.setDragImage(
      dragPreview,
      event.clientX - bounds.left,
      event.clientY - bounds.top,
    );
    requestAnimationFrame(() => dragPreview.remove());
    setDraggedImageId(imageId);
  };

  const dragOver = (event: DragEvent<HTMLDivElement>, imageId: string) => {
    if (!draggedImageId || draggedImageId === imageId) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    setDropTargetImageId(imageId);
  };

  const drop = (event: DragEvent<HTMLDivElement>, targetId: string) => {
    event.preventDefault();
    const sourceId = draggedImageId ?? event.dataTransfer.getData('text/plain');
    if (sourceId && sourceId !== targetId) reorder(sourceId, targetId);
    endDrag();
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <span className={`text-xs font-medium ${themeColors.text.secondary}`}>Images (optionnel)</span>
        <span className={`text-xs tabular-nums ${themeColors.text.tertiary}`}>
          {images.length}/{MAX_CONTENT_IMAGE_URLS}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
        {images.map((image, index) => (
          <ContentImageThumbnail
            key={image.id}
            image={image}
            index={index}
            hasPreviewError={Boolean(previewErrors[image.id])}
            selected={image.id === selectedImageId}
            dragging={image.id === draggedImageId}
            dropTarget={image.id === dropTargetImageId}
            draggable={reorderable && images.length > 1}
            onDragEnd={endDrag}
            onDragOver={dragOver}
            onDragStart={startDrag}
            onDrop={drop}
            onPreviewError={markPreviewError}
            onRemove={removeImage}
            onSelect={setSelectedImageId}
          />
        ))}

        {images.length < MAX_CONTENT_IMAGE_URLS && (
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
          <label htmlFor={`content-image-${selectedImage.id}`} className="sr-only">
            URL de l&apos;image {selectedIndex + 1}
          </label>
          <input
            id={`content-image-${selectedImage.id}`}
            className={formInputClassName}
            value={selectedImage.url}
            onChange={(event) => update(selectedImage.id, event.target.value)}
            placeholder={selectedIndex === 0
              ? imageUrlPlaceholder('image-principale')
              : imageUrlPlaceholder('image-supplementaire')}
            inputMode="url"
          />
          <ImageHostingHint className="mt-2" />
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

function ContentImageThumbnail({
  image,
  index,
  hasPreviewError,
  selected,
  dragging,
  dropTarget,
  draggable,
  onDragEnd,
  onDragOver,
  onDragStart,
  onDrop,
  onPreviewError,
  onRemove,
  onSelect,
}: {
  image: FormContentImage;
  index: number;
  hasPreviewError: boolean;
  selected: boolean;
  dragging: boolean;
  dropTarget: boolean;
  draggable: boolean;
  onDragEnd: () => void;
  onDragOver: (event: DragEvent<HTMLDivElement>, imageId: string) => void;
  onDragStart: (event: DragEvent<HTMLDivElement>, imageId: string) => void;
  onDrop: (event: DragEvent<HTMLDivElement>, imageId: string) => void;
  onPreviewError: (imageId: string) => void;
  onRemove: (imageId: string) => void;
  onSelect: (imageId: string) => void;
}) {
  const previewUrl = image.url.trim();
  const label = index === 0 ? 'Image principale' : `Image ${index + 1}`;

  return (
    <div
      className={`group relative ${themeColors.util.roundedLg} ${themeColors.transitionAll} ${
        draggable ? 'cursor-grab active:cursor-grabbing' : ''
      } ${dragging ? 'scale-95 opacity-50' : ''} ${
        dropTarget ? `${themeColors.selection.place.halo} scale-[1.02]` : ''
      }`}
      draggable={draggable}
      onDragEnd={onDragEnd}
      onDragOver={(event) => onDragOver(event, image.id)}
      onDragStart={(event) => onDragStart(event, image.id)}
      onDrop={(event) => onDrop(event, image.id)}
      title={draggable ? `Déplacer ${label.toLowerCase()}` : undefined}
    >
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
        {previewUrl && !hasPreviewError && !dragging ? (
          <>
            <img
              src={previewUrl}
              alt=""
              draggable={false}
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
