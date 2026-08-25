export type MapEntryFormType = 'place' | 'portal';

export type MapEntryFormTarget =
  | { id: string; type: 'place' }
  | {
      id: string;
      mapEntryId?: string;
      type: 'portal';
      variant: 'linked' | 'nether' | 'overworld';
    };

export function getMapEntrySaveEndpoint(
  entityType: MapEntryFormType,
  mode: 'add' | 'edit',
  target?: MapEntryFormTarget,
  intent?: 'claim',
) {
  if (mode === 'add') return `/api/${entityType}s`;
  if (!target || target.type !== entityType) {
    throw new Error('Contenu à modifier introuvable.');
  }
  if (target.type === 'place') return `/api/places/${target.id}`;

  const world = target.variant === 'linked'
    ? 'overworld'
    : target.variant;
  const params = new URLSearchParams({ world });
  if (intent === 'claim') {
    if (!target.mapEntryId) {
      throw new Error('Portail à revendiquer introuvable.');
    }
    params.set('claim', 'true');
    params.set('mapEntryId', target.mapEntryId);
  }
  return `/api/portals/${target.id}?${params.toString()}`;
}

export function getMapEntryDeleteEndpoint(target: MapEntryFormTarget) {
  if (target.type === 'place') return `/api/places/${target.id}`;
  const worldQuery = target.variant === 'linked'
    ? ''
    : `?world=${target.variant}`;
  return `/api/portals/${target.id}${worldQuery}`;
}
