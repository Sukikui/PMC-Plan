'use client';

import CheckIcon from '@/components/icons/CheckIcon';
import RefreshIcon from '@/components/icons/RefreshIcon';
import { themeColors } from '@/lib/theme-colors';
import type { MineVerifyPublicStatus } from '@/lib/mineverify/types';
import {
  getMinecraftLinkTimelineState,
  type MinecraftLinkTimelineState,
} from '@/lib/mineverify/timeline';

const STEPS = ['Serveur', 'Validation', 'Compte lié'] as const;

interface MinecraftLinkTimelineProps {
  status: MineVerifyPublicStatus['status'];
  loading: boolean;
  onFinish: () => void;
  onRetry: () => void;
}

export default function MinecraftLinkTimeline({
  status,
  loading,
  onFinish,
  onRetry,
}: MinecraftLinkTimelineProps) {
  const timeline = getMinecraftLinkTimelineState(status);

  return (
    <nav aria-label="Progression de la liaison Minecraft" className="pt-2">
      <ol className="flex items-start pb-5">
        {STEPS.map((label, index) => (
          <TimelineStep
            key={label}
            index={index}
            label={label}
            timeline={timeline}
            loading={loading}
            onAction={timeline.actionLabel === 'Terminer' ? onFinish : onRetry}
          />
        ))}
      </ol>
    </nav>
  );
}

function TimelineStep({
  index,
  label,
  timeline,
  loading,
  onAction,
}: {
  index: number;
  label: string;
  timeline: MinecraftLinkTimelineState;
  loading: boolean;
  onAction: () => void;
}) {
  const completed = index < timeline.activeStep;
  const active = index === timeline.activeStep;
  const actionable = index === timeline.actionStep;
  const actionLabel = actionable ? timeline.actionLabel : null;
  const nodeClass = getNodeClass({ actionLabel, active, completed });

  return (
    <>
      {index > 0 && (
        <TimelineConnector filled={index <= timeline.activeStep} />
      )}
      <li className="relative flex shrink-0 flex-col items-center">
        <button
          type="button"
          disabled={!actionable || loading}
          onClick={actionable ? onAction : undefined}
          aria-current={active ? 'step' : undefined}
          aria-label={actionLabel ?? `Étape ${index + 1} : ${label}`}
          className={`flex h-8 items-center justify-center overflow-hidden border text-xs font-semibold ${themeColors.util.roundedFull} ${themeColors.transitionAll} ${actionLabel ? 'w-24 gap-1.5 px-3' : 'w-8'} ${nodeClass} ${active && !actionable ? themeColors.util.animatePulse : ''} disabled:cursor-default`}
        >
          <TimelineNodeIcon
            actionLabel={actionLabel}
            completed={completed}
            loading={loading && actionable}
            stepNumber={index + 1}
          />
          {actionLabel && <span>{actionLabel}</span>}
        </button>
        <span className={`absolute left-1/2 top-[38px] -translate-x-1/2 whitespace-nowrap text-center text-[10px] ${active ? themeColors.text.primary : themeColors.text.tertiary}`}>
          {label}
        </span>
      </li>
    </>
  );
}

function TimelineConnector({ filled }: { filled: boolean }) {
  return (
    <li aria-hidden="true" className={`relative mx-1.5 mt-[15px] h-0.5 min-w-3 flex-1 overflow-hidden ${themeColors.minecraftLinkTimeline.track}`}>
      <span
        className={`absolute inset-y-0 left-0 ${themeColors.minecraftLinkTimeline.progress} ${themeColors.transitionAll} ${filled ? 'w-full' : 'w-0'}`}
      />
    </li>
  );
}

function TimelineNodeIcon({
  actionLabel,
  completed,
  loading,
  stepNumber,
}: {
  actionLabel: MinecraftLinkTimelineState['actionLabel'];
  completed: boolean;
  loading: boolean;
  stepNumber: number;
}) {
  if (actionLabel === 'Relancer') {
    return <RefreshIcon className={`h-3.5 w-3.5 ${loading ? themeColors.util.animateSpin : ''}`} />;
  }

  if (completed || actionLabel === 'Terminer') {
    return <CheckIcon className="h-3.5 w-3.5" aria-hidden="true" />;
  }

  return <span>{stepNumber}</span>;
}

function getNodeClass({
  actionLabel,
  active,
  completed,
}: {
  actionLabel: MinecraftLinkTimelineState['actionLabel'];
  active: boolean;
  completed: boolean;
}) {
  if (actionLabel === 'Relancer') return themeColors.minecraftLinkTimeline.retryActionNode;
  if (actionLabel === 'Terminer') return themeColors.minecraftLinkTimeline.actionNode;
  if (completed) return themeColors.minecraftLinkTimeline.completedNode;
  if (active) return themeColors.minecraftLinkTimeline.activeNode;
  return themeColors.minecraftLinkTimeline.idleNode;
}
