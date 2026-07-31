import { getMinecraftLinkTimelineState } from '../lib/mineverify/timeline';

describe('Minecraft link timeline', () => {
  it.each(['not_started', 'pending'] as const)(
    'keeps the server step active for %s',
    (status) => {
      expect(getMinecraftLinkTimelineState(status)).toEqual({
        activeStep: 0,
        actionStep: null,
        actionLabel: null,
      });
    },
  );

  it('moves to validation when a code is created', () => {
    expect(getMinecraftLinkTimelineState('code_created')).toEqual({
      activeStep: 1,
      actionStep: null,
      actionLabel: null,
    });
  });

  it('turns validation into a retry action after expiration', () => {
    expect(getMinecraftLinkTimelineState('expired')).toEqual({
      activeStep: 1,
      actionStep: 1,
      actionLabel: 'Relancer',
    });
  });

  it('turns the linked step into the finish action', () => {
    expect(getMinecraftLinkTimelineState('linked')).toEqual({
      activeStep: 2,
      actionStep: 2,
      actionLabel: 'Terminer',
    });
  });
});
