import type { MineVerifyPublicStatus } from './types';

export interface MinecraftLinkTimelineState {
  activeStep: number;
  actionStep: number | null;
  actionLabel: 'Relancer' | 'Terminer' | null;
}

export function getMinecraftLinkTimelineState(
  status: MineVerifyPublicStatus['status'],
): MinecraftLinkTimelineState {
  if (status === 'linked') {
    return { activeStep: 2, actionStep: 2, actionLabel: 'Terminer' };
  }

  if (status === 'expired') {
    return { activeStep: 1, actionStep: 1, actionLabel: 'Relancer' };
  }

  if (status === 'code_created') {
    return { activeStep: 1, actionStep: null, actionLabel: null };
  }

  return { activeStep: 0, actionStep: null, actionLabel: null };
}
