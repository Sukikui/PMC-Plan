'use client';

import Image from 'next/image';
import React, { useEffect, useRef, useState } from 'react';
import type { MineVerifyPublicStatus } from '@/lib/mineverify/types';
import { themeColors } from '@/lib/theme-colors';
import CheckIcon from '@/components/icons/CheckIcon';
import CopyIcon from '@/components/icons/CopyIcon';
import MinecraftLinkTimeline from '@/components/settings/MinecraftLinkTimeline';
import MinecraftHeadImage from '@/components/ui/MinecraftHeadImage';
import OverlayPanel from '@/components/ui/OverlayPanel';

interface MinecraftLinkOverlayProps {
  isOpen: boolean;
  closing: boolean;
  status: MineVerifyPublicStatus;
  loading: boolean;
  error: string | null;
  onClose: () => void;
  onRetry: () => void;
}

export default function MinecraftLinkOverlay({
  isOpen,
  closing,
  status,
  loading,
  error,
  onClose,
  onRetry,
}: MinecraftLinkOverlayProps) {
  return (
    <OverlayPanel
      isOpen={isOpen}
      closing={closing}
      onClose={onClose}
      size="compact"
      title="Lier son compte Minecraft"
    >
      <div className="space-y-4">
        <MinecraftLinkOverlayContent status={status} loading={loading} />

        {error && (
          <div className={`text-xs border ${themeColors.statusNotification.error.border} ${themeColors.statusNotification.error.background} ${themeColors.statusNotification.error.title} ${themeColors.util.roundedLg} px-3 py-2`}>
            {error}
          </div>
        )}

        <MinecraftLinkTimeline
          status={status.status}
          loading={loading}
          onFinish={onClose}
          onRetry={onRetry}
        />
      </div>
    </OverlayPanel>
  );
}

function MinecraftLinkOverlayContent({
  status,
  loading,
}: {
  status: MineVerifyPublicStatus;
  loading: boolean;
}) {
  if (status.status === 'linked') {
    return (
      <div className="min-w-0">
        <div className="flex min-w-0 items-center gap-4">
          <div className="relative shrink-0">
            <MinecraftHeadImage
              playerIdentifier={status.minecraftName ?? status.minecraftUuid!}
              alt={`Tête de ${status.minecraftName ?? 'ton compte Minecraft'}`}
              className={`h-[92px] w-[92px] object-contain ${themeColors.util.roundedLg}`}
              crossOrigin="anonymous"
              loading="eager"
            />
            <span className={`absolute bottom-0 right-0 flex h-6 w-6 items-center justify-center border-2 ${themeColors.util.roundedFull} ${themeColors.panel.primary} ${themeColors.border.primary}`}>
              <CheckIcon className={`h-3.5 w-3.5 ${themeColors.text.accent}`} aria-hidden="true" />
            </span>
          </div>
          <div className="min-w-0">
            <span className={`inline-flex max-w-full truncate px-3 py-1 text-xs font-medium ${themeColors.util.roundedFull} ${themeColors.infoOverlay.placeTags}`}>
              {status.minecraftName ?? 'Pseudo inconnu'}
            </span>
            <p
              className={`mt-1.5 max-w-full truncate text-xs ${themeColors.text.tertiary}`}
              title={status.minecraftUuid}
            >
              UUID : {status.minecraftUuid ?? 'Non renseigné'}
            </p>
          </div>
        </div>
        <p className={`mt-3 text-left text-sm ${themeColors.text.secondary} leading-relaxed`}>
          Ton compte Minecraft est maintenant lié à ton compte Discord sur l&apos;app PMC Plan.
        </p>
      </div>
    );
  }

  if (status.status === 'code_created' && status.command) {
    return (
      <div className="space-y-4">
        <LinkStepMessage>
          Ton code a été récupéré. Exécute la commande suivante en jeu avec le compte Minecraft à lier.
        </LinkStepMessage>
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
        <LinkStepMessage>
          Ton code a expiré. Tu peux en générer un nouveau.
        </LinkStepMessage>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <LinkStepMessage>
        Connecte-toi sur Play-MC.fr et exécute la commande suivante pour récupérer ton code.
      </LinkStepMessage>
      <CommandBox command="/mineverify" />
      {loading && <p className={`text-xs ${themeColors.text.tertiary}`}>Création de la demande...</p>}
    </div>
  );
}

function LinkStepMessage({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <Image
        src="/branding/pmc/mark.png"
        alt="Logo Play-MC"
        width={52}
        height={52}
        className="h-[52px] w-[52px] shrink-0 object-contain"
      />
      <div className="min-w-0 flex-1">
        <p className={`text-sm ${themeColors.text.secondary} leading-relaxed`}>
          {children}
        </p>
      </div>
    </div>
  );
}

function CommandBox({ command }: { command: string }) {
  const [copied, setCopied] = useState(false);
  const resetTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (resetTimeoutRef.current) {
        clearTimeout(resetTimeoutRef.current);
      }
    };
  }, []);

  const copyCommand = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(command);
      } else {
        copyWithFallback(command);
      }

      setCopied(true);
      if (resetTimeoutRef.current) {
        clearTimeout(resetTimeoutRef.current);
      }
      resetTimeoutRef.current = window.setTimeout(() => {
        resetTimeoutRef.current = null;
        setCopied(false);
      }, 1400);
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
        className={`relative flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md ${themeColors.transition} ${
          copied
            ? themeColors.text.accent
            : `${themeColors.text.tertiary} ${themeColors.interactive.hoverAccentText}`
        }`}
      >
        <CopyIcon
          className={`absolute h-4 w-4 transition-all duration-200 ease-out ${
            copied ? '-translate-y-1 opacity-0' : 'translate-y-0 opacity-100'
          }`}
        />
        <CheckIcon
          className={`absolute h-4 w-4 transition-all duration-200 ease-out ${
            copied ? 'translate-y-0 opacity-100' : 'translate-y-1 opacity-0'
          }`}
          aria-hidden="true"
        />
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
