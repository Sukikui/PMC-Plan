"use client";

import React from 'react';
import type { Role } from '@prisma/client';
import { themeColors } from '@/lib/theme-colors';

interface ProfileCardProps {
  user: {
    image?: string | null;
    name?: string | null;
    role?: Role | null;
    username?: string | null; // Discord username
    globalName?: string | null; // Discord global display name
  };
  onSignOut: () => void;
}

const ProfileCard: React.FC<ProfileCardProps> = ({ user, onSignOut }) => {
  return (
    <div className={`${themeColors.panel.primary} ${themeColors.blurSm} border ${themeColors.border.primary} ${themeColors.util.roundedLg} p-3 ${themeColors.transition} mx-2`}>
      <div className="flex items-center gap-2">
        {user.image && (
          <img src={user.image} alt="Avatar" className="w-6 h-6 rounded-full" referrerPolicy="no-referrer" />
        )}
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
          <span className={`text-xs px-2 py-0.5 ${themeColors.util.roundedFull} bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 font-medium flex-shrink-0`}>
            Admin
          </span>
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
