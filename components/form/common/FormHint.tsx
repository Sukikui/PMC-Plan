import type { ReactNode } from 'react';
import InformationCircleIcon from '@/components/icons/InformationCircleIcon';
import { themeColors } from '@/lib/theme-colors';

export default function FormHint({
  children,
  className = '',
  separated = false,
}: {
  children: ReactNode;
  className?: string;
  separated?: boolean;
}) {
  const separatorClass = separated
    ? `border-t pt-3 ${themeColors.border.light}`
    : '';

  return (
    <div className={`flex items-start gap-2 ${themeColors.text.tertiary} ${separatorClass} ${className}`}>
      <InformationCircleIcon className="mt-0.5 h-4 w-4 shrink-0" />
      <p className="text-xs leading-relaxed">{children}</p>
    </div>
  );
}
