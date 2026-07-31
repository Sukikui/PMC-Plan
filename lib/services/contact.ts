import type { Service } from './types';

export function getServiceContactHref(
  service: Pick<
    Service,
    'contactDiscordUrl' | 'contactType' | 'primaryManager'
  >,
) {
  if (service.contactType === 'primary_manager') {
    return `https://discord.com/users/${service.primaryManager.id}`;
  }
  if (service.contactType === 'custom') {
    return service.contactDiscordUrl;
  }
  return null;
}
