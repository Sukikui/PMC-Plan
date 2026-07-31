'use client';

import type { MapEntryEditor } from '@/lib/map-entry/types';
import { themeColors } from '@/lib/theme-colors';
import UserAvatar from '@/components/ui/UserAvatar';
import FloatingStatusBubble from '@/components/ui/FloatingStatusBubble';

const lastEditDateFormatter = new Intl.DateTimeFormat('fr-FR', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'Europe/Paris',
});

export default function LastEditorIndicator({
  editor,
}: {
  editor: MapEntryEditor;
}) {
  const name = editor.name ?? editor.username ?? 'Utilisateur inconnu';
  const editedAt = new Date(editor.editedAt);
  const formattedDate = Number.isNaN(editedAt.getTime())
    ? 'Date inconnue'
    : lastEditDateFormatter.format(editedAt);

  return (
    <div className="pointer-events-none absolute left-full top-0 z-10 ml-2 w-max max-w-[calc(100vw-2rem)]">
      <FloatingStatusBubble className="flex max-w-full items-center gap-2 py-1.5 pl-2 pr-3">
        <UserAvatar
          src={editor.image}
          alt=""
          className="h-9 w-9 shrink-0"
        />
        <div className="min-w-0">
          <p className={`truncate whitespace-nowrap text-sm font-medium ${themeColors.text.tertiary}`}>
            Modifié par{' '}
            <span className={themeColors.text.primary}>
              {name}
            </span>
          </p>
          <p className={`mt-0.5 whitespace-nowrap text-sm ${themeColors.text.muted}`}>
            {formattedDate}
          </p>
        </div>
      </FloatingStatusBubble>
    </div>
  );
}
