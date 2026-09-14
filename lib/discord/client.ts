import { requestJson } from '@/lib/api-client';
import { queryKeys } from '@/lib/query/keys';
import type { DiscordServerPreview } from './invite';

interface DiscordInviteResponse {
  server: DiscordServerPreview | null;
}

export function discordInviteQueryOptions(url: string) {
  return {
    queryKey: queryKeys.discordInvite(url),
    queryFn: async () => {
      const result = await requestJson<DiscordInviteResponse>(
        `/api/discord/invite?url=${encodeURIComponent(url)}`,
        { method: 'GET' },
        'Impossible de récupérer le serveur Discord.',
      );
      return result.server;
    },
    staleTime: 6 * 60 * 60 * 1000,
  };
}
