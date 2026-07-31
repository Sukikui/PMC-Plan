'use client';

import type { Session } from 'next-auth';
import type { MineVerifyPublicStatus } from '@/lib/mineverify/types';
import IdentitySummary from '@/components/settings/IdentitySummary';
import MinecraftHeadImage from '@/components/ui/MinecraftHeadImage';
import {
  PillActionButton,
  PillSurface,
} from '@/components/ui/PillAction';
import UserAvatar from '@/components/ui/UserAvatar';
import { themeColors } from '@/lib/theme-colors';

interface SettingsAccountSummaryProps {
  user?: Session['user'];
  minecraftStatus: MineVerifyPublicStatus;
  onOpenSettings: () => void;
}

export default function SettingsAccountSummary({
  user,
  minecraftStatus,
  onOpenSettings,
}: SettingsAccountSummaryProps) {
  if (!user) {
    return (
      <PillActionButton
        fullWidth
        tone="surface"
        onClick={onOpenSettings}
        className="min-w-0 text-left"
        aria-label="Se connecter à PMC Plan"
      >
        <UserAvatar
          alt="Compte Discord"
          className="h-9 w-9 shrink-0"
        />
        <div className="min-w-0 flex-1">
          <p className={`truncate text-sm font-medium ${themeColors.text.primary}`}>
            Non connecté
          </p>
          <p className={`truncate text-xs ${themeColors.text.tertiary}`}>
            Compte Discord requis
          </p>
        </div>
      </PillActionButton>
    );
  }

  const minecraftIdentifier = minecraftStatus.status === 'linked'
    ? minecraftStatus.minecraftUuid ?? minecraftStatus.minecraftName
    : null;

  return (
    <PillSurface
      fullWidth
      className="min-w-0 text-left"
    >
      <span className="grid min-w-0 flex-1 grid-cols-2 gap-3">
        <IdentitySummary
          avatar={(
            <UserAvatar
              src={user.image}
              alt={`Avatar de ${user.globalName || user.name || 'ton compte Discord'}`}
              className="h-9 w-9"
            />
          )}
          title={user.globalName || user.name || 'Utilisateur'}
          subtitle={user.username ? `@${user.username}` : user.id}
        />
        <IdentitySummary
          avatar={(
            <MinecraftHeadImage
              playerIdentifier={minecraftIdentifier}
              alt={minecraftIdentifier
                ? `Tête de ${minecraftStatus.minecraftName ?? 'ton compte Minecraft'}`
                : 'Tête de Steve'}
              className="h-[37px] w-[37px]"
            />
          )}
          title={minecraftIdentifier
            ? minecraftStatus.minecraftName ?? 'Joueur Minecraft'
            : 'Non lié'}
          subtitle={minecraftStatus.minecraftUuid}
          unlinked={!minecraftIdentifier}
        />
      </span>
    </PillSurface>
  );
}
