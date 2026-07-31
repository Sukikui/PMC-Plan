export type MapEntryFormType = 'place' | 'portal';

export type MapEntryFormTarget =
  | { id: string; type: 'place' }
  | {
      id: string;
      type: 'portal';
      variant: 'linked' | 'nether' | 'overworld';
    };

export function getMapEntrySaveEndpoint(
  entityType: MapEntryFormType,
  mode: 'add' | 'edit',
  target?: MapEntryFormTarget,
) {
  if (mode === 'add') return `/api/${entityType}s`;
  if (!target || target.type !== entityType) {
    throw new Error('Contenu à modifier introuvable.');
  }
  if (target.type === 'place') return `/api/places/${target.id}`;

  const world = target.variant === 'linked'
    ? 'overworld'
    : target.variant;
  return `/api/portals/${target.id}?world=${world}`;
}

export function getMapEntryDeleteEndpoint(target: MapEntryFormTarget) {
  if (target.type === 'place') return `/api/places/${target.id}`;
  const worldQuery = target.variant === 'linked'
    ? ''
    : `?world=${target.variant}`;
  return `/api/portals/${target.id}${worldQuery}`;
}
