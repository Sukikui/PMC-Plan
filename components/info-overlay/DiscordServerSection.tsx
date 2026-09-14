'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DiscordIcon } from '@/components/ui/DiscordLink';
import { discordInviteQueryOptions } from '@/lib/discord/client';
import { themeColors } from '@/lib/theme-colors';

interface DiscordServerSectionProps {
  discordUrl: string;
}

export default function DiscordServerSection({
  discordUrl,
}: DiscordServerSectionProps) {
  const [iconFailed, setIconFailed] = useState(false);
  const { data: server } = useQuery(discordInviteQueryOptions(discordUrl));

  useEffect(() => setIconFailed(false), [server?.iconUrl]);

  return (
    <section className="min-w-0">
      <h3 className={`mb-3 text-lg font-semibold ${themeColors.text.primary} ${themeColors.transition}`}>
        Serveur Discord
      </h3>
      <a
        aria-label={`Ouvrir ${server?.name ?? 'le serveur Discord'}`}
        className={`group inline-flex max-w-full min-w-0 items-center gap-3 ${themeColors.interactive.focusRing}`}
        href={discordUrl}
        rel="noopener noreferrer"
        target="_blank"
      >
        <span className={`flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl border ${themeColors.panel.inset} ${themeColors.border.secondary} ${themeColors.transition}`}>
          {server?.iconUrl && !iconFailed ? (
            <img
              alt={`Logo de ${server.name}`}
              className="h-full w-full object-cover"
              loading="lazy"
              onError={() => setIconFailed(true)}
              src={server.iconUrl}
            />
          ) : (
            <DiscordIcon className={`h-6 w-6 ${themeColors.text.secondary} ${themeColors.interactive.groupHoverAccentText} ${themeColors.transition}`} />
          )}
        </span>
        <span
          className={`line-clamp-2 min-w-0 max-w-[20ch] text-sm font-medium leading-5 ${themeColors.text.primary} ${themeColors.interactive.groupHoverAccentText} ${themeColors.transition}`}
          title={server?.name}
        >
          {server?.name ?? 'Serveur Discord'}
        </span>
      </a>
    </section>
  );
}
