import type { ReactNode } from 'react';
import OverlaySurface from '@/components/ui/OverlaySurface';
import type { MapEntryEditor } from '@/lib/map-entry/types';
import LastEditorIndicator from './LastEditorIndicator';

interface ContentOverlayFrameProps {
  ariaLabel: string;
  children: ReactNode;
  editor?: MapEntryEditor;
  header: ReactNode;
  shadowClass: string;
  showLastEditor: boolean;
}

export default function ContentOverlayFrame({
  ariaLabel,
  children,
  editor,
  header,
  shadowClass,
  showLastEditor,
}: ContentOverlayFrameProps) {
  return (
    <div className="relative flex w-full max-w-3xl">
      {showLastEditor && editor && <LastEditorIndicator editor={editor} />}
      <OverlaySurface ariaLabel={ariaLabel} size="large" shadowClass={shadowClass}>
        {header}
        {children}
      </OverlaySurface>
    </div>
  );
}
