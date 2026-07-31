import {
  CreateSpaceSchema,
  UpdateSpaceSchema,
} from '@/lib/spaces/schemas';

const input = {
  name: 'Valnyfrost',
  slug: 'valnyfrost',
  description: null,
  discordUrl: null,
  color: '#1F2A65',
  logoUrl: 'https://example.com/logo.png',
  managerIds: [],
};

describe('space schemas', () => {
  it('uses the fully contained logo framing by default', () => {
    expect(CreateSpaceSchema.parse(input)).toMatchObject({
      logoBackground: 'color',
      logoZoom: 1,
    });
  });

  it('accepts persisted logo display settings', () => {
    expect(UpdateSpaceSchema.parse({
      ...input,
      logoBackground: 'transparent',
      logoZoom: 2.25,
    })).toMatchObject({
      logoBackground: 'transparent',
      logoZoom: 2.25,
    });
  });

  it.each([0.95, 3.05])('rejects logo zoom %p outside the supported range', (
    logoZoom,
  ) => {
    expect(UpdateSpaceSchema.safeParse({
      ...input,
      logoZoom,
    }).success).toBe(false);
  });
});
