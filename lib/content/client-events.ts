'use client';

import type { ContentManagementType } from '@/lib/content-management/types';

const CONTENT_UPDATED_EVENT = 'pmc:content-updated';

export type ContentUpdateType = ContentManagementType | 'all';

export function notifyContentUpdated(type: ContentUpdateType) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(CONTENT_UPDATED_EVENT, {
    detail: { type },
  }));
}

export function subscribeToContentUpdates(
  listener: (type: ContentUpdateType) => void,
) {
  if (typeof window === 'undefined') return () => {};

  const handleUpdate = (event: Event) => {
    const { type } = (event as CustomEvent<{ type: ContentUpdateType }>).detail;
    listener(type);
  };
  window.addEventListener(CONTENT_UPDATED_EVENT, handleUpdate);
  return () => window.removeEventListener(CONTENT_UPDATED_EVENT, handleUpdate);
}
