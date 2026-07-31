'use client';

import { useState } from 'react';
import type { Role } from '@prisma/client';
import type { AssignableRole } from '@/lib/admin/roles';
import { themeColors } from '@/lib/theme-colors';
import AdminRoleBadge from './AdminRoleBadge';

interface AdminRoleControlProps {
  canApproveUsers: boolean;
  canManageRoles: boolean;
  userId: string;
  role: Role;
  onError: (message: string) => void;
  onRoleChanged: (role: Role) => void;
}

export default function AdminRoleControl({
  canApproveUsers,
  canManageRoles,
  userId,
  role,
  onError,
  onRoleChanged,
}: AdminRoleControlProps) {
  const [loading, setLoading] = useState(false);

  const updateRole = async (nextRole: AssignableRole) => {
    if (loading) return;
    setLoading(true);

    try {
      const response = await fetch(`/api/admin/users/${userId}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: nextRole }),
      });
      const body = await response.json() as {
        user?: { role: Role };
        error?: string;
      };

      if (!response.ok || !body.user) {
        throw new Error(body.error ?? 'Impossible de modifier le rôle.');
      }

      onRoleChanged(body.user.role);
    } catch (requestError) {
      onError(
        requestError instanceof Error
          ? requestError.message
          : 'Impossible de modifier le rôle.',
      );
    } finally {
      setLoading(false);
    }
  };

  if (role === 'pending') {
    if (!canApproveUsers) {
      return <AdminRoleBadge role={role} />;
    }

    return (
      <button
        type="button"
        disabled={loading}
        onClick={() => updateRole('user')}
        className={`whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${themeColors.button.ghost} ${themeColors.transitionAll} disabled:cursor-wait disabled:opacity-60`}
      >
        Approuver
      </button>
    );
  }

  if (!canManageRoles || role === 'super_admin') {
    return <AdminRoleBadge role={role} showUser />;
  }

  const admin = role === 'admin';

  if (!admin) {
    return (
      <ExpandableRoleAction
        ariaLabel="Nommer Admin"
        collapsedWidth="w-12"
        idleLabel="User"
        hoverLabel="Nommer Admin"
        loading={loading}
        onClick={() => updateRole('admin')}
        tone={themeColors.adminMode.user}
      />
    );
  }

  return (
    <ExpandableRoleAction
      ariaLabel="Retirer les droits administrateur"
      collapsedWidth="w-14"
      idleLabel="Admin"
      hoverLabel="Retirer les droits"
      loading={loading}
      onClick={() => updateRole('user')}
      tone={themeColors.adminBubble.badge}
    />
  );
}

function ExpandableRoleAction({
  ariaLabel,
  collapsedWidth,
  idleLabel,
  hoverLabel,
  loading,
  onClick,
  tone,
}: {
  ariaLabel: string;
  collapsedWidth: 'w-12' | 'w-14';
  idleLabel: string;
  hoverLabel: string;
  loading: boolean;
  onClick: () => void;
  tone: string;
}) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      disabled={loading}
      onClick={onClick}
      className={`group/role relative h-6 ${collapsedWidth} overflow-hidden whitespace-nowrap rounded-full text-xs font-medium hover:w-28 ${tone} ${themeColors.transitionAll} disabled:cursor-wait disabled:opacity-60`}
    >
      <span
        className={`absolute inset-0 flex items-center justify-center opacity-100 group-hover/role:opacity-0 ${themeColors.transitionAll}`}
      >
        {idleLabel}
      </span>
      <span
        className={`absolute inset-0 flex items-center justify-center opacity-0 group-hover/role:opacity-100 ${themeColors.transitionAll}`}
      >
        {hoverLabel}
      </span>
    </button>
  );
}
