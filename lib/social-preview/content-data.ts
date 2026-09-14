import type { Place, Portal } from '@/lib/api/types';
import type { PublicContentType } from '@/lib/content-path';
import {
  loadPlaceDetailBySlug,
  loadPortalDetailBySlug,
} from '@/lib/map-content/detail-server';
import type { SpaceSummary } from '@/lib/spaces/types';
import { loadSpaceSummaryBySlug } from '@/lib/spaces/summary-server';

export type SocialPreviewContent =
  | { type: 'place'; value: Place }
  | { type: 'portal'; value: Portal }
  | { type: 'space'; value: SpaceSummary };

export async function loadSocialPreviewContent(
  type: PublicContentType,
  slug: string,
): Promise<SocialPreviewContent | null> {
  if (type === 'place') {
    const value = await loadPlaceDetailBySlug(slug);
    return value ? { type, value } : null;
  }
  if (type === 'portal') {
    const value = await loadPortalDetailBySlug(slug);
    return value ? { type, value } : null;
  }
  const value = await loadSpaceSummaryBySlug(slug);
  return value ? { type, value } : null;
}
