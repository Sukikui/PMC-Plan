'use client';

import {
  forwardRef,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { themeColors } from '@/lib/theme-colors';

export type OverlaySurfaceSize = 'compact' | 'medium' | 'large' | 'wide';
export type OverlaySurfaceHeight = 'content' | 'viewport';

const sizeClasses: Record<OverlaySurfaceSize, string> = {
  compact: 'max-w-md',
  medium: 'max-w-2xl',
  large: 'max-w-3xl',
  wide: 'max-w-6xl',
};

const heightClasses: Record<OverlaySurfaceHeight, string> = {
  content: 'max-h-[min(90vh,calc(100vh-2rem))]',
  viewport: 'h-[min(90vh,calc(100vh-2rem))]',
};

interface OverlaySurfaceProps {
  ariaLabel?: string;
  ariaLabelledBy?: string;
  children: ReactNode;
  className?: string;
  height?: OverlaySurfaceHeight;
  shadowClass?: string;
  size?: OverlaySurfaceSize;
  style?: CSSProperties;
}

const OverlaySurface = forwardRef<HTMLElement, OverlaySurfaceProps>(
  function OverlaySurface({
    ariaLabel,
    ariaLabelledBy,
    children,
    className = '',
    height,
    shadowClass = themeColors.shadow.overlay.place,
    size = 'large',
    style,
  }, ref) {
    const resolvedHeight = height ?? (size === 'compact' ? 'content' : 'viewport');

    return (
      <section
        ref={ref}
        aria-label={ariaLabelledBy ? undefined : (ariaLabel ?? 'Fenêtre')}
        aria-labelledby={ariaLabelledBy}
        aria-modal="true"
        role="dialog"
        tabIndex={-1}
        className={`pointer-events-auto relative flex w-full min-w-0 flex-col overflow-hidden border ${sizeClasses[size]} ${heightClasses[resolvedHeight]} ${themeColors.border.primary} ${themeColors.panel.primary} ${themeColors.util.roundedXl} [box-shadow:0_0_25px_0_var(--tw-shadow-color)] ${shadowClass} ${className}`}
        style={style}
      >
        {children}
      </section>
    );
  },
);

export default OverlaySurface;
