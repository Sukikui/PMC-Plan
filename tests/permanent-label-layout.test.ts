import {
  layoutCompactLabels,
  layoutPermanentLabels,
} from '@/components/map/tooltip/permanent-label-layout';

const bounds = { left: 0, top: 0, right: 400, bottom: 400 };
const label = { id: 'a', x: 200, y: 200, width: 100, height: 24, offset: 12 };

describe('permanent map labels', () => {
  it('places several labels synchronously in compact map previews', () => {
    const points = Array.from({ length: 10 }, (_, index) => ({
      id: String(index),
      x: 55 + index % 3 * 140,
      y: 70 + Math.floor(index / 3) * 90,
      offset: 12,
      width: 100,
      height: 24,
    }));
    const positions = layoutCompactLabels(points, bounds);
    expect(positions.size).toBeGreaterThan(5);
    expect(positions.size).toBeLessThanOrEqual(10);
    expect(layoutCompactLabels(points, bounds)).toEqual(positions);
  });

  it('prefers the closest position above a point', () => {
    expect(layoutPermanentLabels([label], bounds).get('a')).toEqual({ left: 150, right: 250, top: 164, bottom: 188 });
  });

  it('moves the next label farther up instead of overlapping', () => {
    const positions = layoutPermanentLabels([label, { ...label, id: 'b' }], bounds);
    expect(positions.get('b')!.bottom).toBeLessThan(positions.get('a')!.top);
  });

  it('falls below the point after exhausting the upper zone', () => {
    const positions = layoutPermanentLabels([label], bounds, [{ left: 0, right: 400, top: 0, bottom: 190 }]);
    expect(positions.get('a')!.top).toBe(212);
  });

  it('uses lower slots without overlap when the point is near the top edge', () => {
    const points = [label, { ...label, id: 'b' }].map((point) => ({ ...point, y: 10 }));
    const positions = layoutPermanentLabels(points, bounds);
    expect(positions.get('a')!.top).toBe(22);
    expect(positions.get('b')!.top).toBeGreaterThan(positions.get('a')!.bottom);
  });

  it('is deterministic regardless of input order', () => {
    const points = [label, { ...label, id: 'b' }, { ...label, id: 'c' }];
    expect(layoutPermanentLabels(points, bounds)).toEqual(layoutPermanentLabels([...points].reverse(), bounds));
  });

  it('keeps the upper point label close and never covers it with the lower label', () => {
    const upper = { ...label, id: 'z', radius: 8 };
    const lower = { ...label, id: 'a', y: 224, radius: 8 };
    const positions = layoutPermanentLabels([lower, upper], bounds);
    expect(positions.get('z')!.bottom).toBe(188);
    expect(positions.get('a')!.top).toBeGreaterThan(lower.y);
  });

  it('preserves point-relative placement during panning and viewport clipping', () => {
    const relative = { left: -50, right: 50, top: -36, bottom: -12 };
    const retained = new Map([[label.id, relative]]);
    const translated = { ...label, x: 270, y: 220 };
    expect(layoutPermanentLabels([translated], bounds, [], retained).get('a')).toEqual({
      left: 220, right: 320, top: 184, bottom: 208,
    });
    expect(layoutPermanentLabels([{ ...label, x: 10 }], bounds, [], retained).get('a')!.left).toBe(0);
    expect(layoutPermanentLabels([label], bounds, [], retained).get('a')!.left).toBe(150);
  });

  it('pins a label at the edge only while its point remains safely visible', () => {
    const relative = new Map([[label.id, { left: -50, right: 50, top: -36, bottom: -12 }]]);
    expect(layoutPermanentLabels([{ ...label, x: 5 }], bounds, [], relative).get('a')!.left).toBe(0);
    expect(layoutPermanentLabels([{ ...label, x: 4 }], bounds, [], relative).size).toBe(0);
  });

  it('recenters an edge-clamped label when its point moves inward', () => {
    const relative = new Map([[label.id, { left: -50, right: 50, top: -36, bottom: -12 }]]);
    expect(layoutPermanentLabels([{ ...label, x: 5 }], bounds, [], relative).get('a')!.left).toBe(0);
    expect(layoutPermanentLabels([{ ...label, x: 100 }], bounds, [], relative).get('a')!.left).toBe(50);
  });

  it('places newly visible labels around retained labels without moving them', () => {
    const retained = new Map([[label.id, { left: -50, right: 50, top: -36, bottom: -12 }]]);
    const positions = layoutPermanentLabels([label, { ...label, id: 'new' }], bounds, [], retained);
    expect(positions.get('a')!.top).toBe(164);
    expect(positions.get('new')!.bottom).toBeLessThan(164);
  });

  it('gives the hovered label priority over a conflicting retained label', () => {
    const relative = { left: -50, right: 50, top: -36, bottom: -12 };
    const priority = { ...label, id: 'hovered', priority: true };
    const positions = layoutPermanentLabels(
      [label, priority], bounds, [], new Map([[label.id, relative], [priority.id, relative]]),
    );
    expect(positions.get('hovered')!.top).toBe(164);
    const regular = positions.get('a');
    if (regular) expect(regular.bottom <= 164 || regular.top >= 188).toBe(true);
  });

  it('keeps labels inside the preview and hides those that cannot fit', () => {
    expect(layoutPermanentLabels([{ ...label, x: 5 }], bounds).get('a')!.left).toBe(0);
    expect(layoutPermanentLabels([{ ...label, x: 395 }], bounds).get('a')!.right).toBe(400);
    expect(layoutPermanentLabels([{ ...label, width: 500 }], bounds).size).toBe(0);
    expect(layoutPermanentLabels([label], bounds, [bounds]).size).toBe(0);
    expect(layoutPermanentLabels([{ ...label, height: 0 }], bounds).size).toBe(0);
  });

  it('never overlaps labels even in a dense cluster with varying sizes', () => {
    const points = Array.from({ length: 50 }, (_, i) => ({ ...label, id: String(i), height: 24 + i % 3 * 8 }));
    const placed = [...layoutPermanentLabels(points, bounds).values()];
    expect(placed.length).toBeGreaterThan(1);
    expect(placed.length).toBeLessThan(points.length);
    placed.forEach((a, i) => placed.slice(i + 1).forEach((b) => {
      expect(a.bottom <= b.top || b.bottom <= a.top || a.right <= b.left || b.right <= a.left).toBe(true);
    }));
  });
});
