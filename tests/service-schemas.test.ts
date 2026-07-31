import {
  createServiceSchema,
  updateServiceSchema,
} from '@/lib/services/schemas';

const creationInput = {
  name: 'SukSukRedstone',
  subtitle: 'Création de systèmes redstone',
  slug: 'suksukredstone',
  description: 'Conception et installation de systèmes sur mesure.',
  contactType: 'none',
  contactDiscordUrl: null,
  illustrationItemId: 'minecraft:repeater',
  paymentItemId: 'minecraft:emerald',
  paymentDescription: 'Tarif selon la complexité du projet.',
  management: {
    managerIds: [],
    ownerNames: ['Suki'],
    excludedOwnerUuids: [],
  },
};

describe('service schemas', () => {
  it('normalizes optional presentation fields', () => {
    expect(createServiceSchema.parse({
      ...creationInput,
      illustrationItemId: ' ',
      paymentItemId: ' ',
      paymentDescription: ' ',
    })).toMatchObject({
      contactDiscordUrl: null,
      illustrationItemId: null,
      paymentItemId: null,
      paymentDescription: null,
    });
  });

  it('requires a Discord URL only for a custom contact', () => {
    expect(createServiceSchema.safeParse({
      ...creationInput,
      contactType: 'custom',
    }).success).toBe(false);
    expect(createServiceSchema.safeParse({
      ...creationInput,
      contactType: 'custom',
      contactDiscordUrl: 'https://discord.gg/example',
    }).success).toBe(true);
    expect(createServiceSchema.safeParse({
      ...creationInput,
      contactType: 'primary_manager',
    }).success).toBe(true);
  });

  it('requires a full service description', () => {
    expect(createServiceSchema.safeParse({
      ...creationInput,
      description: ' ',
    }).success).toBe(false);
  });

  it('accepts persisted providers during an update', () => {
    expect(updateServiceSchema.safeParse({
      ...creationInput,
      management: {
        managerIds: [],
        owners: [{
          uuid: '7d2159e8-1051-4c3e-b504-c279cadd4273',
          name: 'Suki',
        }],
        excludedOwnerUuids: [],
        primaryManagerId: 'user-1',
      },
    }).success).toBe(true);
  });
});
