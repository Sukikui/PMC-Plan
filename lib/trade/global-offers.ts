import type { Place, TradeOffer } from '@/lib/api/types';

export interface GlobalOffer {
  offer: TradeOffer;
  place: Pick<Place, 'id' | 'name' | 'owners' | 'space'>;
}

export function flattenPlaceOffers(places: Place[]): GlobalOffer[] {
  return places.flatMap((place) => (
    place.trade?.map((offer) => ({
      offer,
      place: {
        id: place.id,
        name: place.name,
        owners: place.owners ?? [],
        space: place.space,
      },
    })) ?? []
  ));
}

export function filterGlobalOffers(
  offers: GlobalOffer[],
  query: string,
) {
  const normalizedQuery = normalizeSearch(query);
  if (!normalizedQuery) return offers;

  return offers.filter(({ offer, place }) => [
    offer.gives.item_id,
    offer.wants.item_id,
    offer.gives.custom_name,
    offer.wants.custom_name,
    offer.description,
    place.name,
    place.space?.name,
    ...place.owners.map(({ name }) => name),
  ].some((value) => normalizeSearch(value).includes(normalizedQuery)));
}

function normalizeSearch(value?: string | null) {
  return value?.toLocaleLowerCase('fr').replace(/\s+/g, '') ?? '';
}
