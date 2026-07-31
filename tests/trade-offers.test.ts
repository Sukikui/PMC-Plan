import { buildTradeOffersCreateData } from '../app/api/utils/trade-offers';
import { toTradeOffer } from '../app/api/utils/shared/trade';

const itemInput = {
  kind: 'gives' as const,
  itemId: 'diamond',
  quantity: 4,
  enchanted: false,
  customName: null,
};

describe('trade offer descriptions', () => {
  it('normalizes descriptions before persistence', () => {
    const [offer] = buildTradeOffersCreateData([{
      negotiable: false,
      description: '  Offre limitée  ',
      items: [
        itemInput,
        { ...itemInput, kind: 'wants', itemId: 'emerald' },
      ],
    }]);

    expect(offer.description).toBe('Offre limitée');
  });

  it('stores empty descriptions as null', () => {
    const [offer] = buildTradeOffersCreateData([{
      negotiable: true,
      description: '   ',
      items: [itemInput],
    }]);

    expect(offer.description).toBeNull();
  });

  it('exposes the persisted description in public offers', () => {
    const now = new Date();
    const offer = toTradeOffer({
      uid: 'offer-1',
      placeUid: 'place-1',
      negotiable: false,
      description: 'Remise pour les achats groupés.',
      createdAt: now,
      updatedAt: now,
      items: [
        {
          uid: 'item-1',
          offerUid: 'offer-1',
          kind: 'gives',
          itemId: 'diamond',
          quantity: 4,
          enchanted: false,
          customName: null,
          createdAt: now,
          updatedAt: now,
        },
        {
          uid: 'item-2',
          offerUid: 'offer-1',
          kind: 'wants',
          itemId: 'emerald',
          quantity: 8,
          enchanted: false,
          customName: null,
          createdAt: now,
          updatedAt: now,
        },
      ],
    });

    expect(offer?.description).toBe('Remise pour les achats groupés.');
  });
});
