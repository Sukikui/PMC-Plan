import type { ReactNode } from 'react';
import { unlinkedIdentityClass } from '@/components/settings/account-identity-styles';
import { themeColors } from '@/lib/theme-colors';

interface IdentitySummaryProps {
  accent?: boolean;
  accentOnScopedGroupHover?: boolean;
  avatar: ReactNode;
  subtitle?: string | null;
  title: string;
  unlinked?: boolean;
}

export default function IdentitySummary({
  accent = false,
  accentOnScopedGroupHover = false,
  avatar,
  subtitle,
  title,
  unlinked = false,
}: IdentitySummaryProps) {
  const hoverClass = accentOnScopedGroupHover
    ? `${themeColors.interactive.scopedGroupHoverAccentText} ${themeColors.transition}`
    : '';
  const titleClass = unlinked
    ? unlinkedIdentityClass
    : `text-sm font-medium ${accent ? themeColors.text.accent : themeColors.text.primary} ${hoverClass}`;
  const subtitleClass = `${
    accent ? themeColors.text.accent : themeColors.text.tertiary
  } ${hoverClass}`;

  return (
    <div className="flex min-w-0 items-center gap-3">
      <div className="shrink-0">{avatar}</div>
      <div className="min-w-0">
        <p className={`truncate ${titleClass}`}>
          {title}
        </p>
        {subtitle && (
          <p className={`truncate text-xs ${subtitleClass}`} title={subtitle}>
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}
