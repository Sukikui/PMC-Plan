'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAdminMode } from '@/components/admin/AdminModeProvider';
import FormFieldLabel from '@/components/form/common/FormFieldLabel';
import SearchCombobox from '@/components/form/common/SearchCombobox';
import { RemoveButton } from '@/components/form/management/ManagementUi';
import SpaceLogo from '@/components/spaces/SpaceLogo';
import { ListRow } from '@/components/ui/ListRow';
import { spaceReferencesQueryOptions } from '@/lib/spaces/client';
import type { SpaceReference } from '@/lib/spaces/types';
import { themeColors } from '@/lib/theme-colors';

interface SpaceAssociationFieldProps {
  disabled?: boolean;
  onChange: (space: SpaceReference | null) => void;
  value: SpaceReference | null;
}

const EMPTY_SPACES: SpaceReference[] = [];

export default function SpaceAssociationField({
  disabled = false,
  onChange,
  value,
}: SpaceAssociationFieldProps) {
  const { effectiveRole } = useAdminMode();
  const [query, setQuery] = useState('');
  const spacesQuery = useQuery(spaceReferencesQueryOptions(effectiveRole));
  const spaces = spacesQuery.data ?? EMPTY_SPACES;

  const availableSpaces = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('fr-FR');
    return spaces.filter((space) => (
      space.id !== value?.id
      && (
        !normalizedQuery
        || space.name.toLocaleLowerCase('fr-FR').includes(normalizedQuery)
        || space.slug.toLocaleLowerCase('fr-FR').includes(normalizedQuery)
      )
    ));
  }, [query, spaces, value?.id]);

  return (
    <div className="space-y-2">
      <FormFieldLabel>Espace (optionnel)</FormFieldLabel>
      {value ? (
        <ListRow className="flex items-center justify-between gap-3">
          <SpaceIdentity space={value} />
          <RemoveButton
            disabled={disabled}
            label={`Détacher ${value.name}`}
            onClick={() => onChange(null)}
          />
        </ListRow>
      ) : (
        <SearchCombobox
          disabled={disabled}
          getKey={(space) => space.id}
          items={availableSpaces}
          name="space-search"
          onQueryChange={setQuery}
          onSelect={(space) => {
            onChange(space);
            return true;
          }}
          placeholder="Associer à un espace..."
          query={query}
          renderItem={(space, highlighted) => (
            <SpaceIdentity accent={highlighted} space={space} />
          )}
        />
      )}
      {spacesQuery.error && (
        <p className={`text-xs ${themeColors.feedback.errorText}`}>
          {spacesQuery.error.message}
        </p>
      )}
    </div>
  );
}

function SpaceIdentity({
  accent = false,
  space,
}: {
  accent?: boolean;
  space: SpaceReference;
}) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <SpaceLogo
        color={space.color}
        logoBackground={space.logoBackground}
        logoUrl={space.logoUrl}
        logoZoom={space.logoZoom}
        name={space.name}
        size="small"
      />
      <div className="min-w-0">
        <p className={`truncate text-sm font-medium ${
          accent ? themeColors.text.accent : themeColors.text.primary
        }`}>
          {space.name}
        </p>
        <p className={`truncate text-xs ${
          accent ? themeColors.text.accent : themeColors.text.tertiary
        }`}>
          #{space.slug}
        </p>
      </div>
    </div>
  );
}
