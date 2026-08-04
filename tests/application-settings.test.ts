import { prisma } from '@/lib/prisma';
import {
  getApplicationSettings,
  getInitialUserRole,
  saveApplicationSettings,
} from '@/lib/admin/application-settings-service';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    applicationSettings: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
  },
}));

const mockedPrisma = prisma as unknown as {
  applicationSettings: {
    findUnique: jest.Mock;
    upsert: jest.Mock;
  };
};

describe('application settings service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('uses manual approval when no settings row exists', async () => {
    mockedPrisma.applicationSettings.findUnique.mockResolvedValue(null);

    await expect(getApplicationSettings()).resolves.toEqual({
      automaticUserApproval: false,
    });
  });

  it('persists the global approval setting', async () => {
    mockedPrisma.applicationSettings.upsert.mockResolvedValue({
      automaticUserApproval: true,
    });

    await expect(saveApplicationSettings({ automaticUserApproval: true }))
      .resolves.toEqual({ automaticUserApproval: true });
    expect(mockedPrisma.applicationSettings.upsert).toHaveBeenCalledWith({
      where: { id: 'global' },
      create: { id: 'global', automaticUserApproval: true },
      update: { automaticUserApproval: true },
      select: { automaticUserApproval: true },
    });
  });

  it('returns the pending role in manual mode', async () => {
    mockedPrisma.applicationSettings.findUnique.mockResolvedValue({
      automaticUserApproval: false,
    });

    await expect(getInitialUserRole()).resolves.toBe('pending');
  });

  it('returns the user role in automatic mode', async () => {
    mockedPrisma.applicationSettings.findUnique.mockResolvedValue({
      automaticUserApproval: true,
    });
    await expect(getInitialUserRole()).resolves.toBe('user');
  });
});
