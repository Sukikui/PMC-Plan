export type InfoOverlayType = 'place' | 'portal' | 'space';

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
