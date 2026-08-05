import type { Place, TradeOffer } from '@/lib/api/types';

export interface GlobalOffer {
  offer: TradeOffer;
  place: Pick<Place, 'id' | 'name' | 'owners' | 'space'>;
}
