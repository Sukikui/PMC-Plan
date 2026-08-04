import type {
  ContentManagementFilter,
  ContentManagementResponse,
  ContentManagementScope,
  ContentManagementType,
} from './types';

export async function fetchContentManagement({
  filter = 'all',
  page = 1,
  query = '',
  scope,
  signal,
  type,
}: {
  filter?: ContentManagementFilter;
  page?: number;
  query?: string;
  scope: ContentManagementScope;
  signal?: AbortSignal;
  type: ContentManagementType;
}): Promise<ContentManagementResponse> {
  const params = new URLSearchParams({
    filter,
    page: String(page),
    query,
    type,
  });
  const endpoint = scope === 'all' ? '/api/admin/content' : '/api/account/content';
  const response = await fetch(`${endpoint}?${params}`, {
    cache: 'no-store',
    signal,
  });
  if (!response.ok) throw new Error('Impossible de charger les contenus.');
  return response.json() as Promise<ContentManagementResponse>;
}
