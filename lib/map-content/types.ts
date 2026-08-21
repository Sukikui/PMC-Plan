import type { Place, Portal } from '@/lib/api/types';

export type PlaceSummary = Pick<
  Place,
  | 'address'
  | 'category'
  | 'color'
  | 'coordinates'
  | 'description'
  | 'id'
  | 'mapEntryId'
  | 'name'
  | 'space'
  | 'tags'
  | 'world'
> & {
  previewImage: string | null;
};

export type PortalSummary = Pick<
  Portal,
  | 'address'
  | 'color'
  | 'coordinates'
  | 'description'
  | 'id'
  | 'mapEntryId'
  | 'name'
  | 'nether-associate'
  | 'slug'
  | 'space'
  | 'world'
> & {
  previewImage: string | null;
};

export interface MapContentResponse {
  places: PlaceSummary[];
  portals: PortalSummary[];
}
