import { requestJson } from '@/lib/api-client';
import { createCachedList } from '@/lib/client/cached-list';
import type {
  Service,
  ServiceInput,
  ServiceResponse,
  ServicesResponse,
} from './types';

const services = createCachedList<Service>({
  eventName: 'pmc-plan:services-invalidated',
  load: async () => {
    const payload = await requestJson<ServicesResponse>(
      '/api/services',
      { cache: 'no-store' },
      'Impossible de charger les services.',
    );
    return payload.services;
  },
});

export const fetchServices = services.fetchAll;
export const subscribeToServicesInvalidation = services.subscribe;

export async function fetchService(slug: string) {
  const payload = await requestJson<ServiceResponse>(
    `/api/services/${encodeURIComponent(slug)}`,
    { cache: 'no-store' },
    'Impossible de charger ce service.',
  );
  return payload.service;
}

export async function createServiceRequest(input: ServiceInput) {
  return sendServiceRequest('/api/services', 'POST', input);
}

export async function updateServiceRequest(
  slug: string,
  input: ServiceInput,
) {
  return sendServiceRequest(
    `/api/services/${encodeURIComponent(slug)}`,
    'PUT',
    input,
  );
}

export async function deleteServiceRequest(slug: string) {
  await requestJson(
    `/api/services/${encodeURIComponent(slug)}`,
    { method: 'DELETE' },
    'Impossible de supprimer ce service.',
  );
  invalidateServices();
}

async function sendServiceRequest(
  url: string,
  method: 'POST' | 'PUT',
  input: ServiceInput,
) {
  const payload = await requestJson<ServiceResponse>(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  }, 'Impossible d’enregistrer ce service.');
  invalidateServices();
  return payload.service;
}

function invalidateServices() {
  services.invalidate({ notify: false });
  services.notify();
}
