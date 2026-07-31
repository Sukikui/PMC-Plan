import {
  bringOverlayLayerToFront,
  removeOverlayLayer,
} from '../lib/ui/overlay';

describe('overlay stack', () => {
  it('keeps each overlay ordered below the layers opened after it', () => {
    const settingsLayer = bringOverlayLayerToFront([], 'settings');
    const placeLayer = bringOverlayLayerToFront(settingsLayer, 'place');
    const formLayer = bringOverlayLayerToFront(placeLayer, 'form');

    expect(formLayer).toEqual(['settings', 'place', 'form']);
  });

  it('reveals the previous overlay when the top layer is removed', () => {
    const layers = ['settings', 'place', 'form'];
    const withoutForm = removeOverlayLayer(layers, 'form');
    const withoutPlace = removeOverlayLayer(withoutForm, 'place');

    expect(withoutForm).toEqual(['settings', 'place']);
    expect(withoutPlace).toEqual(['settings']);
  });

  it('moves an existing layer to the top without duplicating it', () => {
    expect(bringOverlayLayerToFront(
      ['settings', 'place', 'form'],
      'place',
    )).toEqual(['settings', 'form', 'place']);
  });
});
