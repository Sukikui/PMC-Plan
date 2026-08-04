import { prisma } from '@/lib/prisma';
import {
  applyApprovalPolicyToCreatedUser,
  getApplicationSettings,
  saveApplicationSettings,
} from '@/lib/admin/application-settings-service';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    applicationSettings: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
    user: {
      update: jest.fn(),
    },
  },
}));

const mockedPrisma = prisma as unknown as {
  applicationSettings: {
    findUnique: jest.Mock;
    upsert: jest.Mock;
  };
  user: { update: jest.Mock };
};

const pendingUser = {
  id: 'user-1',
  email: 'user@example.com',
  emailVerified: null,
  image: null,
  name: 'Suki',
  role: 'pending' as const,
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

  it('keeps newly created users pending in manual mode', async () => {
    mockedPrisma.applicationSettings.findUnique.mockResolvedValue({
      automaticUserApproval: false,
    });

    await expect(applyApprovalPolicyToCreatedUser(pendingUser))
      .resolves.toBe(pendingUser);
    expect(mockedPrisma.user.update).not.toHaveBeenCalled();
  });

  it('approves newly created users in automatic mode', async () => {
    const approvedUser = { ...pendingUser, role: 'user' as const };
    mockedPrisma.applicationSettings.findUnique.mockResolvedValue({
      automaticUserApproval: true,
    });
    mockedPrisma.user.update.mockResolvedValue(approvedUser);

    await expect(applyApprovalPolicyToCreatedUser(pendingUser))
      .resolves.toEqual(approvedUser);
    expect(mockedPrisma.user.update).toHaveBeenCalledWith({
      where: { id: pendingUser.id },
      data: { role: 'user' },
      select: { role: true },
    });
  });
});
