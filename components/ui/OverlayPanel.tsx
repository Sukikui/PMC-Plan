'use client';

import { useId, type ReactNode } from 'react';
import Overlay from '@/components/ui/Overlay';
import OverlayHeader from '@/components/ui/OverlayHeader';
import OverlaySurface, {
  type OverlaySurfaceHeight,
  type OverlaySurfaceSize,
} from '@/components/ui/OverlaySurface';
import { themeColors } from '@/lib/theme-colors';

interface OverlayPanelProps {
  children: ReactNode;
  closing: boolean;
  contentMode?: 'contained' | 'scroll';
  height?: OverlaySurfaceHeight;
  isOpen: boolean;
  onClose: () => void;
  size?: OverlaySurfaceSize;
  title: string;
}

export default function OverlayPanel({
  children,
  closing,
  contentMode = 'scroll',
  height,
  isOpen,
  onClose,
  size = 'large',
  title,
}: OverlayPanelProps) {
  const titleId = useId();

  return (
    <Overlay isOpen={isOpen} onClose={onClose} closing={closing}>
      <OverlaySurface
        ariaLabelledBy={titleId}
        height={height}
        size={size}
      >
        <OverlayHeader title={title} titleId={titleId} onClose={onClose} />

        <div
          className={`relative min-h-0 flex-1 rounded-b-xl ${themeColors.panel.primary} ${themeColors.transition} ${
            contentMode === 'scroll'
              ? 'overflow-y-auto p-6 [&::-webkit-scrollbar]:hidden'
              : 'overflow-hidden'
          }`}
          style={contentMode === 'scroll' ? { scrollbarWidth: 'none', msOverflowStyle: 'none' } : undefined}
        >
          {children}
        </div>
      </OverlaySurface>
    </Overlay>
  );
}
