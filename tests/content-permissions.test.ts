import {
  canAdministerContent,
  canContribute,
  canManageContent,
} from '@/lib/content-permissions';

describe('content permissions', () => {
  it('only allows approved user roles to contribute', () => {
    expect(canContribute(undefined)).toBe(false);
    expect(canContribute('pending')).toBe(false);
    expect(canContribute('user')).toBe(true);
    expect(canContribute('admin')).toBe(true);
    expect(canContribute('super_admin')).toBe(true);
  });

  it('allows approved managers and administrators to manage content', () => {
    const access = { primaryManagerId: 'primary', managerIds: ['manager'] };
    expect(canManageContent('pending', 'primary', access)).toBe(false);
    expect(canManageContent('user', 'primary', access)).toBe(true);
    expect(canManageContent('user', 'manager', access)).toBe(true);
    expect(canManageContent('user', 'other', access)).toBe(false);
    expect(canManageContent('admin', 'other', access)).toBe(true);
    expect(canManageContent('super_admin', 'other', access)).toBe(true);
  });

  it('reserves team changes and deletion for the primary manager or administrators', () => {
    expect(canAdministerContent('user', 'primary', 'primary')).toBe(true);
    expect(canAdministerContent('user', 'manager', 'primary')).toBe(false);
    expect(canAdministerContent('admin', 'other', 'primary')).toBe(true);
    expect(canAdministerContent('super_admin', 'other', 'primary')).toBe(true);
  });
});
