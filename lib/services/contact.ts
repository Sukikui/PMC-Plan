import type { ServiceContactType } from './types';

export function getServiceContactHref(
  contactType: ServiceContactType,
  contactDiscordUrl: string | null,
  primaryManagerDiscordId: string,
) {
  if (contactType === 'primary_manager') {
    return `https://discord.com/users/${primaryManagerDiscordId}`;
  }
  if (contactType === 'custom') {
    return contactDiscordUrl;
  }
  return null;
}
