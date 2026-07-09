export type PlaceCategory = 'construction' | 'commerce' | 'zone_communautaire' | 'ferme';
export type MapIconCategory = PlaceCategory | 'portail';

export const DEFAULT_PLACE_CATEGORY: PlaceCategory = 'construction';
export const PLACE_CATEGORIES = ['construction', 'commerce', 'zone_communautaire', 'ferme'] as const;

export const placeCategoryOptions: Array<{
  value: PlaceCategory;
  label: string;
  description: string;
}> = [
  {
    value: 'construction',
    label: 'Construction',
    description: 'Base, quartier ou bâtiment quelconque.',
  },
  {
    value: 'commerce',
    label: 'Commerce',
    description: 'Magasin ou service marchand.',
  },
  {
    value: 'zone_communautaire',
    label: 'Zone communautaire',
    description: 'Évènement ou zone de vie du serveur.',
  },
  {
    value: 'ferme',
    label: 'Ferme',
    description: 'Production, farm ou zone de récolte.',
  },
];

export const mapIconByCategory: Record<MapIconCategory, string> = {
  construction: '/map/icons/construction_icon.png',
  commerce: '/map/icons/commerce_icon.png',
  zone_communautaire: '/map/icons/zone_communautaire_icon.png',
  ferme: '/map/icons/ferme_icon.png',
  portail: '/map/icons/portail_icon.png',
} as const;

export const getMapIconSrc = (category: MapIconCategory) => mapIconByCategory[category];

export const isPlaceCategory = (value: string): value is PlaceCategory =>
  placeCategoryOptions.some((option) => option.value === value);

export const getPlaceCategoryLabel = (category: PlaceCategory) =>
  placeCategoryOptions.find((option) => option.value === category)?.label ?? category;

export const getPlaceCategoryFromTags = (tags: string[] = []): PlaceCategory => {
  const normalizedTags = tags.map((tag) => tag.trim().toLowerCase());

  if (normalizedTags.includes('magasin')) {
    return 'commerce';
  }

  if (normalizedTags.includes('ferme')) {
    return 'ferme';
  }

  if (normalizedTags.includes('public')) {
    return 'zone_communautaire';
  }

  return DEFAULT_PLACE_CATEGORY;
};
