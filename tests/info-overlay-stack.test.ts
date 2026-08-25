import {
  pushBoundedInfoLayer,
  removeInfoLayersForContent,
  type InfoOverlayType,
} from '@/lib/ui/info-overlay-stack';

interface TestLayer {
  name: string;
  type: InfoOverlayType;
}

describe('bounded information overlay stack', () => {
  it('keeps only the latest map entry and the latest space', () => {
    let layers: TestLayer[] = [];

    layers = open(layers, 'Marché de Valnyfrost', 'place');
    expect(names(layers)).toEqual(['Marché de Valnyfrost']);

    layers = open(layers, 'Valnyfrost', 'space');
    expect(names(layers)).toEqual(['Marché de Valnyfrost', 'Valnyfrost']);

    layers = open(layers, 'Portail de Valnyfrost', 'portal');
    expect(names(layers)).toEqual(['Valnyfrost', 'Portail de Valnyfrost']);

    layers = open(layers, 'Valnyfrost', 'space');
    expect(names(layers)).toEqual(['Portail de Valnyfrost', 'Valnyfrost']);
  });

  it('removes a deleted map entry without revealing its stale detail layer', () => {
    const layers = [
      { item: { id: 'space-1' }, type: 'space' as const },
      {
        item: { mapEntryId: 'entry-1' },
        type: 'portal' as const,
      },
    ];

    expect(removeInfoLayersForContent(layers, {
      id: 'entry-1',
      kind: 'map-entry',
    })).toEqual([layers[0]]);
  });

  it('removes a deleted space without removing another content layer', () => {
    const layers = [
      { item: { mapEntryId: 'entry-1' }, type: 'place' as const },
      { item: { id: 'space-1' }, type: 'space' as const },
    ];

    expect(removeInfoLayersForContent(layers, {
      id: 'space-1',
      kind: 'space',
    })).toEqual([layers[0]]);
  });
});

function open(
  layers: TestLayer[],
  name: string,
  type: InfoOverlayType,
) {
  return pushBoundedInfoLayer(layers, { name, type });
}

const names = (layers: TestLayer[]) => (
  layers.map(({ name }) => name)
);
