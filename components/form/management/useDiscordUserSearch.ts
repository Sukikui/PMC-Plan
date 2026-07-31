'use client';

import { useCallback, useState } from 'react';
import { buildDiscordUserSearchPath } from '@/lib/discord/user-search';
import type { MapEntryUser } from '@/lib/map-entry/types';

export function useDiscordUserSearch(
  onError: (message: string | null) => void,
) {
  const [searchResults, setSearchResults] = useState<MapEntryUser[]>([]);

  const searchUsers = useCallback(async (query: string) => {
    const path = buildDiscordUserSearchPath(query);
    if (!path) {
      setSearchResults([]);
      return;
    }
    try {
      const response = await fetch(path, { cache: 'no-store' });
      if (!response.ok) throw new Error('Impossible de rechercher les utilisateurs.');
      const payload = await response.json() as { users: MapEntryUser[] };
      setSearchResults(payload.users);
      onError(null);
    } catch (error) {
      setSearchResults([]);
      onError(error instanceof Error ? error.message : 'Une erreur inattendue est survenue.');
    }
  }, [onError]);

  return {
    searchResults,
    searchUsers,
    clearSearch: () => setSearchResults([]),
  };
}
