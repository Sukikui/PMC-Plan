import { z } from 'zod';

const APP_PREFERENCES_VERSION = 3;

const appThemeSchema = z.enum(['light', 'dark', 'system']);
export type AppTheme = z.infer<typeof appThemeSchema>;

const mapPreferencesV1Schema = z.object({
  zoomIconsEnabled: z.boolean(),
  imagePreviewsEnabled: z.boolean(),
  pointBorderLevel: z.number().int().min(0).max(3),
  translucentPointBorders: z.boolean(),
  pointSize: z.number().int().min(0).max(3),
  netherAxesEnabled: z.boolean(),
  zoomLabelsEnabled: z.boolean(),
}).strict();

const mapPreferencesV2Schema = mapPreferencesV1Schema.extend({
  pointerCoordinatesEnabled: z.boolean(),
});

const mapPreferencesSchema = mapPreferencesV2Schema.extend({
  dominantSpaceIndicatorEnabled: z.boolean(),
});

export type MapPreferences = z.infer<typeof mapPreferencesSchema>;

export const appPreferencesSchema = z.object({
  version: z.literal(APP_PREFERENCES_VERSION),
  theme: appThemeSchema,
  map: mapPreferencesSchema,
}).strict();

const appPreferencesV1Schema = z.object({
  version: z.literal(1),
  theme: appThemeSchema,
  map: mapPreferencesV1Schema,
}).strict();

const appPreferencesV2Schema = z.object({
  version: z.literal(2),
  theme: appThemeSchema,
  map: mapPreferencesV2Schema,
}).strict();

export type AppPreferences = z.infer<typeof appPreferencesSchema>;

export const DEFAULT_APP_PREFERENCES: AppPreferences = {
  version: APP_PREFERENCES_VERSION,
  theme: 'system',
  map: {
    zoomIconsEnabled: true,
    imagePreviewsEnabled: true,
    pointBorderLevel: 1,
    translucentPointBorders: true,
    pointSize: 1,
    netherAxesEnabled: true,
    zoomLabelsEnabled: false,
    pointerCoordinatesEnabled: false,
    dominantSpaceIndicatorEnabled: true,
  },
};

export function parseAppPreferences(value: unknown): AppPreferences | null {
  const parsed = appPreferencesSchema.safeParse(value);
  if (parsed.success) return parsed.data;

  const previousV2 = appPreferencesV2Schema.safeParse(value);
  if (previousV2.success) {
    return {
      ...previousV2.data,
      version: APP_PREFERENCES_VERSION,
      map: {
        ...previousV2.data.map,
        dominantSpaceIndicatorEnabled: true,
      },
    };
  }

  const previousV1 = appPreferencesV1Schema.safeParse(value);
  if (!previousV1.success) return null;
  return {
    ...previousV1.data,
    version: APP_PREFERENCES_VERSION,
    map: {
      ...previousV1.data.map,
      pointerCoordinatesEnabled: false,
      dominantSpaceIndicatorEnabled: true,
    },
  };
}

export function isAppTheme(value: unknown): value is AppTheme {
  return appThemeSchema.safeParse(value).success;
}

export function shouldUseDarkTheme(theme: AppTheme, systemPrefersDark: boolean) {
  return theme === 'dark' || (theme === 'system' && systemPrefersDark);
}
