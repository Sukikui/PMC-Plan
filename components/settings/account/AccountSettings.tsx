'use client';

import type { Session } from 'next-auth';
import type { SelectDestinationHandler } from '@/lib/destination/selection';
import type { MineVerifyPublicStatus } from '@/lib/mineverify/types';
import { themeColors } from '@/lib/theme-colors';
import ActionButton from '@/components/ui/ActionButton';
import MinecraftHeadImage from '@/components/ui/MinecraftHeadImage';
import TypedDestructiveAction from '@/components/ui/TypedDestructiveAction';
import UserAvatar from '@/components/ui/UserAvatar';
import SectionSeparator from '@/components/ui/SectionSeparator';
import AdminRoleBadge from '@/components/settings/admin/AdminRoleBadge';
import AccountContentList from '@/components/settings/account/AccountContentList';
import { unlinkedIdentityClass } from '@/components/settings/account-identity-styles';
import { useAdminMode } from '@/components/admin/AdminModeProvider';

interface AccountSettingsProps {
  user?: Session['user'];
  minecraftStatus: MineVerifyPublicStatus;
  minecraftLoading: boolean;
  onLinkMinecraft: () => void;
  onSignIn: () => void;
  onSignOut: () => void;
  onUnlinkMinecraft: () => void;
  onSelectItem?: SelectDestinationHandler;
}

export default function AccountSettings({
  user,
  minecraftStatus,
  minecraftLoading,
  onLinkMinecraft,
  onSignIn,
  onSignOut,
  onUnlinkMinecraft,
  onSelectItem,
}: AccountSettingsProps) {
  const { effectiveRole } = useAdminMode();

  return (
    <section>
      <h3 className={`text-sm font-semibold ${themeColors.text.primary}`}>
        Gérer mes connexions
      </h3>
      <div className="mt-2">
        {user ? (
          <AccountRow
            label="Discord"
            avatar={(
              <UserAvatar
                src={user.image}
                alt={`Avatar de ${user.globalName || user.name || 'ton compte Discord'}`}
                className="h-12 w-12"
              />
            )}
            title={user.globalName || user.name || 'Utilisateur'}
            subtitle={user.username ? `@${user.username}` : 'Compte Discord connecté'}
            role={effectiveRole as Session['user']['role']}
            action={(
              <ActionButton variant="primaryOutline" onClick={onSignOut}>
                Se déconnecter
              </ActionButton>
            )}
          />
        ) : (
          <AccountRow
            label="Discord"
            avatar={<UserAvatar alt="Compte Discord" className="h-12 w-12" />}
            title="Non connecté"
            subtitle="Une connexion Discord est nécessaire pour ajouter des lieux et lier Minecraft."
            action={(
              <ActionButton variant="primaryOutline" onClick={onSignIn}>
                Se connecter
              </ActionButton>
            )}
          />
        )}
        <MinecraftAccountRow
          userConnected={Boolean(user)}
          status={minecraftStatus}
          loading={minecraftLoading}
          onLink={onLinkMinecraft}
          onUnlink={onUnlinkMinecraft}
        />
      </div>
      {user && (
        <>
          <SectionSeparator className="my-6" />
          <AccountContentList onSelectItem={onSelectItem} />
        </>
      )}
    </section>
  );
}

function MinecraftAccountRow({
  userConnected,
  status,
  loading,
  onLink,
  onUnlink,
}: {
  userConnected: boolean;
  status: MineVerifyPublicStatus;
  loading: boolean;
  onLink: () => void;
  onUnlink: () => void;
}) {
  if (status.status === 'linked' && status.minecraftUuid) {
    const identifier = status.minecraftUuid || status.minecraftName || '';
    const confirmationValue = status.minecraftName ?? '';

    return (
      <AccountRow
        label="Minecraft"
        avatar={(
          <MinecraftHeadImage
            playerIdentifier={identifier}
            alt={`Tête de ${status.minecraftName ?? 'ton compte Minecraft'}`}
            className="h-14 w-14"
          />
        )}
        title={status.minecraftName ?? 'Joueur Minecraft'}
        subtitle={status.minecraftUuid}
        action={(
          <TypedDestructiveAction
            actionLabel="Délier"
            confirmationMessage="Pour confirmer la rupture, écris le pseudo."
            confirmationValue={confirmationValue}
            disabled={loading}
            layout="compact"
            onConfirm={onUnlink}
          />
        )}
      />
    );
  }

  return (
    <AccountRow
      label="Minecraft"
      avatar={(
        <MinecraftHeadImage
          alt="Tête de Steve"
          className="h-14 w-14"
        />
      )}
      title="Non lié"
      unlinkedTitle
      subtitle={userConnected ? 'Associe ton compte Minecraft en te connectant sur Play-MC.fr' : 'Connecte-toi d’abord avec Discord.'}
      action={(
        <ActionButton
          variant="primaryOutline"
          onClick={onLink}
          disabled={!userConnected || loading}
        >
          Lier
        </ActionButton>
      )}
    />
  );
}

function AccountRow({
  label,
  avatar,
  title,
  subtitle,
  role,
  unlinkedTitle = false,
  action,
}: {
  label: string;
  avatar: React.ReactNode;
  title: string;
  subtitle: string;
  role?: Session['user']['role'];
  unlinkedTitle?: boolean;
  action: React.ReactNode;
}) {
  return (
    <div className={`flex flex-wrap items-center gap-4 border-t py-4 first:border-t-0 ${themeColors.border.primary}`}>
      <div className="flex w-14 shrink-0 justify-center">{avatar}</div>
      <div className="min-w-0 flex-1">
        <p className={`mb-0.5 text-[11px] font-semibold ${themeColors.text.secondary} ${themeColors.util.uppercase}`}>
          {label}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <span className={`truncate ${
            unlinkedTitle
              ? unlinkedIdentityClass
              : `text-sm font-semibold ${themeColors.text.primary}`
          }`}>{title}</span>
          {role && <AdminRoleBadge role={role} />}
        </div>
        <p className={`truncate text-xs ${themeColors.text.tertiary}`} title={subtitle}>{subtitle}</p>
      </div>
      <div className="shrink-0">{action}</div>
    </div>
  );
}
