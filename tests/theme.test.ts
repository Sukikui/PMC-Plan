import { isAppTheme, shouldUseDarkTheme } from '@/lib/use-theme';

describe('theme resolution', () => {
  it('validates only supported persisted themes', () => {
    expect(isAppTheme('light')).toBe(true);
    expect(isAppTheme('dark')).toBe(true);
    expect(isAppTheme('system')).toBe(true);
    expect(isAppTheme('auto')).toBe(false);
    expect(isAppTheme(null)).toBe(false);
  });

  it('uses the OS preference only in system mode', () => {
    expect(shouldUseDarkTheme('system', true)).toBe(true);
    expect(shouldUseDarkTheme('system', false)).toBe(false);
    expect(shouldUseDarkTheme('dark', false)).toBe(true);
    expect(shouldUseDarkTheme('light', true)).toBe(false);
  });
});
