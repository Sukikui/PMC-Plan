import type { ServiceInput } from './types';

type ServiceWriteInput = Omit<ServiceInput, 'management'>;

export function getServiceWriteData(input: ServiceWriteInput) {
  return {
    slug: input.slug.toLowerCase(),
    name: input.name,
    subtitle: input.subtitle,
    description: input.description,
    contactType: input.contactType,
    contactDiscordUrl: input.contactType === 'custom'
      ? input.contactDiscordUrl
      : null,
    illustrationItemId: input.illustrationItemId,
    paymentItemId: input.paymentItemId,
    paymentDescription: input.paymentDescription,
  };
}
