"use client";

import React from 'react';
import type { Role } from '@prisma/client';
import type { MineVerifyPublicStatus } from '@/lib/mineverify/types';
import { themeColors } from '@/lib/theme-colors';
import UserAvatar from '@/components/ui/UserAvatar';

interface ProfileCardProps {
  user: {
    image?: string | null;
    name?: string | null;
    role?: Role | null;
    username?: string | null; // Discord username
    globalName?: string | null; // Discord global display name
  };
  minecraftLinkStatus: MineVerifyPublicStatus;
  onOpenMinecraftLink: () => void;
  onUnlinkMinecraft: () => void;
  onSignOut: () => void;
}

const ProfileCard: React.FC<ProfileCardProps> = ({
  user,
  minecraftLinkStatus,
  onOpenMinecraftLink,
  onUnlinkMinecraft,
  onSignOut,
}) => {
  const minecraftName = minecraftLinkStatus.status === 'linked' ? minecraftLinkStatus.minecraftName : null;

  return (
    <div className={`${themeColors.panel.primary} ${themeColors.blurSm} border ${themeColors.border.primary} ${themeColors.util.roundedLg} p-3 ${themeColors.transition} mx-2`}>
      <div className="flex items-center gap-2">
        <UserAvatar src={user.image} alt={`Avatar de ${user.globalName || user.name || user.username || 'l’utilisateur'}`} className="w-6 h-6" />
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2 min-w-0">
            <span className={`text-sm font-medium ${themeColors.text.primary} truncate`}>
              {user.globalName || user.name || 'Utilisateur'}
            </span>
            {user.username && (
              <span className={`text-xs ${themeColors.text.tertiary} truncate`}>@{user.username}</span>
            )}
          </div>
        </div>
        {user.role === 'admin' && (
          <span className={`text-xs px-2 py-0.5 ${themeColors.util.roundedFull} ${themeColors.adminBubble.badge} font-medium flex-shrink-0`}>
            Admin
          </span>
        )}
      </div>
      <div className={`mt-3 border-t ${themeColors.border.light} pt-2`}>
        {minecraftName ? (
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <span className={`block text-xs ${themeColors.text.tertiary}`}>Minecraft</span>
              <span className={`block text-xs font-medium ${themeColors.text.primary} truncate`}>{minecraftName}</span>
            </div>
            <button
              onClick={onUnlinkMinecraft}
              className={`text-xs px-2 py-1 ${themeColors.util.roundedFull} ${themeColors.button.ghost} ${themeColors.transitionAll} flex-shrink-0`}
            >
              Délier
            </button>
          </div>
        ) : (
          <button
            onClick={onOpenMinecraftLink}
            className={`w-full text-xs px-3 py-1.5 ${themeColors.util.roundedFull} ${themeColors.button.ghost} ${themeColors.transitionAll}`}
          >
            Lier Minecraft
          </button>
        )}
      </div>
      <div className="mt-2 flex w-full">
        <button
          onClick={onSignOut}
          className={`inline-flex items-center gap-2 text-xs ${themeColors.link} px-2 py-1.5 ${themeColors.util.roundedFull} ${themeColors.transitionAll}`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Se déconnecter
        </button>
      </div>
    </div>
  );
};

export default ProfileCard;
