import { updateMapEntryPresentation } from '@/lib/map-entry/presentation';

const tx = {
  mapEntry: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  space: {
    findUnique: jest.fn(),
  },
};
const actor = { userId: 'primary-user', role: 'user' };

describe('map-entry presentation', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('updates the color, gallery, and managed space together', async () => {
    tx.mapEntry.findUnique.mockResolvedValue({ spaceId: null });
    tx.space.findUnique.mockResolvedValue({
      primaryManagerId: 'primary-user',
      managers: [],
    });

    await updateMapEntryPresentation(tx as never, 'entry-1', actor, {
      color: '#1F2A65',
      images: ['https://example.com/portal.png'],
      spaceId: 'space-1',
    });

    expect(tx.mapEntry.update).toHaveBeenCalledWith({
      where: { id: 'entry-1' },
      data: {
        color: '#1F2A65',
        images: ['https://example.com/portal.png'],
        spaceId: 'space-1',
        lastEditorId: 'primary-user',
      },
    });
  });

  it('preserves omitted presentation fields', async () => {
    tx.mapEntry.findUnique.mockResolvedValue({ spaceId: 'space-1' });

    await updateMapEntryPresentation(tx as never, 'entry-1', actor, {
      spaceId: 'space-1',
    });

    expect(tx.mapEntry.update).toHaveBeenCalledWith({
      where: { id: 'entry-1' },
      data: {
        lastEditorId: 'primary-user',
        spaceId: 'space-1',
      },
    });
  });

  it('rejects association with a space the actor cannot manage', async () => {
    tx.mapEntry.findUnique.mockResolvedValue({ spaceId: null });
    tx.space.findUnique.mockResolvedValue({
      primaryManagerId: 'another-user',
      managers: [],
    });

    await expect(updateMapEntryPresentation(
      tx as never,
      'entry-1',
      actor,
      { color: '#1F2A65', spaceId: 'space-1' },
    )).rejects.toMatchObject({ status: 403 });
    expect(tx.mapEntry.update).not.toHaveBeenCalled();
  });
});
