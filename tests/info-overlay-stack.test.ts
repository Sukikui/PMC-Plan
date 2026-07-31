import {
  pushBoundedInfoLayer,
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
