import type { ReactNode } from 'react';
import { themeColors } from '@/lib/theme-colors';

interface InfoOverlayBodyProps {
  children: ReactNode;
  floatingContent?: ReactNode;
  showBottomBlur: boolean;
}

export default function InfoOverlayBody({
  children,
  floatingContent,
  showBottomBlur,
}: InfoOverlayBodyProps) {
  return (
    <div className="relative min-h-0 flex-1 overflow-hidden rounded-b-xl">
      {children}
      <div className={`pointer-events-none absolute inset-x-0 top-0 z-10 h-20 gradient-top-solid-blur ${themeColors.transition}`} />
      {floatingContent}
      <div className={`pointer-events-none absolute inset-x-0 bottom-0 z-10 h-2 ${themeColors.gradient.bottomSolid} ${themeColors.transition} ${showBottomBlur ? 'opacity-100' : 'opacity-0'}`} />
      <div className={`pointer-events-none absolute inset-x-0 bottom-2 z-10 h-8 ${themeColors.gradient.bottomBlur} ${themeColors.transition} ${showBottomBlur ? 'opacity-100' : 'opacity-0'}`} />
    </div>
  );
}
