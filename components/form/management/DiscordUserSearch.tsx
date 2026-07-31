'use client';

import {
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  matchesDiscordUserQuery,
  normalizeDiscordUserQuery,
} from '@/lib/discord/user-search';
import type { MapEntryUser } from '@/lib/map-entry/types';
import SearchCombobox from '../common/SearchCombobox';
import { UserIdentity } from './ManagementUi';
import { useDiscordUserSearch } from './useDiscordUserSearch';

interface DiscordUserSearchProps {
  busy: boolean;
  excludedIds: string[];
  onError?: (message: string | null) => void;
  onSelect: (user: MapEntryUser) => Promise<boolean> | boolean;
  placeholder?: string;
}

const ignoreSearchError = () => {};

export default function DiscordUserSearch({
  busy,
  excludedIds,
  onError = ignoreSearchError,
  onSelect,
  placeholder = 'Ajouter via Discord...',
}: DiscordUserSearchProps) {
  const [query, setQuery] = useState('');
  const {
    clearSearch,
    searchResults,
    searchUsers,
  } = useDiscordUserSearch(onError);
  const excluded = useMemo(() => new Set(excludedIds), [excludedIds]);
  const availableResults = useMemo(() => {
    const normalizedQuery = normalizeDiscordUserQuery(query);
    if (normalizedQuery.length < 2) return [];
    return searchResults.filter((user) => (
      !excluded.has(user.id)
      && matchesDiscordUserQuery(user, normalizedQuery)
    ));
  }, [excluded, query, searchResults]);
  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void searchUsers(query);
    }, 220);
    return () => window.clearTimeout(timeout);
  }, [query, searchUsers]);

  const selectUser = async (user: MapEntryUser) => {
    const selected = await Promise.resolve(onSelect(user));
    if (selected) {
      clearSearch();
    }
    return selected;
  };

  return (
    <SearchCombobox
      disabled={busy}
      getKey={(user) => user.id}
      items={availableResults}
      name="discord-user-search"
      onQueryChange={setQuery}
      onSelect={selectUser}
      placeholder={placeholder}
      query={query}
      renderItem={(user, highlighted) => (
        <UserIdentity user={user} accent={highlighted} />
      )}
    />
  );
}
