export const CONTENT_FIELD_LIMITS = {
  name: 40,
  slug: 40,
  description: 2000,
  shortText: 100,
  customName: 200,
  discordUrl: 256,
} as const;

export const CONTENT_MANAGEMENT_LIMITS = {
  managers: 20,
  owners: 20,
} as const;
