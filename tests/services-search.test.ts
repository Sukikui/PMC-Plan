import { filterServices } from '@/lib/services/search';
import type { Service } from '@/lib/services/types';

const services = [{
  id: 'redstone',
  slug: 'redstone',
  name: 'SukSukRedstone',
  subtitle: 'Création de systèmes redstone',
  description: 'Automatisation de fermes',
  contactType: 'none',
  contactDiscordUrl: null,
  illustrationItemId: 'minecraft:repeater',
  paymentItemId: 'minecraft:emerald',
  paymentDescription: 'Tarif selon la complexité',
  owners: [{ uuid: 'uuid-1', name: 'Suki' }],
}] as Service[];

describe('service search', () => {
  it.each([
    'redstone',
    'suksukredstone',
    'automatisation',
    'repeater',
    'emerald',
    'complexité',
    'suki',
  ])('finds a service by "%s"', (query) => {
    expect(filterServices(services, query)).toEqual(services);
  });

  it('returns no unrelated service', () => {
    expect(filterServices(services, 'architecture')).toEqual([]);
  });
});
