'use client';

import type { ReactNode } from 'react';
import CrossIcon from '@/components/icons/CrossIcon';
import IdentitySummary from '@/components/settings/IdentitySummary';
import UserAvatar from '@/components/ui/UserAvatar';
import { themeColors } from '@/lib/theme-colors';
import type { MapEntryUser } from '@/lib/map-entry/types';
import { formInputClassName } from '../common/form-styles';

export function UserIdentity({
  accent = false,
  user,
}: {
  accent?: boolean;
  user: Pick<MapEntryUser, 'image' | 'name' | 'username'>;
}) {
  return (
    <IdentitySummary
      accent={accent}
      avatar={<UserAvatar src={user.image} className="h-9 w-9" />}
      title={getUserLabel(user)}
      subtitle={user.username ? `@${user.username}` : null}
    />
  );
}

export function RemoveButton({
  disabled,
  label,
  onClick,
}: {
  disabled: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={`p-1 ${themeColors.text.tertiary} ${themeColors.interactive.hoverText} ${themeColors.interactive.focusRing} ${themeColors.transitionAll}`}
    >
      <CrossIcon className="h-5 w-5" />
    </button>
  );
}

export function RoleBadge({ children }: { children: ReactNode }) {
  return (
    <span className={`px-2.5 py-1 text-xs font-medium ${themeColors.util.roundedFull} ${themeColors.adminBubble.badge}`}>
      {children}
    </span>
  );
}

export const getUserLabel = (
  user: Pick<MapEntryUser, 'name' | 'username'>,
) => (
  user.name ?? user.username ?? 'Utilisateur Discord'
);

export const managementInputClass = formInputClassName;
