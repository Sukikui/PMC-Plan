import {
  toMapEntryEditor,
  toMapEntryPrimaryManager,
  toMinecraftOwners,
} from '@/lib/map-entry/serialization';

describe('map entry serialization', () => {
  it('places the primary manager linked profile first when it is an owner', () => {
    const entry = createEntry('primary-uuid');

    expect(toMinecraftOwners(entry as never).map(({ uuid }) => uuid)).toEqual([
      'primary-uuid',
      'owner-a',
      'owner-b',
    ]);
  });

  it('preserves owner order when the primary manager is not an owner', () => {
    const entry = createEntry('unlisted-uuid');

    expect(toMinecraftOwners(entry as never).map(({ uuid }) => uuid)).toEqual([
      'owner-a',
      'primary-uuid',
      'owner-b',
    ]);
  });

  it('does not expose the linked profile through public manager identities', () => {
    const entry = createEntry('primary-uuid');

    expect(toMapEntryPrimaryManager(entry as never)).toEqual({
      id: 'primary-user',
      image: null,
      name: 'Primary',
      username: 'primary',
    });
    expect(toMapEntryEditor(entry as never)).not.toHaveProperty(
      'minecraftProfile',
    );
  });
});

function createEntry(primaryProfileUuid: string) {
  return {
    id: 'entry-1',
    primaryManagerId: 'primary-user',
    updatedAt: new Date('2026-07-29T12:00:00.000Z'),
    primaryManager: {
      id: 'primary-user',
      image: null,
      name: 'Primary',
      username: 'primary',
      minecraftProfile: {
        uuid: primaryProfileUuid,
        name: 'PrimaryMC',
      },
    },
    lastEditor: null,
    managers: [],
    owners: [
      { profile: { uuid: 'owner-a', name: 'Owner A' } },
      { profile: { uuid: 'primary-uuid', name: 'Primary MC' } },
      { profile: { uuid: 'owner-b', name: 'Owner B' } },
    ],
    space: null,
  };
}
