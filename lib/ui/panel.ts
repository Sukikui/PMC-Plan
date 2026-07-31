import type { CSSProperties } from 'react';

const verticalScrollFade = 'linear-gradient(to bottom, transparent 0, black 2.75rem, black calc(100% - 2.5rem), transparent 100%)';
const bottomContentFade = 'linear-gradient(to bottom, black 0, black 60%, transparent 94%)';

export const MAP_CONTROL_PANEL_COLLAPSED_HEIGHT_PX = 200;
export const MAP_CONTROL_PANEL_EXPANSION_TRANSITION_MS = 300;

export const panelScrollFadeStyle: CSSProperties = {
  maskImage: verticalScrollFade,
  WebkitMaskImage: verticalScrollFade,
};

export const panelBottomFadeStyle: CSSProperties = {
  maskImage: bottomContentFade,
  WebkitMaskImage: bottomContentFade,
};
