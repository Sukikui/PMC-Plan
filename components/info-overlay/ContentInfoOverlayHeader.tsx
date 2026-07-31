'use client';

import type { ReactNode } from 'react';
import CrossIcon from '@/components/icons/CrossIcon';
import PencilIcon from '@/components/icons/PencilIcon';
import { DiscordIcon } from '@/components/ui/DiscordLink';
import IconActionButton from '@/components/ui/IconActionButton';
import { OverlayHeaderFrame } from '@/components/ui/OverlayHeader';
import { themeColors } from '@/lib/theme-colors';

interface ContentInfoOverlayHeaderProps {
  canEdit: boolean;
  discordUrl?: string | null;
  identity: ReactNode;
  metadata: ReactNode;
  metadataUnderTitle?: boolean;
  onClose: () => void;
  onEdit: () => void;
  secondaryIdentity?: ReactNode;
  title: string;
}

export default function ContentInfoOverlayHeader({
  canEdit,
  discordUrl,
  identity,
  metadata,
  metadataUnderTitle = false,
  onClose,
  onEdit,
  secondaryIdentity,
  title,
}: ContentInfoOverlayHeaderProps) {
  return (
    <OverlayHeaderFrame className="z-10">
      <div className="flex items-start justify-between">
        <div className={`min-w-0 flex-1 ${
          secondaryIdentity
            ? 'grid grid-cols-[minmax(0,11fr)_minmax(7rem,9fr)] items-center gap-3 sm:grid-cols-[minmax(0,11fr)_minmax(10rem,9fr)] sm:gap-6'
            : ''
        }`}>
          <div className={`min-w-0 ${
            secondaryIdentity ? 'px-3 sm:px-4' : ''
          }`}>
            <div className={`flex min-w-0 items-center gap-3 ${metadataUnderTitle ? '' : 'mb-2'}`}>
              {identity}
              <div className="min-w-0">
                <h2 className={`min-w-0 text-2xl font-bold [word-spacing:0.25rem] ${themeColors.text.primary} ${themeColors.transition}`}>
                  {discordUrl ? (
                    <a
                      aria-label={`Ouvrir le serveur Discord de ${title}`}
                      className={`${themeColors.interactive.hoverAccentText} ${themeColors.interactive.focusRing} ${themeColors.transition}`}
                      href={discordUrl}
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      <span className="[word-spacing:normal]">{title}</span>
                      {' '}
                      <DiscordIcon className="inline h-6 w-6 align-[-0.15em] [word-spacing:normal]" />
                    </a>
                  ) : (
                    <span className="[word-spacing:normal]">{title}</span>
                  )}
                </h2>
                {metadataUnderTitle && (
                  <div className="mt-0.5">
                    {metadata}
                  </div>
                )}
              </div>
            </div>
            {!metadataUnderTitle && metadata}
          </div>
          {secondaryIdentity && (
            <div className="min-w-0 px-3 sm:px-4">
              {secondaryIdentity}
            </div>
          )}
        </div>

        <div className="ml-3 flex shrink-0 flex-col items-end">
          <IconActionButton onClick={onClose} aria-label="Fermer">
            <CrossIcon className={`h-4 w-4 ${themeColors.text.secondary}`} />
          </IconActionButton>
          {canEdit && (
            <IconActionButton
              onClick={onEdit}
              className="mt-2"
              aria-label="Modifier"
            >
              <PencilIcon className={`h-4 w-4 ${themeColors.text.secondary}`} />
            </IconActionButton>
          )}
        </div>
      </div>
    </OverlayHeaderFrame>
  );
}
