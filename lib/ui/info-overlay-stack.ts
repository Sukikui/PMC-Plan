export type InfoOverlayType = 'place' | 'portal' | 'space';
export type InfoOverlayContentTarget =
  | { kind: 'map-entry'; id: string }
  | { kind: 'space'; id: string };

const getLayerGroup = (type: InfoOverlayType) => (
  type === 'space' ? 'space' : 'map-entry'
);

export function pushBoundedInfoLayer<T extends { type: InfoOverlayType }>(
  layers: readonly T[],
  nextLayer: T,
): T[] {
  const nextGroup = getLayerGroup(nextLayer.type);
  return [
    ...layers.filter((layer) => getLayerGroup(layer.type) !== nextGroup),
    nextLayer,
  ];
}

export function removeInfoLayersForContent<
  T extends { item: object; type: InfoOverlayType },
>(
  layers: readonly T[],
  target: InfoOverlayContentTarget,
): T[] {
  return layers.filter((layer) => {
    if (target.kind === 'space') {
      return !(
        layer.type === 'space'
        && 'id' in layer.item
        && layer.item.id === target.id
      );
    }

    return !(
      layer.type !== 'space'
      && 'mapEntryId' in layer.item
      && layer.item.mapEntryId === target.id
    );
  });
}
