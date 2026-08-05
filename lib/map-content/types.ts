import type { Place, Portal } from '@/lib/api/types';

export type PlaceSummary = Pick<
  Place,
  | 'address'
  | 'category'
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
  | 'coordinates'
  | 'description'
  | 'id'
  | 'mapEntryId'
  | 'name'
  | 'nether-associate'
  | 'slug'
  | 'space'
  | 'world'
>;

export interface MapContentResponse {
  places: PlaceSummary[];
  portals: PortalSummary[];
}
