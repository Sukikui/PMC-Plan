export const queryKeys = {
  mapContent: ['map-content'] as const,
  mapEntryDetail: (type: 'place' | 'portal', mapEntryId: string) => (
    ['map-entry-detail', type, mapEntryId] as const
  ),
  marketOffers: (query: string) => ['market-offers', query] as const,
  serviceDetail: (slug: string) => ['service-detail', slug] as const,
  serviceList: (query: string, contact: string) => (
    ['service-list', query, contact] as const
  ),
  spaceDetail: (slug: string) => ['space-detail', slug] as const,
  spaceList: (query: string) => ['space-list', query] as const,
  spaceReferences: (role?: string) => ['space-references', role] as const,
};
