import type { Service } from './types';

export function filterServices(services: Service[], query: string) {
  const normalizedQuery = normalizeSearch(query);
  if (!normalizedQuery) return services;

  return services.filter((service) => [
    service.name,
    service.subtitle,
    service.slug,
    service.description,
    service.illustrationItemId,
    service.paymentItemId,
    service.paymentDescription,
    ...service.owners.map(({ name }) => name),
  ].some((value) => normalizeSearch(value).includes(normalizedQuery)));
}

function normalizeSearch(value?: string | null) {
  return value?.toLocaleLowerCase('fr').replace(/\s+/g, '') ?? '';
}
