import {
  createPortalLocationState,
  portalLocationReducer,
} from '@/components/form/portal/usePortalLocationState';
import type { InitialPortalData } from '@/components/form/portal/portal-form-types';

const overworldCoordinates = { x: '801', y: '64', z: '-9' };
const netherCoordinates = { x: '100', y: '71', z: '-2' };

describe('portal location state', () => {
  it('creates a complete coordinate pair from an Overworld map click', () => {
    let state = createPortalLocationState(undefined, {
      world: 'overworld',
      x: 801,
      y: 64,
      z: -9,
    });

    expect(state.coordinates).toEqual({
      overworld: overworldCoordinates,
      nether: { x: '100', y: '64', z: '-2' },
    });

    state = portalLocationReducer(state, { type: 'set-variant', variant: 'overworld' });
    state = portalLocationReducer(state, { type: 'set-variant', variant: 'linked' });
    state = portalLocationReducer(state, { type: 'set-variant', variant: 'nether' });

    expect(state.coordinates.nether).toEqual({ x: '100', y: '64', z: '-2' });
  });

  it('creates a complete coordinate pair from a Nether map click', () => {
    let state = createPortalLocationState(undefined, {
      world: 'nether',
      x: 100,
      y: 71,
      z: -2,
    });

    expect(state.coordinates).toEqual({
      overworld: { x: '800', y: '71', z: '-16' },
      nether: netherCoordinates,
    });

    state = portalLocationReducer(state, { type: 'set-variant', variant: 'nether' });
    state = portalLocationReducer(state, { type: 'set-variant', variant: 'linked' });
    state = portalLocationReducer(state, { type: 'set-variant', variant: 'overworld' });

    expect(state.coordinates.overworld).toEqual({ x: '800', y: '71', z: '-16' });
  });

  it('keeps both worlds synchronized while entering an Overworld-only portal', () => {
    let state = createPortalLocationState();
    state = portalLocationReducer(state, { type: 'set-variant', variant: 'overworld' });
    state = portalLocationReducer(state, {
      type: 'set-coordinates',
      value: overworldCoordinates,
      world: 'overworld',
    });

    expect(state.coordinates.nether).toEqual({ x: '100', y: '64', z: '-2' });
    expect(portalLocationReducer(state, {
      type: 'set-variant',
      variant: 'nether',
    }).coordinates.nether).toEqual({ x: '100', y: '64', z: '-2' });
  });

  it('keeps both worlds synchronized while entering a Nether-only portal', () => {
    let state = createPortalLocationState();
    state = portalLocationReducer(state, { type: 'set-variant', variant: 'nether' });
    state = portalLocationReducer(state, {
      type: 'set-coordinates',
      value: netherCoordinates,
      world: 'nether',
    });

    expect(state.coordinates.overworld).toEqual({ x: '800', y: '71', z: '-16' });
    expect(portalLocationReducer(state, {
      type: 'set-variant',
      variant: 'overworld',
    }).coordinates.overworld).toEqual({ x: '800', y: '71', z: '-16' });
  });

  it('updates linked Nether coordinates from Overworld coordinates in automatic mode', () => {
    const state = portalLocationReducer(createPortalLocationState(), {
      type: 'set-coordinates',
      value: overworldCoordinates,
      world: 'overworld',
    });

    expect(state.coordinates.nether).toEqual({ x: '100', y: '64', z: '-2' });
    expect(state.netherCoordinatesManual).toBe(false);
  });

  it('preserves linked Nether coordinates in manual mode', () => {
    const initialData: InitialPortalData = {
      color: '#3B82F6',
      id: 'portail-test',
      managerIds: ['manager'],
      name: 'Portail test',
      netherCoordinates: { x: 101, y: 70, z: 201 },
      overworldCoordinates: { x: 800, y: 64, z: 1600 },
      primaryManagerId: 'manager',
      type: 'portal',
      unidentified: false,
      variant: 'linked',
    };
    const initialState = createPortalLocationState(initialData);
    const state = portalLocationReducer(initialState, {
      type: 'set-coordinates',
      value: overworldCoordinates,
      world: 'overworld',
    });

    expect(initialState.netherCoordinatesManual).toBe(true);
    expect(state.coordinates.nether).toEqual({ x: '101', y: '70', z: '201' });
  });

  it('updates linked Overworld coordinates from Nether coordinates in automatic mode', () => {
    const initialState = portalLocationReducer(createPortalLocationState(), {
      type: 'set-coordinates',
      value: overworldCoordinates,
      world: 'overworld',
    });
    const state = portalLocationReducer(initialState, {
      type: 'set-coordinates',
      value: netherCoordinates,
      world: 'nether',
    });

    expect(state.coordinates.overworld).toEqual({ x: '800', y: '71', z: '-16' });
    expect(state.coordinates.nether).toEqual(netherCoordinates);
    expect(state.netherCoordinatesManual).toBe(false);
  });

  it('keeps linked Overworld coordinates unchanged when editing Nether manually', () => {
    let state = portalLocationReducer(createPortalLocationState(), {
      type: 'set-coordinates',
      value: overworldCoordinates,
      world: 'overworld',
    });
    state = portalLocationReducer(state, {
      type: 'set-nether-manual',
      manual: true,
    });
    state = portalLocationReducer(state, {
      type: 'set-coordinates',
      value: netherCoordinates,
      world: 'nether',
    });

    expect(state.coordinates.overworld).toEqual(overworldCoordinates);
    expect(state.coordinates.nether).toEqual(netherCoordinates);
    expect(state.netherCoordinatesManual).toBe(true);
  });
});
