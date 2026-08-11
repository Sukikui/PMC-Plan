import { getNextViewportIconState } from '@/components/map/hooks/usePointRenderMode';

describe('map point icon viewport', () => {
  it('keeps only the previously visible icons while zooming out', () => {
    const initialIds = new Set(['visible']);
    const revealedIds = new Set(['visible', 'revealed']);
    const state = getNextViewportIconState(
      { pointIds: initialIds, zoom: 4, resetKey: 'overworld' },
      {
        visiblePointIds: revealedIds,
        zoom: 3,
        zoomDirection: 'out',
        showPointIcons: true,
        pointRenderMode: 'icons',
        resetKey: 'overworld',
      }
    );

    expect(state.pointIds).toBe(initialIds);
  });

  it('refreshes visible icons when zooming in or moving at a stable zoom', () => {
    const nextIds = new Set(['next']);
    const state = getNextViewportIconState(
      { pointIds: new Set(['previous']), zoom: 3, resetKey: 'overworld' },
      {
        visiblePointIds: nextIds,
        zoom: 3,
        zoomDirection: null,
        showPointIcons: true,
        pointRenderMode: 'icons',
        resetKey: 'overworld',
      }
    );

    expect(state.pointIds).toBe(nextIds);
  });

  it('clears icon eligibility after the collapse animation', () => {
    const state = getNextViewportIconState(
      { pointIds: new Set(['visible']), zoom: 3, resetKey: 'overworld' },
      {
        visiblePointIds: new Set(['visible', 'revealed']),
        zoom: 2,
        zoomDirection: 'out',
        showPointIcons: false,
        pointRenderMode: 'points',
        resetKey: 'overworld',
      }
    );

    expect(state.pointIds).toEqual(new Set());
  });
});
