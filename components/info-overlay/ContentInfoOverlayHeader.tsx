'use client';

import type { ReactNode } from 'react';
import CrossIcon from '@/components/icons/CrossIcon';
import PencilIcon from '@/components/icons/PencilIcon';
import CopyButton from '@/components/ui/CopyButton';
import IconActionButton from '@/components/ui/IconActionButton';
import { OverlayHeaderFrame } from '@/components/ui/OverlayHeader';
import { themeColors } from '@/lib/theme-colors';

const SOCIAL_PREVIEW_WARM_COOLDOWN_MS = 10_000;
const socialPreviewWarmTimes = new Map<string, number>();

interface ContentInfoOverlayHeaderProps {
  canEdit: boolean;
  identity: ReactNode;
  metadata: ReactNode;
  metadataUnderTitle?: boolean;
  onClose: () => void;
  onEdit: () => void;
  secondaryIdentity?: ReactNode;
  sharePath: string;
  title: ReactNode;
  titleMaxLines?: 1 | 2;
}

export default function ContentInfoOverlayHeader({
  canEdit,
  identity,
  metadata,
  metadataUnderTitle = false,
  onClose,
  onEdit,
  secondaryIdentity,
  sharePath,
  title,
  titleMaxLines = 1,
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
                <h2 className={`min-w-0 text-2xl font-bold [word-spacing:0.25rem] ${themeColors.text.primary}`}>
                  <CopyButton
                    className={`inline-flex min-w-0 max-w-full items-center gap-2 text-left [word-spacing:normal] ${themeColors.interactive.hoverAccentText} ${themeColors.interactive.focusRing} data-[copied=true]:text-blue-500 dark:data-[copied=true]:text-blue-400`}
                    copiedLabel="Lien copié"
                    copyLabel="Copier le lien"
                    onIntent={() => warmSocialPreview(sharePath)}
                    revealIconOnHover
                    value={() => new URL(sharePath, window.location.origin).href}
                  >
                    <span className={`min-w-0 transition-colors duration-300 ease-out ${
                      titleMaxLines === 2 ? 'line-clamp-2' : 'truncate'
                    }`}>
                      {title}
                    </span>
                  </CopyButton>
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

function warmSocialPreview(path: string) {
  const startedAt = Date.now();
  const previousWarmTime = socialPreviewWarmTimes.get(path);
  if (
    previousWarmTime !== undefined
    && startedAt - previousWarmTime < SOCIAL_PREVIEW_WARM_COOLDOWN_MS
  ) {
    return;
  }
  socialPreviewWarmTimes.set(path, startedAt);

  void fetch('/api/social-preview/warm', {
    body: JSON.stringify({ path }),
    headers: { 'Content-Type': 'application/json' },
    keepalive: true,
    method: 'POST',
  }).then((response) => {
    if (!response.ok) releaseSocialPreviewWarm(path, startedAt);
  }).catch(() => releaseSocialPreviewWarm(path, startedAt));
}

function releaseSocialPreviewWarm(path: string, startedAt: number) {
  if (socialPreviewWarmTimes.get(path) === startedAt) {
    socialPreviewWarmTimes.delete(path);
  }
}
