'use client';

import { useState } from 'react';
import {
  MAX_CONTENT_IMAGE_URLS,
  normalizeContentImages,
} from '@/lib/content/images';
import { generateFormId, moveArrayItemById } from './form-utils';

export interface FormContentImage {
  id: string;
  url: string;
}

export interface ContentImagesController {
  hasInvalidImage: boolean;
  images: FormContentImage[];
  previewErrors: Record<string, boolean>;
  values: string[];
  add: () => string;
  markPreviewError: (imageId: string) => void;
  remove: (imageId: string) => void;
  reorder: (sourceId: string, targetId: string) => void;
  update: (imageId: string, url: string) => void;
}

export function useContentImages(
  initialImages?: Array<string | null | undefined> | null,
): ContentImagesController {
  const [images, setImages] = useState<FormContentImage[]>(() => (
    normalizeContentImages(initialImages).map(createContentImageInput)
  ));
  const [previewErrors, setPreviewErrors] = useState<Record<string, boolean>>({});

  const add = () => {
    const image = createContentImageInput();
    setImages((current) => (
      current.length >= MAX_CONTENT_IMAGE_URLS
        ? current
        : [...current, image]
    ));
    return image.id;
  };

  const remove = (imageId: string) => {
    setImages((current) => current.filter(({ id }) => id !== imageId));
    setPreviewErrors((current) => {
      const next = { ...current };
      delete next[imageId];
      return next;
    });
  };

  const update = (imageId: string, url: string) => {
    setImages((current) => current.map((image) => (
      image.id === imageId ? { ...image, url } : image
    )));
    setPreviewErrors((current) => ({ ...current, [imageId]: false }));
  };

  const values = normalizeContentImages(images.map(({ url }) => url));
  const hasInvalidImage = images.some(({ id, url }) => (
    Boolean(url.trim()) && previewErrors[id]
  ));

  return {
    hasInvalidImage,
    images,
    previewErrors,
    values,
    add,
    markPreviewError: (imageId) => setPreviewErrors((current) => ({
      ...current,
      [imageId]: true,
    })),
    remove,
    reorder: (sourceId, targetId) => setImages((current) => (
      moveArrayItemById(current, sourceId, targetId)
    )),
    update,
  };
}

function createContentImageInput(url = ''): FormContentImage {
  return { id: generateFormId(), url };
}
