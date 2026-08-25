import {
  ClaimPortalSchema,
  CreatePortalSchema,
  UpdatePortalSchema,
} from '@/app/api/utils/schemas';
import {
  claimPortalIdentity,
  createPortalIdentity,
  updatePortalIdentity,
} from '@/lib/portal/identity.server';

const singlePortal = {
  color: '#3B82F6',
  images: [],
  mode: 'single' as const,
  spaceId: null,
  portal: {
    world: 'overworld' as const,
    coordinates: { x: 120, y: 70, z: -80 },
  },
};

describe('portal schemas', () => {
  it('creates an unidentified portal with its generated technical slug', () => {
    const result = CreatePortalSchema.safeParse({
      ...singlePortal,
      identity: { status: 'unidentified', slug: 'portail-a7k9x' },
    });

    expect(result.success).toBe(true);
  });

  it('rejects a missing or malformed unidentified portal slug', () => {
    expect(CreatePortalSchema.safeParse({
      ...singlePortal,
      identity: { status: 'unidentified' },
    }).success).toBe(false);
    expect(CreatePortalSchema.safeParse({
      ...singlePortal,
      identity: { status: 'unidentified', slug: 'portail-inconnu' },
    }).success).toBe(false);
  });

  it('requires both the name and slug for an identified portal', () => {
    expect(CreatePortalSchema.safeParse({
      ...singlePortal,
      identity: { status: 'identified', name: 'Portail du marché' },
    }).success).toBe(false);

    expect(CreatePortalSchema.safeParse({
      ...singlePortal,
      identity: {
        status: 'identified',
        name: 'Portail du marché',
        slug: 'portail-marche',
      },
    }).success).toBe(true);
  });

  it('accepts later identification through the update contract', () => {
    expect(UpdatePortalSchema.safeParse({
      ...singlePortal,
      identity: {
        status: 'identified',
        name: 'Portail retrouvé',
        slug: 'portail-retrouve',
      },
    }).success).toBe(true);
  });

  it('accepts only a final identity when claiming a portal', () => {
    expect(ClaimPortalSchema.safeParse({
      ...singlePortal,
      identity: {
        status: 'identified',
        name: 'Portail retrouvé',
        slug: 'portail-a7k9x',
      },
      management: {
        managerIds: [],
        ownerNames: [],
        excludedOwnerUuids: [],
      },
    }).success).toBe(true);
    expect(ClaimPortalSchema.safeParse({
      ...singlePortal,
      identity: { status: 'unidentified', slug: 'portail-a7k9x' },
    }).success).toBe(false);
  });

  it('generates and preserves an unidentified technical identity', async () => {
    const tx = {
      portal: { findFirst: jest.fn().mockResolvedValue(null) },
    };
    const created = await createPortalIdentity(
      tx as never,
      { status: 'unidentified', slug: 'portail-a7k9x' },
    );

    expect(created).toEqual({
      name: null,
      slug: 'portail-a7k9x',
    });
    expect(updatePortalIdentity(created, {
      status: 'unidentified',
      slug: 'portail-a7k9x',
    }))
      .toEqual(created);
  });

  it('prevents an identified portal from becoming unidentified again', () => {
    expect(() => updatePortalIdentity(
      { name: 'Portail central', slug: 'portail-central' },
      { status: 'unidentified', slug: 'portail-a7k9x' },
    )).toThrow('Un portail identifié ne peut pas redevenir inconnu.');
  });

  it('preserves an unidentified portal technical slug during updates', () => {
    expect(() => updatePortalIdentity(
      { name: null, slug: 'portail-a7k9x' },
      { status: 'unidentified', slug: 'portail-b8m2q' },
    )).toThrow('L’identifiant technique d’un portail inconnu ne peut pas être modifié.');
  });

  it('claims every unidentified endpoint atomically', async () => {
    const tx = {
      portal: { updateMany: jest.fn().mockResolvedValue({ count: 2 }) },
    };

    await expect(claimPortalIdentity(
      tx as never,
      'entry-1',
      {
        status: 'identified',
        name: 'Portail retrouvé',
        slug: 'portail-a7k9x',
      },
      2,
    )).resolves.toEqual({
      name: 'Portail retrouvé',
      slug: 'portail-a7k9x',
    });
    expect(tx.portal.updateMany).toHaveBeenCalledWith({
      where: { mapEntryId: 'entry-1', name: null },
      data: { name: 'Portail retrouvé', slug: 'portail-a7k9x' },
    });
  });

  it('rejects a portal claimed by another request first', async () => {
    const tx = {
      portal: { updateMany: jest.fn().mockResolvedValue({ count: 0 }) },
    };

    await expect(claimPortalIdentity(
      tx as never,
      'entry-1',
      {
        status: 'identified',
        name: 'Portail retrouvé',
        slug: 'portail-a7k9x',
      },
      1,
    )).rejects.toMatchObject({ status: 409 });
  });
});
