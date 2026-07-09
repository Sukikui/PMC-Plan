"use client";

import React, { useEffect, useState } from 'react';
import type { MineVerifyPublicStatus } from '@/lib/mineverify/types';
import { themeColors } from '@/lib/theme-colors';
import Overlay from '@/components/ui/Overlay';
import Panel from '@/components/ui/Panel';
import IconActionButton from '@/components/ui/IconActionButton';
import CopyIcon from '@/components/icons/CopyIcon';
import CrossIcon from '@/components/icons/CrossIcon';
import { useOverlayPanelAnimation } from '@/components/ui/useOverlayPanelAnimation';

interface MinecraftLinkOverlayProps {
  isOpen: boolean;
  status: MineVerifyPublicStatus;
  loading: boolean;
  error: string | null;
  onClose: () => void;
  onRetry: () => void;
}

export default function MinecraftLinkOverlay({
  isOpen,
  status,
  loading,
  error,
  onClose,
  onRetry,
}: MinecraftLinkOverlayProps) {
  const entered = useOverlayPanelAnimation(isOpen);

  return (
    <Overlay isOpen={isOpen} onClose={onClose}>
      <Panel
        className={`relative w-full max-w-md overflow-hidden transition-all duration-300 ${
          entered ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-3 opacity-0 scale-95'
        }`}
      >
        <div className={`p-4 border-b ${themeColors.border.primary} flex items-center justify-between`}>
          <div>
            <h2 className={`text-sm font-semibold ${themeColors.text.primary}`}>Lier Minecraft</h2>
            <p className={`text-xs ${themeColors.text.tertiary} mt-0.5`}>Associer ton compte PMC Plan à ton compte MC.</p>
          </div>
          <IconActionButton onClick={onClose} aria-label="Fermer">
            <CrossIcon className={`w-4 h-4 ${themeColors.text.secondary}`} />
          </IconActionButton>
        </div>

        <div className="p-4 space-y-4">
          <MinecraftLinkOverlayContent status={status} loading={loading} onRetry={onRetry} onClose={onClose} />

          {error && (
            <div className={`text-xs border ${themeColors.syncNotification.errorBorder} ${themeColors.syncNotification.errorBg} ${themeColors.syncNotification.errorText} ${themeColors.util.roundedLg} px-3 py-2`}>
              {error}
            </div>
          )}
        </div>
      </Panel>
    </Overlay>
  );
}

function MinecraftLinkOverlayContent({
  status,
  loading,
  onRetry,
  onClose,
}: {
  status: MineVerifyPublicStatus;
  loading: boolean;
  onRetry: () => void;
  onClose: () => void;
}) {
  if (status.status === 'linked') {
    return (
      <div className="space-y-4">
        <StatusBlock title="Compte lié" tone="success">
          Ton compte Minecraft est lié à {status.minecraftName ?? 'ce compte'}.
        </StatusBlock>
        <button onClick={onClose} className={`w-full text-sm px-4 py-2 ${themeColors.util.roundedFull} ${themeColors.button.primary} ${themeColors.transitionAll}`}>
          Terminer
        </button>
      </div>
    );
  }

  if (status.status === 'code_created' && status.command) {
    return (
      <div className="space-y-4">
        <StatusBlock title="Code généré">
          Lance cette commande en jeu avec le compte Minecraft à lier.
        </StatusBlock>
        <CommandBox command={status.command} />
        {status.expiresAt && (
          <CountdownText expiresAt={status.expiresAt} />
        )}
      </div>
    );
  }

  if (status.status === 'expired') {
    return (
      <div className="space-y-4">
        <StatusBlock title="Code expiré" tone="warning">
          La demande a expiré. Tu peux en créer une nouvelle.
        </StatusBlock>
        <button
          onClick={onRetry}
          disabled={loading}
          className={`w-full text-sm px-4 py-2 ${themeColors.util.roundedFull} ${loading ? themeColors.button.primaryDisabled : themeColors.button.primary} ${themeColors.transitionAll}`}
        >
          Relancer la liaison
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <StatusBlock title="En attente du serveur">
        Connecte-toi au serveur Minecraft puis lance la commande pour récupérer ton code.
      </StatusBlock>
      <CommandBox command="/mineverify" />
      {loading && <p className={`text-xs ${themeColors.text.tertiary}`}>Création de la demande...</p>}
    </div>
  );
}

function StatusBlock({
  title,
  tone = 'default',
  children,
}: {
  title: string;
  tone?: 'default' | 'success' | 'warning';
  children: React.ReactNode;
}) {
  const dotClass = tone === 'success'
    ? 'bg-green-500 dark:bg-green-400'
    : tone === 'warning'
      ? 'bg-amber-500 dark:bg-amber-400'
      : themeColors.status.connected;

  return (
    <div className={`flex gap-3 border ${themeColors.border.primary} ${themeColors.panel.secondary} ${themeColors.util.roundedLg} px-3 py-3`}>
      <span className={`mt-1 w-2 h-2 ${themeColors.util.roundedFull} ${dotClass} flex-shrink-0`} />
      <div>
        <div className={`text-sm font-medium ${themeColors.text.primary}`}>{title}</div>
        <div className={`text-xs ${themeColors.text.secondary} mt-1 leading-relaxed`}>{children}</div>
      </div>
    </div>
  );
}

function CommandBox({ command }: { command: string }) {
  const [copied, setCopied] = useState(false);

  const copyCommand = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(command);
      } else {
        copyWithFallback(command);
      }

      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className={`flex items-center gap-2 border ${themeColors.border.secondary} ${themeColors.panel.primary} ${themeColors.util.roundedLg} px-3 py-2`}>
      <code className={`block text-sm font-mono ${themeColors.text.primary} break-all flex-1 min-w-0`}>{command}</code>
      <button
        type="button"
        onClick={copyCommand}
        aria-label={copied ? 'Commande copiée' : 'Copier la commande'}
        title={copied ? 'Copié' : 'Copier'}
        className={`px-2 py-1 rounded-md ${themeColors.transitionAll} ${
          copied
            ? 'scale-105'
            : 'hover:scale-105'
        } flex-shrink-0`}
      >
        <CopyIcon className={`w-4 h-4 ${copied ? 'text-blue-500 dark:text-blue-400 scale-110' : themeColors.text.tertiary} ${themeColors.transitionAll}`} />
      </button>
    </div>
  );
}

function CountdownText({ expiresAt }: { expiresAt: string }) {
  const [remainingMs, setRemainingMs] = useState(() => getRemainingMs(expiresAt));

  useEffect(() => {
    setRemainingMs(getRemainingMs(expiresAt));

    const intervalId = window.setInterval(() => {
      setRemainingMs(getRemainingMs(expiresAt));
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [expiresAt]);

  return (
    <p className={`text-xs ${themeColors.text.tertiary}`}>
      Expire dans {formatRemainingTime(remainingMs)}.
    </p>
  );
}

const getRemainingMs = (expiresAt: string) =>
  Math.max(0, new Date(expiresAt).getTime() - Date.now());

function formatRemainingTime(remainingMs: number) {
  const totalSeconds = Math.ceil(remainingMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (minutes <= 0) {
    return `${seconds}s`;
  }

  return `${minutes}min ${seconds.toString().padStart(2, '0')}s`;
}

function copyWithFallback(text: string) {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  textarea.style.left = '-9999px';
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  document.execCommand('copy');
  document.body.removeChild(textarea);
}
