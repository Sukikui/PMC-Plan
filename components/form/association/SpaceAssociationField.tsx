'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useAdminMode } from '@/components/admin/AdminModeProvider';
import FormFieldLabel from '@/components/form/common/FormFieldLabel';
import SearchCombobox from '@/components/form/common/SearchCombobox';
import { RemoveButton } from '@/components/form/management/ManagementUi';
import SpaceLogo from '@/components/spaces/SpaceLogo';
import { ListRow } from '@/components/ui/ListRow';
import { canManageContent } from '@/lib/content-permissions';
import { fetchSpaces } from '@/lib/spaces/client';
import type { Space, SpaceReference } from '@/lib/spaces/types';
import { themeColors } from '@/lib/theme-colors';

interface SpaceAssociationFieldProps {
  disabled?: boolean;
  onChange: (space: SpaceReference | null) => void;
  value: SpaceReference | null;
}

export default function SpaceAssociationField({
  disabled = false,
  onChange,
  value,
}: SpaceAssociationFieldProps) {
  const { data: session } = useSession();
  const { effectiveRole } = useAdminMode();
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [query, setQuery] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void fetchSpaces()
      .then((loadedSpaces) => {
        if (!cancelled) setSpaces(loadedSpaces);
      })
      .catch(() => {
        if (!cancelled) {
          setError('Impossible de charger les espaces.');
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const availableSpaces = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('fr-FR');
    return spaces.filter((space) => (
      space.id !== value?.id
      && canManageContent(effectiveRole, session?.user?.id, space)
      && (
        !normalizedQuery
        || space.name.toLocaleLowerCase('fr-FR').includes(normalizedQuery)
        || space.slug.toLocaleLowerCase('fr-FR').includes(normalizedQuery)
      )
    ));
  }, [effectiveRole, query, session?.user?.id, spaces, value?.id]);

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
      {error && (
        <p className={`text-xs ${themeColors.feedback.errorText}`}>
          {error}
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
