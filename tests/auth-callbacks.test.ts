import { authCallbacks } from '@/lib/auth/callbacks';
import { prisma } from '@/lib/prisma';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));

const mockedPrisma = prisma as unknown as {
  user: {
    findUnique: jest.Mock;
    update: jest.Mock;
  };
};
const jwtCallback = authCallbacks.jwt as (params: Record<string, unknown>) => Promise<any>;
const sessionCallback = authCallbacks.session as (params: Record<string, unknown>) => Promise<any>;

describe('Auth.js callbacks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('refreshes the current role from the database', async () => {
    mockedPrisma.user.findUnique.mockResolvedValue({ role: 'user' });

    const token = await jwtCallback({
      token: { id: 'user-1', role: 'admin' },
      user: undefined,
      account: null,
      profile: undefined,
    });

    expect(mockedPrisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      select: { role: true },
    });
    expect(token.role).toBe('user');
  });

  it('synchronizes Discord identity fields when a user signs in', async () => {
    mockedPrisma.user.update.mockResolvedValue({ id: 'user-1' });

    const token = await jwtCallback({
      token: {},
      user: {
        id: 'user-1',
        role: 'admin',
        username: 'old-name',
        name: 'Old Name',
        image: null,
      },
      account: { provider: 'discord' },
      profile: {
        id: 'discord-1',
        username: 'new-name',
        global_name: 'New Name',
        avatar: 'avatar-hash',
      },
    });

    expect(mockedPrisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: {
        username: 'new-name',
        name: 'New Name',
        image: 'https://cdn.discordapp.com/avatars/discord-1/avatar-hash.png',
      },
    });
    expect(token).toMatchObject({
      id: 'user-1',
      role: 'admin',
      username: 'new-name',
      globalName: 'New Name',
      name: 'New Name',
      picture: 'https://cdn.discordapp.com/avatars/discord-1/avatar-hash.png',
    });
  });

  it('hydrates the public session from the JWT', async () => {
    const session = await sessionCallback({
      session: { user: { name: 'New Name' }, expires: '2099-01-01' },
      token: {
        id: 'user-1',
        role: 'admin',
        username: 'new-name',
        globalName: 'New Name',
        picture: 'https://example.com/avatar.png',
      },
    });

    expect(session.user).toEqual({
      name: 'New Name',
      id: 'user-1',
      role: 'admin',
      username: 'new-name',
      globalName: 'New Name',
      image: 'https://example.com/avatar.png',
    });
  });
});
