import type {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  HTMLAttributes,
} from 'react';
import { themeColors } from '@/lib/theme-colors';

type PillActionTone = 'link' | 'surface';

interface PillActionOptions {
  fullWidth?: boolean;
  tone?: PillActionTone;
}

const pillLayoutClass = `inline-flex items-center gap-2 px-3 py-2 text-sm font-medium ${themeColors.util.roundedFull}`;

function getPillActionClass({
  className = '',
  fullWidth = false,
  tone = 'link',
}: PillActionOptions & { className?: string }) {
  const toneClass = tone === 'link'
    ? themeColors.link
    : `${themeColors.text.primary} ${themeColors.interactive.listRowHover}`;

  return `${pillLayoutClass} ${themeColors.interactive.focusRing} ${themeColors.transitionAll} ${toneClass} ${fullWidth ? 'w-full' : ''} ${className}`;
}

export function PillActionButton({
  className,
  fullWidth,
  tone,
  type = 'button',
  ...buttonProps
}: ButtonHTMLAttributes<HTMLButtonElement> & PillActionOptions) {
  return (
    <button
      type={type}
      className={getPillActionClass({ className, fullWidth, tone })}
      {...buttonProps}
    />
  );
}

export function PillActionLink({
  className,
  fullWidth,
  tone,
  ...anchorProps
}: AnchorHTMLAttributes<HTMLAnchorElement> & PillActionOptions) {
  return (
    <a
      className={getPillActionClass({ className, fullWidth, tone })}
      {...anchorProps}
    />
  );
}

export function PillSurface({
  className = '',
  fullWidth = false,
  ...divProps
}: HTMLAttributes<HTMLDivElement> & Pick<PillActionOptions, 'fullWidth'>) {
  return (
    <div
      className={`${pillLayoutClass} ${themeColors.text.primary} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...divProps}
    />
  );
}
